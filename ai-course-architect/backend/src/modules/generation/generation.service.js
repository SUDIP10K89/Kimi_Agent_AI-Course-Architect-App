import Course from '../courses/course.model.js';
import User from '../users/user.model.js';
import * as openaiService from '../providers/ai/openai.service.js';
import * as youtubeService from '../providers/video/youtube.service.js';
import {
  sendComplete,
  sendError,
  sendEvent,
  sendProgress,
} from './generation.events.js';
import { decryptSecret } from '../../shared/utils/secrets.js';
import { logError, logInfo, logWarn } from '../../shared/utils/logger.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const updateGenerationState = async (
  courseId,
  {
    status,
    event,
    progress,
    message,
    error,
    startedAt,
    completedAt,
    failedAt,
    interruptedAt,
  }
) => {
  const now = new Date();
  const set = {
    'metadata.generation.status': status,
    'metadata.generation.event': event,
    'metadata.generation.progress': Math.max(0, Math.min(100, progress ?? 0)),
    'metadata.generation.message': message || null,
    'metadata.generation.updatedAt': now,
    'metadata.generation.error': error || null,
    'metadata.generationFailed': status === 'failed',
    'metadata.generationFailedReason': status === 'failed' ? error || message || null : null,
  };

  if (startedAt) {
    set['metadata.generation.startedAt'] = startedAt;
  }

  if (completedAt !== undefined) {
    set['metadata.generation.completedAt'] = completedAt;
  }

  if (failedAt !== undefined) {
    set['metadata.generation.failedAt'] = failedAt;
  }

  if (interruptedAt !== undefined) {
    set['metadata.generation.interruptedAt'] = interruptedAt;
  }

  await Course.updateOne({ _id: courseId }, { $set: set });
};

const emitProgressState = async (courseId, progress, message, additionalData = {}, options = {}) => {
  await updateGenerationState(courseId, {
    status: 'in-progress',
    event: 'progress',
    progress,
    message,
    error: null,
    startedAt: options.startedAt,
    completedAt: null,
    failedAt: null,
    interruptedAt: null,
  });

  sendProgress(courseId, progress, message, additionalData);
};

const emitFailureState = async (courseId, message, options = {}) => {
  await updateGenerationState(courseId, {
    status: 'failed',
    event: 'error',
    progress: options.progress ?? 0,
    message,
    error: options.error || message,
    failedAt: new Date(),
  });

  sendError(courseId, message);
};

const emitCompletionState = async (courseId, data) => {
  await updateGenerationState(courseId, {
    status: 'completed',
    event: 'complete',
    progress: 100,
    message: data.message,
    error: null,
    completedAt: new Date(),
    failedAt: null,
    interruptedAt: null,
  });

  sendComplete(courseId, data);
};

const sendWarning = (courseId, message) => {
  sendEvent(courseId, 'warning', { message, timestamp: new Date().toISOString() });
};

const getUserApiSettings = async (userId) => {
  try {
    const user = await User.findById(userId).select('+apiSettings.apiKey');

    if (user && user.apiSettings && user.apiSettings.useCustomProvider && user.apiSettings.apiKey) {
      return {
        apiKey: decryptSecret(user.apiSettings.apiKey),
        model: user.apiSettings.model,
        baseUrl: user.apiSettings.baseUrl,
        useCustomProvider: user.apiSettings.useCustomProvider,
      };
    }

    return null;
  } catch (error) {
    logError('Failed to fetch user API settings', { userId, error: error.message });
    return null;
  }
};

export const markInterruptedGenerationsOnStartup = async () => {
  const now = new Date();
  const result = await Course.updateMany(
    { 'metadata.generation.status': { $in: ['queued', 'in-progress'] } },
    {
      $set: {
        'metadata.generation.status': 'interrupted',
        'metadata.generation.event': 'interrupted',
        'metadata.generation.message': 'Generation stopped before completion. Resume to continue.',
        'metadata.generation.updatedAt': now,
        'metadata.generation.interruptedAt': now,
      },
    }
  );

  if (result.modifiedCount > 0) {
    logWarn('Marked interrupted generations after restart', { modifiedCount: result.modifiedCount });
  }
};

