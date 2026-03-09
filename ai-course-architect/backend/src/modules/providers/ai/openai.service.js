/**
 * OpenAI Service
 *
 * Handles all AI-powered content generation using OpenAI API.
 * Enforces structured JSON output for course outlines and lesson content.
 * Supports both server-default and user-provided API configurations.
 */

import OpenAI from 'openai';
import { OPENAI_CONFIG } from '../../../config/env.js';
import { logDebug, logError, logWarn } from '../../../shared/utils/logger.js';

const createDefaultClient = () => {
  const clientOptions = {
    apiKey: OPENAI_CONFIG.API_KEY,
  };

  if (OPENAI_CONFIG.BASE_URL) {
    clientOptions.baseURL = OPENAI_CONFIG.BASE_URL;
  }

  return new OpenAI(clientOptions);
};

const defaultClient = createDefaultClient();

export const createCustomClient = (apiKey, model, baseUrl) => {
  const clientOptions = {
    apiKey,
  };

  if (baseUrl) {
    clientOptions.baseURL = baseUrl;
  }

  return new OpenAI(clientOptions);
};

export const getOpenAIClient = (userApiSettings) => {
  if (userApiSettings && userApiSettings.useCustomProvider && userApiSettings.apiKey) {
    logDebug('Using custom OpenAI client', {
      baseUrl: userApiSettings.baseUrl,
      model: userApiSettings.model || OPENAI_CONFIG.MODEL,
    });

    return {
      client: createCustomClient(
        userApiSettings.apiKey,
        userApiSettings.model || OPENAI_CONFIG.MODEL,
        userApiSettings.baseUrl || OPENAI_CONFIG.BASE_URL
      ),
      model: userApiSettings.model || OPENAI_CONFIG.MODEL,
      shouldUseCustom: true,
    };
  }

  logDebug('Using default OpenAI client', {
    baseUrl: OPENAI_CONFIG.BASE_URL,
    model: OPENAI_CONFIG.MODEL,
  });

  return {
    client: defaultClient,
    model: OPENAI_CONFIG.MODEL,
    shouldUseCustom: false,
  };
};

const OUTLINE_SYSTEM_PROMPT = `You are an expert curriculum designer and educator.
Your task is to create comprehensive, well-structured course outlines.

CRITICAL: You MUST respond with ONLY valid JSON. No markdown, no explanations, no code blocks.
The response must be a single JSON object matching this exact structure:

{
  "title": "Course Title",
  "description": "Brief course description (2-3 sentences)",
  "modules": [
    {
      "title": "Module Title",
      "microTopics": ["Topic 1", "Topic 2", "Topic 3"]
    }
  ]
}

Rules:
1. Create 4-6 modules per course
2. Each module should have 3-5 micro-topics
3. Order modules from beginner to advanced
4. Use clear, descriptive titles
5. Ensure logical progression of topics
6. Response must be parseable JSON`;

const LESSON_SYSTEM_PROMPT = `You are an expert educator who creates engaging, clear lesson content.

CRITICAL: You MUST respond with ONLY valid JSON. No markdown, no explanations, no code blocks.
The response must be a single JSON object matching this exact structure:

{
  "explanation": "Clear, comprehensive explanation of the concept (200-400 words). Use simple language. Break complex ideas into digestible parts.",
  "example": "A concrete, real-world example that illustrates the concept. Make it practical and relatable.",
  "analogy": "A simple analogy that helps beginners understand the concept by relating it to something familiar.",
  "keyTakeaways": [
    "Key point 1",
    "Key point 2",
    "Key point 3",
    "Key point 4"
  ],
  "practiceQuestions": [
    {
      "question": "Question 1 text?",
      "answer": "Detailed answer to question 1"
    },
    {
      "question": "Question 2 text?",
      "answer": "Detailed answer to question 2"
    },
    {
      "question": "Question 3 text?",
      "answer": "Detailed answer to question 3"
    }
  ]
}

Rules:
1. Explanation should be thorough but accessible
2. Example must be practical and real-world
3. Analogy should be simple and relatable
4. Include exactly 4 key takeaways
5. Include exactly 3 practice questions with detailed answers
6. Response must be parseable JSON`;

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const TRANSIENT_ERROR_CODES = [429, 500, 502, 503, 504];

