import Course from '../../courses/course.model.js';
import * as openaiService from '../../providers/ai/openai.service.js';
import { logError, logWarn } from '../../../shared/utils/logger.js';
import { getUserApiSettings } from './outlineGenerator.js';
import { findVideosForMicroTopic } from './videoFinder.js';
import {
  emitCompletionState,
  emitFailureState,
  emitProgressState,
  sendWarning,
} from '../state/generationState.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildLessonContext = ({
  course,
  module,
  moduleIndex,
  microTopicIndex,
  siblingTopics,
  allModuleTitles,
  previousContentSummaries,
  currentModuleSummaries,
}) => ({
  difficulty: course.difficulty,
  courseDescription: course.description,
  moduleIndex,
  totalModules: course.modules.length,
  microTopicIndex,
  totalMicroTopics: module.microTopics.length,
  siblingTopics,
  allModuleTitles,
  previousTopics: siblingTopics.slice(0, microTopicIndex),
  nextTopics: siblingTopics.slice(microTopicIndex + 1),
  previousModuleTitle: moduleIndex > 0 ? allModuleTitles[moduleIndex - 1] : null,
  nextModuleTitle: moduleIndex < course.modules.length - 1 ? allModuleTitles[moduleIndex + 1] : null,
  previousContentSummaries,
  currentModuleSummaries,
});

export const generateCourseContent = async (courseId) => {
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      const error = new Error('Course not found - generation stopped');
      error.code = 'COURSE_NOT_FOUND';
      throw error;
    }

    const userApiSettings = await getUserApiSettings(course.createdBy);
    await emitProgressState(courseId, 0, 'Starting content generation...', {}, { startedAt: new Date() });

    const totalItems = course.modules.reduce((total, module) => total + module.microTopics.length, 0);
    let processedItems = 0;
    const allModuleTitles = course.modules.map((module) => module.title);
    const contentSummaries = [];

    const updateProgress = async (message) => {
      const progress = Math.round((processedItems / totalItems) * 100);
      await emitProgressState(courseId, progress, message);
    };

    for (const [moduleIndex, module] of course.modules.entries()) {
      await emitProgressState(
        courseId,
        Math.round((processedItems / totalItems) * 100),
        `Processing module: ${module.title}`
      );

      const siblingTopics = module.microTopics.map((microTopic) => microTopic.title);
      const moduleSummaries = [];

      for (const [microTopicIndex, microTopic] of module.microTopics.entries()) {
        try {
          await updateProgress(`Generating lesson: ${microTopic.title}`);

          const lessonContent = await openaiService.generateLessonContent(
            microTopic.title,
            module.title,
            course.title,
            userApiSettings,
            buildLessonContext({
              course,
              module,
              moduleIndex,
              microTopicIndex,
              siblingTopics,
              allModuleTitles,
              previousContentSummaries: contentSummaries.slice(-5),
              currentModuleSummaries: [...moduleSummaries],
            })
          );

          microTopic.content = lessonContent;
          processedItems++;
          await updateProgress(`Content generated for: ${microTopic.title}`);

          const summary = `${microTopic.title}: ${lessonContent.keyTakeaways?.slice(0, 2).join('; ') || 'Generated'}`;
          contentSummaries.push(summary);
          moduleSummaries.push(summary);

          await updateProgress(`Finding videos for: ${microTopic.title}`);

          try {
            microTopic.videos = await findVideosForMicroTopic(course, microTopic.title);
          } catch (videoError) {
            if (videoError.code === 'YOUTUBE_QUOTA_EXCEEDED' || videoError.code === 'YOUTUBE_ACCESS_DENIED') {
              sendWarning(courseId, videoError.message);
            }

            microTopic.videos = [];
          }

          processedItems++;
          await course.save();
          await delay(500);
        } catch (error) {
          if (error.code === 'OPENAI_QUOTA_EXCEEDED') {
            sendWarning(courseId, error.message);
            await emitFailureState(
              courseId,
              'Content generation stopped: OpenAI quota exceeded. Please check your billing at platform.openai.com.',
              {
                progress: Math.round((processedItems / totalItems) * 100),
                error: error.message,
              }
            );
            return;
          }

          if (error.code === 'OPENAI_TOKEN_LIMIT') {
            sendWarning(courseId, error.message);
          } else {
            logWarn('Failed to generate micro-topic during course generation', {
              courseId: String(courseId),
              microTopic: microTopic.title,
              error: error.message,
            });
          }
        }
      }
    }

    await emitCompletionState(courseId, {
      message: 'Course content generation complete',
      courseId: course._id,
      title: course.title,
    });
  } catch (error) {
    logError('Course content generation error', { courseId: String(courseId), error: error.message });
    await emitFailureState(courseId, error.message, { error: error.message });
    throw error;
  }
};