export const generateCourse = async (topic, userId) => {
  try {
    const userApiSettings = await getUserApiSettings(userId);
    const outline = await openaiService.generateCourseOutline(topic, userApiSettings);
    const cleanTopic = outline.title.replace(/^(learn|master|introduction to|basic|fundamentals of)\s+/i, '').trim();
    const now = new Date();

    const course = await Course.create({
      createdBy: userId,
      title: outline.title,
      description: outline.description,
      topic,
      searchTopic: cleanTopic,
      difficulty: 'beginner',
      modules: outline.modules.map((moduleOutline, moduleIndex) => ({
        title: moduleOutline.title,
        description: '',
        order: moduleIndex,
        microTopics: moduleOutline.microTopics.map((microTopicTitle, topicIndex) => ({
          title: microTopicTitle,
          order: topicIndex,
          isCompleted: false,
          content: null,
          videos: [],
        })),
      })),
      progress: {
        completedMicroTopics: 0,
        totalMicroTopics: outline.modules.reduce((total, moduleOutline) => total + moduleOutline.microTopics.length, 0),
        percentage: 0,
      },
      metadata: {
        generatedAt: now,
        lastAccessed: now,
        version: 1,
        generationFailed: false,
        generationFailedReason: null,
        generation: {
          status: 'queued',
          event: 'queued',
          progress: 0,
          message: 'Course created. Waiting to start content generation.',
          updatedAt: now,
          startedAt: now,
          completedAt: null,
          failedAt: null,
          interruptedAt: null,
          error: null,
        },
      },
    });

    generateCourseContent(course._id).catch(async (error) => {
      logError('Background course generation failed', { courseId: String(course._id), error: error.message });

      if (error.code === 'OPENAI_QUOTA_EXCEEDED') {
        sendWarning(course._id, error.message);
      }

      await emitFailureState(course._id, `Content generation failed: ${error.message}`, { error: error.message });
    });

    return course;
  } catch (error) {
    logError('Course generation failed', { userId, topic, error: error.message });
    throw error;
  }
};