const isTransientError = (error) => {
  if (error?.response?.status === 429) {
    return true;
  }

  if (TRANSIENT_ERROR_CODES.includes(error?.response?.status)) {
    return true;
  }

  if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
    return true;
  }

  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return true;
  }

  return false;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseJSONResponse = (content) => {
  try {
    let cleaned = content.trim();

    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```[\w]*\n?/, '');
      cleaned = cleaned.replace(/\n?```$/, '');
    }

    cleaned = cleaned.trim();

    if (!cleaned || cleaned.length === 0) {
      throw new Error('AI response content is empty');
    }

    return JSON.parse(cleaned);
  } catch (error) {
    logError('Failed to parse AI response as JSON', {
      error: error.message,
      preview: content.substring(0, 500),
    });
    throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
  }
};

export const generateCourseOutline = async (topic, userApiSettings = null) => {
  const { client, model } = getOpenAIClient(userApiSettings);

  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    throw new Error('Topic is required and must be a non-empty string');
  }

  const trimmedTopic = topic.trim();
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logDebug('Generating course outline', {
        topic: trimmedTopic,
        attempt,
        maxRetries: MAX_RETRIES,
        model,
      });

      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: OUTLINE_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Create a comprehensive course outline for: "${trimmedTopic}".

The course should progress from beginner to advanced level.
Include practical, real-world applications.
Structure the content for optimal learning progression.`,
          },
        ],
        max_tokens: OPENAI_CONFIG.MAX_TOKENS,
        temperature: OPENAI_CONFIG.TEMPERATURE,
        response_format: { type: 'json_object' },
      });

      logDebug('Received course outline response', {
        hasChoices: Array.isArray(response.choices),
        choicesLength: response.choices?.length,
        hasFirstChoice: Boolean(response.choices?.[0]),
        hasMessage: Boolean(response.choices?.[0]?.message),
        hasContent: Boolean(response.choices?.[0]?.message?.content),
      });

      if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
        logError('OpenAI returned empty choices for course outline', {
          responsePreview: JSON.stringify(response).slice(0, 500),
        });
        throw new Error('API returned empty choices array');
      }

      const firstChoice = response.choices[0];

      if (firstChoice.finish_reason === 'content_filter') {
        throw new Error('Content filtered by API safety policies');
      }

      const content = firstChoice.message?.content;

      if (!content) {
        logError('OpenAI returned empty content for course outline', {
          responsePreview: JSON.stringify(firstChoice).slice(0, 500),
        });
        throw new Error('Empty response content from OpenAI');
      }

      const outline = parseJSONResponse(content);

      if (!outline) {
        throw new Error('Failed to parse outline: parsed result is null/undefined');
      }

      if (!outline.title) {
        logWarn('Outline missing title, using fallback', { topic: trimmedTopic });
        outline.title = trimmedTopic;
      }

      if (!Array.isArray(outline.modules) || outline.modules.length === 0) {
        logWarn('Outline missing modules, using fallback', { topic: trimmedTopic });
        outline.modules = [{
          title: 'Introduction',
          microTopics: ['Getting Started'],
        }];
      }

      outline.modules = outline.modules.map((module, index) => {
        if (!module.title) {
          logWarn('Module missing title, using fallback', { index, topic: trimmedTopic });
          module.title = `Module ${index + 1}`;
        }
        if (!Array.isArray(module.microTopics) || module.microTopics.length === 0) {
          logWarn('Module missing microTopics, using fallback', {
            topic: trimmedTopic,
            moduleTitle: module.title,
          });
          module.microTopics = ['Topic Overview'];
        }
        return module;
      });

      logDebug('Course outline generated', {
        topic: trimmedTopic,
        title: outline.title,
        moduleCount: outline.modules.length,
      });

      return outline;
    } catch (error) {
      lastError = error;

      const status = error?.response?.status;

      if (status === 401) {
        logError('OpenAI API unauthorized for course outline', { status });
        throw new Error('OpenAI API unauthorized - please verify your API key');
      }

      logError('Course outline generation attempt failed', {
        topic: trimmedTopic,
        attempt,
        error: error.message,
      });

      if (attempt < MAX_RETRIES && isTransientError(error)) {
        const delay = RETRY_DELAY * attempt;
        logDebug('Retrying course outline generation', { topic: trimmedTopic, delay, attempt });
        await sleep(delay);
      } else if (attempt < MAX_RETRIES) {
        logDebug('Skipping retry for non-transient course outline error', {
          topic: trimmedTopic,
          error: error.message,
        });
        break;
      }
    }
  }

  throw new Error(`Failed to generate course outline after ${MAX_RETRIES} attempts: ${lastError.message}`);
};

export const generateLessonContent = async (topic, moduleTitle, courseTitle, userApiSettings = null, context = {}) => {
  const { client, model } = getOpenAIClient(userApiSettings);

  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    throw new Error('Topic is required and must be a non-empty string');
  }

  const trimmedTopic = topic.trim();
  const trimmedModuleTitle = moduleTitle?.trim() || 'Unknown Module';
  const trimmedCourseTitle = courseTitle?.trim() || 'Unknown Course';
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logDebug('Generating lesson content', {
        topic: trimmedTopic,
        moduleTitle: trimmedModuleTitle,
        courseTitle: trimmedCourseTitle,
        attempt,
        maxRetries: MAX_RETRIES,
        model,
      });

      const contextLines = [];

      if (context.difficulty) {
        contextLines.push(`- Difficulty Level: ${context.difficulty}`);
      }
      if (context.courseDescription) {
        contextLines.push(`- Course Description: ${context.courseDescription}`);
      }
      if (context.moduleIndex != null && context.totalModules != null) {
        contextLines.push(`- This is Module ${context.moduleIndex + 1} of ${context.totalModules}: "${trimmedModuleTitle}"`);
      }
      if (context.microTopicIndex != null && context.totalMicroTopics != null) {
        contextLines.push(`- This is Lesson ${context.microTopicIndex + 1} of ${context.totalMicroTopics} in this module`);
      }
      if (context.allModuleTitles?.length) {
        contextLines.push(`- All modules in course: ${context.allModuleTitles.map((t, i) => `${i + 1}. ${t}`).join(', ')}`);
      }
      if (context.siblingTopics?.length) {
        contextLines.push(`- All lessons in this module: ${context.siblingTopics.map((t, i) => `${i + 1}. ${t}`).join(', ')}`);
      }
      if (context.previousTopics?.length) {
        contextLines.push(`- Previous lessons in this module: ${context.previousTopics.join(', ')}`);
      } else if (context.microTopicIndex === 0) {
        contextLines.push('- This is the FIRST lesson in this module');
      }
      if (context.nextTopics?.length) {
        contextLines.push(`- Upcoming lessons in this module: ${context.nextTopics.join(', ')}`);
      } else if (
        context.microTopicIndex != null &&
        context.totalMicroTopics != null &&
        context.microTopicIndex === context.totalMicroTopics - 1
      ) {
        contextLines.push('- This is the LAST lesson in this module');
      }
      if (context.previousModuleTitle) {
        contextLines.push(`- Previous module: "${context.previousModuleTitle}"`);
      }
      if (context.nextModuleTitle) {
        contextLines.push(`- Next module: "${context.nextModuleTitle}"`);
      }

      const structuralContextBlock = contextLines.length > 0
        ? `\n\nCourse Structure Context:\n${contextLines.join('\n')}\n\nIMPORTANT INSTRUCTIONS:\n- Do NOT repeat content that would be covered in other listed lessons.\n- Tailor depth and complexity to the "${context.difficulty || 'beginner'}" level.\n- Build upon concepts from previous lessons where applicable.\n- Prepare the learner for upcoming topics without teaching them in detail.`
        : '';

      const summaryLines = [];
      if (context.previousContentSummaries?.length) {
        summaryLines.push(...context.previousContentSummaries);
      }
      if (context.currentModuleSummaries?.length) {
        for (const summary of context.currentModuleSummaries) {
          if (!summaryLines.includes(summary)) {
            summaryLines.push(summary);
          }
        }
      }

      const summaryContextBlock = summaryLines.length > 0
        ? `\n\nPreviously covered content (DO NOT repeat these concepts):\n${summaryLines.map((summary) => `- ${summary}`).join('\n')}`
        : '';

      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: LESSON_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Create detailed lesson content for:

Course: "${trimmedCourseTitle}"
Module: "${trimmedModuleTitle}"
Micro-topic: "${trimmedTopic}"${structuralContextBlock}${summaryContextBlock}

Make the content engaging, educational, and suitable for self-paced learning.`,
          },
        ],
        max_tokens: OPENAI_CONFIG.MAX_TOKENS,
        temperature: OPENAI_CONFIG.TEMPERATURE,
        response_format: { type: 'json_object' },
      });

      if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
        logError('OpenAI returned empty choices for lesson content', {
          topic: trimmedTopic,
          responsePreview: JSON.stringify(response).slice(0, 500),
        });
        throw new Error('API returned empty choices array');
      }

      const firstChoice = response.choices[0];

      if (firstChoice.finish_reason === 'content_filter') {
        throw new Error('Content filtered by API safety policies');
      }

      const content = firstChoice.message?.content;

      if (!content) {
        logError('OpenAI returned empty content for lesson content', {
          topic: trimmedTopic,
          responsePreview: JSON.stringify(firstChoice).slice(0, 500),
        });
        throw new Error('Empty response content from OpenAI');
      }

      const lesson = parseJSONResponse(content);

      const requiredFields = ['explanation', 'example', 'analogy', 'keyTakeaways', 'practiceQuestions'];
      for (const field of requiredFields) {
        if (!lesson[field]) {
          logWarn('Lesson field missing, using fallback', { topic: trimmedTopic, field });
          if (field === 'explanation') lesson.explanation = 'Content pending generation.';
          else if (field === 'example') lesson.example = 'Example pending generation.';
          else if (field === 'analogy') lesson.analogy = 'Analogy pending generation.';
          else if (field === 'keyTakeaways') lesson.keyTakeaways = ['Key takeaway pending'];
          else if (field === 'practiceQuestions') {
            lesson.practiceQuestions = [{ question: 'Question pending', answer: 'Answer pending' }];
          }
        }
      }

      if (!Array.isArray(lesson.keyTakeaways) || lesson.keyTakeaways.length === 0) {
        logWarn('Invalid keyTakeaways, using fallback', { topic: trimmedTopic });
        lesson.keyTakeaways = ['Key takeaway pending'];
      }

      if (!Array.isArray(lesson.practiceQuestions) || lesson.practiceQuestions.length === 0) {
        logWarn('Invalid practiceQuestions, using fallback', { topic: trimmedTopic });
        lesson.practiceQuestions = [{ question: 'Question pending', answer: 'Answer pending' }];
      }

      lesson.practiceQuestions = lesson.practiceQuestions.map((practiceQuestion, index) => {
        if (!practiceQuestion.question || !practiceQuestion.answer) {
          logWarn('Practice question missing required fields, using fallback', {
            topic: trimmedTopic,
            index,
          });
          return {
            question: practiceQuestion.question || 'Question pending',
            answer: practiceQuestion.answer || 'Answer pending',
          };
        }
        return practiceQuestion;
      });

      logDebug('Lesson content generated', {
        topic: trimmedTopic,
        moduleTitle: trimmedModuleTitle,
        courseTitle: trimmedCourseTitle,
      });

      return lesson;
    } catch (error) {
      lastError = error;

      const status = error?.response?.status || error?.status;
      const errorMessage = error?.message || '';
      const errorMessageLower = errorMessage.toLowerCase();

      if (status === 401) {
        logError('OpenAI API unauthorized for lesson generation', { status, topic: trimmedTopic });
        throw new Error('OpenAI API unauthorized - please verify your API key');
      }

      const is429 = status === 429 || errorMessage.startsWith('429 ');

      if (is429) {
        const isQuotaExceeded =
          error?.response?.data?.error?.type === 'insufficient_quota' ||
          errorMessageLower.includes('quota') ||
          errorMessageLower.includes('billing') ||
          errorMessageLower.includes('free-models-per-day') ||
          (errorMessageLower.includes('add') && errorMessageLower.includes('credits')) ||
          errorMessageLower.includes('daily limit') ||
          errorMessageLower.includes('monthly limit');

        if (isQuotaExceeded) {
          logError('OpenAI quota exceeded during lesson generation', { topic: trimmedTopic });
          const detail = errorMessage.includes('Add') ? ` (${errorMessage.split('.')[0].trim()})` : '';
          const quotaError = new Error(
            `OpenAI API rate limit exceeded: your free daily quota has been reached.${detail} Add credits or upgrade your plan at platform.openai.com to continue generating content.`
          );
          quotaError.code = 'OPENAI_QUOTA_EXCEEDED';
          throw quotaError;
        }

        logWarn('OpenAI per-minute rate limit hit', { topic: trimmedTopic });
      }

      if (
        (status === 400 || errorMessage.startsWith('400 ')) &&
        (error?.response?.data?.error?.code === 'context_length_exceeded' ||
          errorMessageLower.includes('context_length') ||
          errorMessageLower.includes('maximum context length') ||
          errorMessageLower.includes('context window'))
      ) {
        logError('OpenAI token/context limit exceeded', { topic: trimmedTopic });
        const tokenError = new Error(
          'OpenAI token limit exceeded for this request. The lesson context is too large. Content generation will continue for remaining topics.'
        );
        tokenError.code = 'OPENAI_TOKEN_LIMIT';
        throw tokenError;
      }

      logError('Lesson generation attempt failed', {
        topic: trimmedTopic,
        attempt,
        error: error.message,
      });

      if (attempt < MAX_RETRIES && isTransientError(error)) {
        const delay = RETRY_DELAY * attempt;
        logDebug('Retrying lesson generation', { topic: trimmedTopic, delay, attempt });
        await sleep(delay);
      } else if (attempt < MAX_RETRIES) {
        logDebug('Skipping retry for non-transient lesson error', {
          topic: trimmedTopic,
          error: error.message,
        });
        break;
      }
    }
  }

  throw new Error(`Failed to generate lesson content after ${MAX_RETRIES} attempts: ${lastError.message}`);
};

