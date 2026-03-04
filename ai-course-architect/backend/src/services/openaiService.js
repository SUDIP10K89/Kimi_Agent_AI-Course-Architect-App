/**
 * OpenAI Service
 * 
 * Handles all AI-powered content generation using OpenAI API.
 * Enforces structured JSON output for course outlines and lesson content.
 * Supports both server-default and user-provided API configurations.
 */

import OpenAI from 'openai';
import { OPENAI_CONFIG } from '../config/env.js';

// Default client using server environment variables
const createDefaultClient = () => {
  const clientOptions = {
    apiKey: OPENAI_CONFIG.API_KEY,
  };

  if (OPENAI_CONFIG.BASE_URL) {
    clientOptions.baseURL = OPENAI_CONFIG.BASE_URL;
  }

  return new OpenAI(clientOptions);
};

// Create default client
const defaultClient = createDefaultClient();

/**
 * Create a custom OpenAI client with user-provided settings
 * @param {string} apiKey - User's API key
 * @param {string} model - Model name (defaults to user's setting or server default)
 * @param {string} baseUrl - Base URL for the API
 * @returns {OpenAI} OpenAI client instance
 */
export const createCustomClient = (apiKey, model, baseUrl) => {
  const clientOptions = {
    apiKey: apiKey,
  };

  if (baseUrl) {
    clientOptions.baseURL = baseUrl;
  }

  return new OpenAI(clientOptions);
};

/**
 * Get the appropriate OpenAI client based on user settings
 * @param {Object} userApiSettings - User's API settings (optional)
 * @returns {Object} - { client: OpenAI, model: string, shouldUseCustom: boolean }
 */
export const getOpenAIClient = (userApiSettings) => {
  // Check if user has custom API settings and wants to use them
  if (userApiSettings && userApiSettings.useCustomProvider && userApiSettings.apiKey) {
    console.log('🎯 Using custom API client:', userApiSettings.baseUrl, userApiSettings.model);
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

  // Fall back to default client
  console.log('🎯 Using default API client:', OPENAI_CONFIG.BASE_URL, OPENAI_CONFIG.MODEL);
  return {
    client: defaultClient,
    model: OPENAI_CONFIG.MODEL,
    shouldUseCustom: false,
  };
};


/**
 * System prompt for course outline generation
 * Enforces strict JSON output format
 */
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

/**
 * System prompt for lesson content generation
 */
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

/**
 * Retry configuration for API calls
 */
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Transient errors that should trigger a retry
const TRANSIENT_ERROR_CODES = [429, 500, 502, 503, 504];

/**
 * Check if an error is transient and worth retrying
 * @param {Error} error - The error to check
 * @returns {boolean} True if the error is transient
 */
const isTransientError = (error) => {
  // Check for rate limit (429)
  if (error?.response?.status === 429) {
    return true;
  }
  // Check for server errors (5xx)
  if (TRANSIENT_ERROR_CODES.includes(error?.response?.status)) {
    return true;
  }
  // Check for timeout errors
  if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
    return true;
  }
  // Check for network errors
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return true;
  }
  return false;
};

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Parse JSON response from OpenAI
 * Handles common JSON parsing issues
 * @param {string} content - Raw response content
 * @returns {Object} Parsed JSON object
 * @throws {Error} If parsing fails
 */
const parseJSONResponse = (content) => {
  try {
    // Remove markdown code blocks if present
    let cleaned = content.trim();

    // Remove ```json and ``` markers
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```[\w]*\n?/, '');
      cleaned = cleaned.replace(/\n?```$/, '');
    }

    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();

    // Check if content is empty
    if (!cleaned || cleaned.length === 0) {
      throw new Error('AI response content is empty');
    }

    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON parsing error:', error.message);
    console.error('Raw content:', content.substring(0, 500));
    throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
  }
};

/**
 * Generate course outline from topic
 * @param {string} topic - The course topic
 * @param {Object} userApiSettings - User's API settings (optional)
 * @returns {Promise<Object>} Course outline object
 */