export const generateCourseContent = async (courseId) => {
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      sendError(courseId, 'Course not found - generation stopped');
      return;
    }

    const userApiSettings = await getUserApiSettings(course.createdBy);
    await emitProgressState(courseId, 0, 'Starting content generation...', {}, { startedAt: new Date() });

    const totalItems = course.modules.reduce((total, module) => total + module.microTopics.length, 0);
    let processedItems = 0;

    const updateProgress = async (message) => {
      const progress = Math.round((processedItems / totalItems) * 100);
      await emitProgressState(courseId, progress, message);
    };

    const allModuleTitles = course.modules.map((module) => module.title);
    const contentSummaries = [];

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

          const lessonContext = {
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
            previousContentSummaries: contentSummaries.slice(-5),
            currentModuleSummaries: [...moduleSummaries],
          };

          const lessonContent = await openaiService.generateLessonContent(
            microTopic.title,
            module.title,
            course.title,
            userApiSettings,
            lessonContext
          );

          microTopic.content = lessonContent;
          processedItems++;
          await updateProgress(`Content generated for: ${microTopic.title}`);

          const summary = `${microTopic.title}: ${lessonContent.keyTakeaways?.slice(0, 2).join('; ') || 'Generated'}`;
          contentSummaries.push(summary);
          moduleSummaries.push(summary);

          await updateProgress(`Finding videos for: ${microTopic.title}`);

          try {
            const videos = await youtubeService.searchEducationalVideos(
              course.searchTopic || course.topic,
              microTopic.title
            );
            microTopic.videos = videos.slice(0, 3);
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
            sendError(courseId, `Failed to generate content for: ${microTopic.title}`);
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
      sendError(courseId, 'Course not found - generation stopped');
      return;
    }

    const userApiSettings = await getUserApiSettings(course.createdBy);
    const allModuleTitles = course.modules.map((module) => module.title);
    const contentSummaries = [];

    course.modules.forEach((module) => {
      module.microTopics.forEach((microTopic) => {
        if (microTopic.content && microTopic.content.explanation) {
          contentSummaries.push(`${microTopic.title}: ${microTopic.content.keyTakeaways?.slice(0, 2).join('; ') || 'Generated'}`);
        }
      });
    });

    const topicsNeedingContent = [];
    const topicsNeedingVideos = [];

    course.modules.forEach((module, moduleIndex) => {
      const siblingTopics = module.microTopics.map((microTopic) => microTopic.title);

      module.microTopics.forEach((microTopic, microTopicIndex) => {
        const hasContent = microTopic.content && microTopic.content.explanation;
        const hasVideos = microTopic.videos && Array.isArray(microTopic.videos) && microTopic.videos.length > 0;

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
        const videos = await youtubeService.searchEducationalVideos(
          course.searchTopic || course.topic,
          microTopic.title
        );
        microTopic.videos = videos.slice(0, 3);
        processedItems++;
        await course.save();
        await delay(500);
      } catch (error) {
        if (error.code === 'YOUTUBE_QUOTA_EXCEEDED' || error.code === 'YOUTUBE_ACCESS_DENIED') {
          sendWarning(courseId, error.message);
        } else {
          sendError(courseId, `Failed to fetch videos for: ${microTopic.title}`);
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

        const lessonContext = {
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
          previousContentSummaries: contentSummaries.slice(-5),
          currentModuleSummaries: contentSummaries.filter((summary) =>
            siblingTopics.some((topic) => summary.startsWith(`${topic}:`))
          ),
        };

        const lessonContent = await openaiService.generateLessonContent(
          microTopic.title,
          module.title,
          course.title,
          userApiSettings,
          lessonContext
        );

        microTopic.content = lessonContent;
        processedItems++;
        await updateProgress(`Content generated for: ${microTopic.title}`);
        contentSummaries.push(`${microTopic.title}: ${lessonContent.keyTakeaways?.slice(0, 2).join('; ') || 'Generated'}`);

        await updateProgress(`Finding videos for: ${microTopic.title}`);

        try {
          const videos = await youtubeService.searchEducationalVideos(course.searchTopic || course.topic, microTopic.title);
          microTopic.videos = videos.slice(0, 3);
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
          sendError(courseId, `Failed to generate content for: ${microTopic.title}`);
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
    const lessonContent = await openaiService.generateLessonContent(
      microTopic.title,
      module.title,
      course.title,
      userApiSettings
    );

    microTopic.content = lessonContent;

    const videos = await youtubeService.searchEducationalVideos(
      course.searchTopic || course.topic,
      microTopic.title
    );

    microTopic.videos = videos.slice(0, 3);
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

export const regenerateModule = async (courseId, moduleId) => {
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    const module = course.modules.id(moduleId);
    if (!module) {
      throw new Error('Module not found');
    }

    const userApiSettings = await getUserApiSettings(course.createdBy);
    const otherModules = course.modules.filter((existingModule) => existingModule._id.toString() !== moduleId);
    const newModule = await openaiService.regenerateModule(
      course.topic,
      module.title,
      otherModules,
      userApiSettings
    );

    module.title = newModule.title;
    module.microTopics = newModule.microTopics.map((title, index) => ({
      title,
      order: index,
      isCompleted: false,
      content: null,
      videos: [],
    }));

    await course.save();

    generateCourseContent(courseId).catch((error) => {
      logError('Background module regeneration content generation failed', {
        courseId: String(courseId),
        moduleId: String(moduleId),
        error: error.message,
      });
    });

    logInfo('Module regeneration queued', { courseId: String(courseId), moduleId: String(moduleId) });
    return module;
  } catch (error) {
    logError('Failed to regenerate module', {
      courseId: String(courseId),
      moduleId: String(moduleId),
      error: error.message,
    });
    throw error;
  }
};

export default {
  continueCourseContent,
  generateCourse,
  generateCourseContent,
  generateMicroTopicContent,
  markInterruptedGenerationsOnStartup,
  regenerateModule,
};