export const regenerateModule = async (topic, moduleTitle, existingModules = [], userApiSettings = null) => {
  const { client, model } = getOpenAIClient(userApiSettings);

  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    throw new Error('Topic is required and must be a non-empty string');
  }

  try {
    logDebug('Regenerating module', { topic, moduleTitle, model });

    const contextPrompt = existingModules.length > 0
      ? `\n\nContext - Other modules in this course:\n${existingModules.map((module) => `- ${module.title}`).join('\n')}`
      : '';

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `${OUTLINE_SYSTEM_PROMPT}\n\nYou are regenerating a SINGLE module. Return ONLY that one module in the modules array.`,
        },
        {
          role: 'user',
          content: `Regenerate the module "${moduleTitle}" for the course "${topic}".${contextPrompt}

Ensure the new module fits well with the existing course structure and maintains logical progression.`,
        },
      ],
      max_tokens: OPENAI_CONFIG.MAX_TOKENS,
      temperature: OPENAI_CONFIG.TEMPERATURE + 0.1,
      response_format: { type: 'json_object' },
    });

    if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
      logError('OpenAI returned empty choices for module regeneration', {
        topic,
        moduleTitle,
        responsePreview: JSON.stringify(response).slice(0, 500),
      });
      throw new Error('API returned empty choices array');
    }

    const firstChoice = response.choices[0];
    const content = firstChoice.message?.content;

    if (!content) {
      logError('OpenAI returned empty content for module regeneration', {
        topic,
        moduleTitle,
        responsePreview: JSON.stringify(firstChoice).slice(0, 500),
      });
      throw new Error('Empty response content from OpenAI');
    }

    const result = parseJSONResponse(content);

    if (!result.modules || result.modules.length === 0) {
      logWarn('Module regeneration returned no modules, using fallback', { topic, moduleTitle });
      return {
        title: moduleTitle,
        microTopics: ['Topic Overview'],
      };
    }

    logDebug('Module regenerated', { topic, moduleTitle });
    return result.modules[0];
  } catch (error) {
    logError('Module regeneration failed', { topic, moduleTitle, error: error.message });
    throw error;
  }
};

export const checkOpenAIHealth = async () => {
  try {
    await defaultClient.models.list();
    return true;
  } catch (error) {
    logError('OpenAI health check failed', { error: error.message });
    return false;
  }
};

export default {
  generateCourseOutline,
  generateLessonContent,
  regenerateModule,
  checkOpenAIHealth,
};