export const continueCourseContent = async (courseId) => {
  try {
    await emitProgressState(courseId, 0, 'Resuming content generation...', {}, { startedAt: new Date() });

    const course = await Course.findById(courseId);
    if (!course) {
      const error = new Error('Course not found - generation stopped');
      error.code = 'COURSE_NOT_FOUND';
      throw error;
    }

    const userApiSettings = await getUserApiSettings(course.createdBy);
    const allModuleTitles = course.modules.map((module) => module.title);
    const contentSummaries = [];

    course.modules.forEach((module) => {
      module.microTopics.forEach((microTopic) => {
        if (microTopic.content?.explanation) {
          contentSummaries.push(
            `${microTopic.title}: ${microTopic.content.keyTakeaways?.slice(0, 2).join('; ') || 'Generated'}`
          );
        }
      });
    });

    const topicsNeedingContent = [];
    const topicsNeedingVideos = [];

    course.modules.forEach((module, moduleIndex) => {
      const siblingTopics = module.microTopics.map((microTopic) => microTopic.title);

      module.microTopics.forEach((microTopic, microTopicIndex) => {
        const hasContent = microTopic.content?.explanation;
        const hasVideos = Array.isArray(microTopic.videos) && microTopic.videos.length > 0;

        if (!hasContent) {
          topicsNeedingContent.push({ microTopic, module, moduleIndex, microTopicIndex, siblingTopics });
        } else if (!hasVideos) {
          topicsNeedingVideos.push({ microTopic });
        }
      });
    });

    const totalItems = topicsNeedingContent.length + topicsNeedingVideos.length;
    if (totalItems === 0) {
      await emitCompletionState(courseId, {
        message: 'Course content is already complete!',
        courseId: course._id,
        title: course.title,
      });
      return { message: 'Course content is already complete', courseId };
    }

    let processedItems = 0;
    const updateProgress = async (message) => {
      const progress = Math.round((processedItems / totalItems) * 100);
      await emitProgressState(courseId, progress, message);
    };

    for (const { microTopic } of topicsNeedingVideos) {
      try {
        await updateProgress(`Finding videos for: ${microTopic.title}`);
        microTopic.videos = await findVideosForMicroTopic(course, microTopic.title);
        processedItems++;
        await course.save();
        await delay(500);
      } catch (error) {
        if (error.code === 'YOUTUBE_QUOTA_EXCEEDED' || error.code === 'YOUTUBE_ACCESS_DENIED') {
          sendWarning(courseId, error.message);
        } else {
          logWarn('Failed to fetch videos while resuming course generation', {
            courseId: String(courseId),
            microTopic: microTopic.title,
            error: error.message,
          });
        }
      }
    }

    for (const { microTopic, module, moduleIndex, microTopicIndex, siblingTopics } of topicsNeedingContent) {
      try {
        await updateProgress(`Generating lesson: ${microTopic.title}`);

        const lessonContent = await openaiService.generateLessonContent(
          microTopic.title,
          module.title,
          course.title,
          userApiSettings,
          buildLessonContext({
            course,
            module,
            moduleIndex,
            microTopicIndex,
            siblingTopics,
            allModuleTitles,
            previousContentSummaries: contentSummaries.slice(-5),
            currentModuleSummaries: contentSummaries.filter((summary) =>
              siblingTopics.some((topic) => summary.startsWith(`${topic}:`))
            ),
          })
        );

        microTopic.content = lessonContent;
        processedItems++;
        await updateProgress(`Content generated for: ${microTopic.title}`);
        contentSummaries.push(`${microTopic.title}: ${lessonContent.keyTakeaways?.slice(0, 2).join('; ') || 'Generated'}`);

        await updateProgress(`Finding videos for: ${microTopic.title}`);

        try {
          microTopic.videos = await findVideosForMicroTopic(course, microTopic.title);
        } catch (videoError) {
          if (videoError.code === 'YOUTUBE_QUOTA_EXCEEDED' || videoError.code === 'YOUTUBE_ACCESS_DENIED') {
            sendWarning(courseId, videoError.message);
          }

          microTopic.videos = [];
        }

        processedItems++;
        await course.save();
        await delay(500);
      } catch (error) {
        if (error.code === 'OPENAI_QUOTA_EXCEEDED') {
          sendWarning(courseId, error.message);
          await emitFailureState(
            courseId,
            'Content generation stopped: OpenAI quota exceeded. Please check your billing at platform.openai.com.',
            {
              progress: Math.round((processedItems / totalItems) * 100),
              error: error.message,
            }
          );
          return { message: 'Stopped: OpenAI quota exceeded', courseId, processedItems, totalItems };
        }

        if (error.code === 'OPENAI_TOKEN_LIMIT') {
          sendWarning(courseId, error.message);
        } else {
          logWarn('Failed to generate micro-topic while resuming course generation', {
            courseId: String(courseId),
            microTopic: microTopic.title,
            error: error.message,
          });
        }
      }
    }

    await emitCompletionState(courseId, {
      message: 'Course content generation continued and completed',
      courseId: course._id,
      title: course.title,
    });

    return {
      message: 'Course content generation continued',
      courseId,
      processedItems,
      totalItems,
    };
  } catch (error) {
    logError('Continue course generation error', { courseId: String(courseId), error: error.message });
    await emitFailureState(courseId, error.message, { error: error.message });
    throw error;
  }
};

export const generateMicroTopicContent = async (courseId, moduleId, microTopicId) => {
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const module = course.modules.id(moduleId);
    if (!module) {
      throw new Error('Module not found');
    }

    const microTopic = module.microTopics.id(microTopicId);
    if (!microTopic) {
      throw new Error('Micro-topic not found');
    }

    const userApiSettings = await getUserApiSettings(course.createdBy);
    microTopic.content = await openaiService.generateLessonContent(
      microTopic.title,
      module.title,
      course.title,
      userApiSettings
    );

    microTopic.videos = await findVideosForMicroTopic(course, microTopic.title);
    await course.save();

    return microTopic;
  } catch (error) {
    logError('Failed to generate micro-topic content', {
      courseId: String(courseId),
      moduleId: String(moduleId),
      microTopicId: String(microTopicId),
      error: error.message,
    });
    throw error;
  }
};
