/**
 * OpenAI Service
 * 
 * Handles all AI-powered content generation using OpenAI API.
 * Enforces structured JSON output for course outlines and lesson content.
 */

import OpenAI from 'openai';
import { OPENAI_CONFIG } from '../config/env.js';

// Initialize OpenAI client
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: OPENAI_CONFIG.API_KEY,
});

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

    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON parsing error:', error.message);
    console.error('Raw content:', content.substring(0, 500));
    throw new Error('Failed to parse AI response as JSON');
  }
};

/**
 * Generate course outline from topic
 * @param {string} topic - The course topic
 * @returns {Promise<Object>} Course outline object
 */
export const generateCourseOutline = async (topic) => {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Generating course outline for "${topic}" (attempt ${attempt}/${MAX_RETRIES})...`);

      const response = await openai.chat.completions.create({
        model: OPENAI_CONFIG.MODEL,
        messages: [
          { role: 'system', content: OUTLINE_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Create a comprehensive course outline for: "${topic}". 
            
The course should progress from beginner to advanced level.
Include practical, real-world applications.
Structure the content for optimal learning progression.`
          },
        ],
        max_tokens: OPENAI_CONFIG.MAX_TOKENS,
        temperature: OPENAI_CONFIG.TEMPERATURE,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const outline = parseJSONResponse(content);

      // Validate outline structure
      if (!outline.title || !Array.isArray(outline.modules)) {
        throw new Error('Invalid outline structure: missing title or modules array');
      }

      // Validate each module
      outline.modules.forEach((module, index) => {
        if (!module.title || !Array.isArray(module.microTopics)) {
          throw new Error(`Invalid module structure at index ${index}`);
        }
      });

      console.log(`✅ Course outline generated: "${outline.title}" with ${outline.modules.length} modules`);

      return outline;

    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);

      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Retrying in ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY * attempt);
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
 * @returns {Promise<Object>} Lesson content object
 */
export const generateLessonContent = async (topic, moduleTitle, courseTitle) => {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Generating lesson content for "${topic}" (attempt ${attempt}/${MAX_RETRIES})...`);

      const response = await openai.chat.completions.create({
        model: OPENAI_CONFIG.MODEL,
        messages: [
          { role: 'system', content: LESSON_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Create detailed lesson content for:

Course: "${courseTitle}"
Module: "${moduleTitle}"
Micro-topic: "${topic}"

Make the content engaging, educational, and suitable for self-paced learning.`
          },
        ],
        max_tokens: OPENAI_CONFIG.MAX_TOKENS,
        temperature: OPENAI_CONFIG.TEMPERATURE,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const lesson = parseJSONResponse(content);

      // Validate lesson structure
      const requiredFields = ['explanation', 'example', 'analogy', 'keyTakeaways', 'practiceQuestions'];
      for (const field of requiredFields) {
        if (!lesson[field]) {
          throw new Error(`Invalid lesson structure: missing ${field}`);
        }
      }

      // Validate arrays
      if (!Array.isArray(lesson.keyTakeaways) || lesson.keyTakeaways.length === 0) {
        throw new Error('Invalid lesson structure: keyTakeaways must be a non-empty array');
      }

      if (!Array.isArray(lesson.practiceQuestions) || lesson.practiceQuestions.length === 0) {
        throw new Error('Invalid lesson structure: practiceQuestions must be a non-empty array');
      }

      console.log(`✅ Lesson content generated for "${topic}"`);

      return lesson;

    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);

      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Retrying in ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY * attempt);
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
 * @returns {Promise<Object>} New module object
 */
export const regenerateModule = async (topic, moduleTitle, existingModules = []) => {
  try {
    console.log(`🔄 Regenerating module "${moduleTitle}"...`);

    const contextPrompt = existingModules.length > 0
      ? `\n\nContext - Other modules in this course:\n${existingModules.map(m => `- ${m.title}`).join('\n')}`
      : '';

    const response = await openai.chat.completions.create({
      model: OPENAI_CONFIG.MODEL,
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

    const content = response.choices[0]?.message?.content;
    const result = parseJSONResponse(content);

    if (!result.modules || result.modules.length === 0) {
      throw new Error('No module returned in regeneration');
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
    await openai.models.list();
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