export const generateCourseOutline = async (topic, userApiSettings = null) => {
  // Get the appropriate client based on user settings
  const { client, model } = getOpenAIClient(userApiSettings);
  
  // Validate input
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    throw new Error('Topic is required and must be a non-empty string');
  }

  const trimmedTopic = topic.trim();
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Generating course outline for "${trimmedTopic}" (attempt ${attempt}/${MAX_RETRIES})...`);

      console.log(`📡 Making API call with model: ${model}`);
      
      const response = await client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: OUTLINE_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Create a comprehensive course outline for: "${trimmedTopic}". 
            
The course should progress from beginner to advanced level.
Include practical, real-world applications.
Structure the content for optimal learning progression.`
          },
        ],
        max_tokens: OPENAI_CONFIG.MAX_TOKENS,
        temperature: OPENAI_CONFIG.TEMPERATURE,
        response_format: { type: 'json_object' },
      });

      // DEBUG: Log full response structure for debugging
      console.log('📡 API Response structure:', {
        hasChoices: Array.isArray(response.choices),
        choicesLength: response.choices?.length,
        hasFirstChoice: !!response.choices?.[0],
        hasMessage: !!response.choices?.[0]?.message,
        hasContent: !!response.choices?.[0]?.message?.content,
      });

      // Safety check: Ensure response has choices
      if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
        console.error('❌ Empty choices array in API response:', JSON.stringify(response).slice(0, 500));
        throw new Error('API returned empty choices array');
      }

      const firstChoice = response.choices[0];
      
      // Check for refusal or other special cases
      if (firstChoice.finish_reason === 'content_filter') {
        throw new Error('Content filtered by API safety policies');
      }

      const content = firstChoice.message?.content;

      if (!content) {
        console.error('❌ Empty content in API response:', JSON.stringify(firstChoice).slice(0, 500));
        throw new Error('Empty response content from OpenAI');
      }

      const outline = parseJSONResponse(content);

      // Validate outline structure with fallback
      if (!outline) {
        throw new Error('Failed to parse outline: parsed result is null/undefined');
      }

      if (!outline.title) {
        console.warn('⚠️ Outline missing title, using fallback');
        outline.title = trimmedTopic;
      }

      if (!Array.isArray(outline.modules) || outline.modules.length === 0) {
        console.warn('⚠️ Outline missing modules, using fallback');
        outline.modules = [{
          title: 'Introduction',
          microTopics: ['Getting Started']
        }];
      }

      // Validate each module with fallback
      outline.modules = outline.modules.map((module, index) => {
        if (!module.title) {
          console.warn(`⚠️ Module at index ${index} missing title, using fallback`);
          module.title = `Module ${index + 1}`;
        }
        if (!Array.isArray(module.microTopics) || module.microTopics.length === 0) {
          console.warn(`⚠️ Module "${module.title}" missing microTopics, using fallback`);
          module.microTopics = ['Topic Overview'];
        }
        return module;
      });

      console.log(`✅ Course outline generated: "${outline.title}" with ${outline.modules.length} modules`);

      return outline;

    } catch (error) {
      lastError = error;

      const status = error?.response?.status;
      
      // Handle authentication errors - don't retry
      if (status === 401) {
        console.error(`❌ Unauthorized (${status}) - invalid or missing OpenAI API key`);
        throw new Error('OpenAI API unauthorized - please verify your API key');
      }

      console.error(`❌ Attempt ${attempt} failed:`, error.message);

      // Only retry on transient errors
      if (attempt < MAX_RETRIES && isTransientError(error)) {
        const delay = RETRY_DELAY * attempt;
        console.log(`⏳ Retrying in ${delay}ms (transient error detected)...`);
        await sleep(delay);
      } else if (attempt < MAX_RETRIES) {
        // For non-transient errors, log but don't retry
        console.log(`⏭️ Skipping retry for non-transient error: ${error.message}`);
        break;
      }
    }
  }

  throw new Error(`Failed to generate course outline after ${MAX_RETRIES} attempts: ${lastError.message}`);
};

/**
 * Generate detailed lesson content for a micro-topic
 * @param {string} topic - The micro-topic title
 * @param {string} moduleTitle - Parent module title (for context)
 * @param {string} courseTitle - Parent course title (for context)
 * @param {Object} userApiSettings - User's API settings (optional)
 * @returns {Promise<Object>} Lesson content object
 */
