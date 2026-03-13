import Course from '../../courses/course.model.js';
import User from '../../users/user.model.js';
import * as openaiService from '../../providers/ai/openai.service.js';
import { decryptSecret } from '../../../shared/utils/secrets.js';
import { logError } from '../../../shared/utils/logger.js';

export const getUserApiSettings = async (userId) => {
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

export const createCourseFromOutline = async (topic, userId) => {
  const userApiSettings = await getUserApiSettings(userId);
  const outline = await openaiService.generateCourseOutline(topic, userApiSettings);
  const cleanTopic = outline.title.replace(/^(learn|master|introduction to|basic|fundamentals of)\s+/i, '').trim();
  const now = new Date();

  return Course.create({
    createdBy: userId,
    title: outline.title,
    description: outline.description,
    topic,
    searchTopic: cleanTopic,
    difficulty: 'intermediate',
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
      totalMicroTopics: outline.modules.reduce(
        (total, moduleOutline) => total + moduleOutline.microTopics.length,
        0
      ),
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
};
