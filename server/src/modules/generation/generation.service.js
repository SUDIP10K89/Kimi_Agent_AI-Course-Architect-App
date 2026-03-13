import Course from '../courses/course.model.js';
import * as openaiService from '../providers/ai/openai.service.js';
import { logError, logInfo } from '../../shared/utils/logger.js';
import {
  continueCourseContent,
  generateCourseContent,
  generateMicroTopicContent,
} from './services/contentGenerator.service.js';
import {
  createCourseFromOutline,
  getUserApiSettings,
} from './services/outlineGenerator.service.js';
import {
  markInterruptedGenerationsOnStartup,
  updateGenerationState,
} from './state/generationState.js';

export { continueCourseContent, generateCourseContent, generateMicroTopicContent, markInterruptedGenerationsOnStartup };

export const generateCourse = async (topic, userId) => {
  try {
    const course = await createCourseFromOutline(topic, userId);

    generateCourseContent(course._id).catch(async (error) => {
      logError('Background course generation failed', { courseId: String(course._id), error: error.message });
      await updateGenerationState(course._id, {
        status: 'failed',
        event: 'error',
        progress: 0,
        message: `Content generation failed: ${error.message}`,
        error: error.message,
        failedAt: new Date(),
      });
    });

    return course;
  } catch (error) {
    logError('Course generation failed', { userId, topic, error: error.message });
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

export { updateGenerationState };

export default {
  continueCourseContent,
  generateCourse,
  generateCourseContent,
  generateMicroTopicContent,
  markInterruptedGenerationsOnStartup,
  regenerateModule,
  updateGenerationState,
};