export const generateLessonContent = async (topic, moduleTitle, courseTitle, userApiSettings = null) => {
  // Get the appropriate client based on user settings
  const { client, model } = getOpenAIClient(userApiSettings);
  
  // Validate input
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    throw new Error('Topic is required and must be a non-empty string');
  }

  const trimmedTopic = topic.trim();
  const trimmedModuleTitle = moduleTitle?.trim() || 'Unknown Module';
  const trimmedCourseTitle = courseTitle?.trim() || 'Unknown Course';
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Generating lesson content for "${trimmedTopic}" (attempt ${attempt}/${MAX_RETRIES})...`);

      const response = await client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: LESSON_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Create detailed lesson content for:

Course: "${trimmedCourseTitle}"
Module: "${trimmedModuleTitle}"
Micro-topic: "${trimmedTopic}"

Make the content engaging, educational, and suitable for self-paced learning.`
          },
        ],
        max_tokens: OPENAI_CONFIG.MAX_TOKENS,
        temperature: OPENAI_CONFIG.TEMPERATURE,
        response_format: { type: 'json_object' },
      });

      // Safety check: Ensure response has choices
      if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
        console.error('❌ Empty choices array in API response:', JSON.stringify(response).slice(0, 500));
        throw new Error('API returned empty choices array');
      }

      const firstChoice = response.choices[0];
      
      // Check for refusal or other special cases
      if (firstChoice.finish_reason === 'content_filter') {
        throw new Error('Content filtered by API safety policies');
      }

      const content = firstChoice.message?.content;

      if (!content) {
        console.error('❌ Empty content in API response:', JSON.stringify(firstChoice).slice(0, 500));
        throw new Error('Empty response content from OpenAI');
      }

      const lesson = parseJSONResponse(content);

      // Validate lesson structure with fallback
      const requiredFields = ['explanation', 'example', 'analogy', 'keyTakeaways', 'practiceQuestions'];
      for (const field of requiredFields) {
        if (!lesson[field]) {
          console.warn(`⚠️ Lesson missing "${field}", adding fallback`);
          if (field === 'explanation') lesson.explanation = 'Content pending generation.';
          else if (field === 'example') lesson.example = 'Example pending generation.';
          else if (field === 'analogy') lesson.analogy = 'Analogy pending generation.';
          else if (field === 'keyTakeaways') lesson.keyTakeaways = ['Key takeaway pending'];
          else if (field === 'practiceQuestions') lesson.practiceQuestions = [{ question: 'Question pending', answer: 'Answer pending' }];
        }
      }

      // Validate arrays with fallback
      if (!Array.isArray(lesson.keyTakeaways) || lesson.keyTakeaways.length === 0) {
        console.warn('⚠️ Invalid keyTakeaways, using fallback');
        lesson.keyTakeaways = ['Key takeaway pending'];
      }

      if (!Array.isArray(lesson.practiceQuestions) || lesson.practiceQuestions.length === 0) {
        console.warn('⚠️ Invalid practiceQuestions, using fallback');
        lesson.practiceQuestions = [{ question: 'Question pending', answer: 'Answer pending' }];
      }

      console.log(`✅ Lesson content generated for "${trimmedTopic}"`);

      return lesson;

    } catch (error) {
      lastError = error;

      const status = error?.response?.status;
      if (status === 401) {
        console.error(`❌ Unauthorized (${status}) - invalid or missing OpenAI API key`);
        throw new Error('OpenAI API unauthorized - please verify your API key');
      }

      console.error(`❌ Attempt ${attempt} failed:`, error.message);

      // Only retry on transient errors
      if (attempt < MAX_RETRIES && isTransientError(error)) {
        const delay = RETRY_DELAY * attempt;
        console.log(`⏳ Retrying in ${delay}ms (transient error detected)...`);
        await sleep(delay);
      } else if (attempt < MAX_RETRIES) {
        console.log(`⏭️ Skipping retry for non-transient error: ${error.message}`);
        break;
      }
    }
  }

  throw new Error(`Failed to generate lesson content after ${MAX_RETRIES} attempts: ${lastError.message}`);
};

/**
 * Regenerate a specific module's content
 * @param {string} topic - Course topic
 * @param {string} moduleTitle - Module to regenerate
 * @param {Array} existingModules - Other existing modules (for context)
 * @param {Object} userApiSettings - User's API settings (optional)
 * @returns {Promise<Object>} New module object
 */
export const regenerateModule = async (topic, moduleTitle, existingModules = [], userApiSettings = null) => {
  // Get the appropriate client based on user settings
  const { client, model } = getOpenAIClient(userApiSettings);
  
  // Validate input
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    throw new Error('Topic is required and must be a non-empty string');
  }

  try {
    console.log(`🔄 Regenerating module "${moduleTitle}"...`);

    const contextPrompt = existingModules.length > 0
      ? `\n\nContext - Other modules in this course:\n${existingModules.map(m => `- ${m.title}`).join('\n')}`
      : '';

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: `${OUTLINE_SYSTEM_PROMPT}\n\nYou are regenerating a SINGLE module. Return ONLY that one module in the modules array.`
        },
        {
          role: 'user',
          content: `Regenerate the module "${moduleTitle}" for the course "${topic}".${contextPrompt}
          
Ensure the new module fits well with the existing course structure and maintains logical progression.`
        },
      ],
      max_tokens: OPENAI_CONFIG.MAX_TOKENS,
      temperature: OPENAI_CONFIG.TEMPERATURE + 0.1, // Slightly more creative
      response_format: { type: 'json_object' },
    });

    // Safety check: Ensure response has choices
    if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
      console.error('❌ Empty choices array in API response:', JSON.stringify(response).slice(0, 500));
      throw new Error('API returned empty choices array');
    }

    const firstChoice = response.choices[0];
    const content = firstChoice.message?.content;
    
    if (!content) {
      console.error('❌ Empty content in API response:', JSON.stringify(firstChoice).slice(0, 500));
      throw new Error('Empty response content from OpenAI');
    }

    const result = parseJSONResponse(content);

    if (!result.modules || result.modules.length === 0) {
      console.warn('⚠️ No modules returned in regeneration, using fallback');
      return {
        title: moduleTitle,
        microTopics: ['Topic Overview']
      };
    }

    console.log(`✅ Module "${moduleTitle}" regenerated`);

    return result.modules[0];

  } catch (error) {
    console.error('❌ Module regeneration failed:', error.message);
    throw error;
  }
};

/**
 * Health check for OpenAI API
 * @returns {Promise<boolean>} True if API is accessible
 */
export const checkOpenAIHealth = async () => {
  try {
    await defaultClient.models.list();
    return true;
  } catch (error) {
    console.error('OpenAI health check failed:', error.message);
    return false;
  }
};

export default {
  generateCourseOutline,
  generateLessonContent,
  regenerateModule,
  checkOpenAIHealth,
};
