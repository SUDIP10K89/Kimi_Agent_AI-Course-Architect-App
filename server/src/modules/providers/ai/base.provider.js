/**
 * Base AI Provider Interface
 *
 * Abstract base class defining the contract for all AI provider implementations.
 * Ensures consistent API across different AI providers (OpenAI, Gemini, Anthropic, etc.).
 */

export class BaseAiProvider {
  constructor(providerName) {
    if (new.target === BaseAiProvider) {
      throw new Error('BaseAiProvider is an abstract class and cannot be instantiated directly');
    }
    this.providerName = providerName;
  }

  /**
   * Generate a course outline for a given topic
   * @param {string} topic - The course topic
   * @param {object} userApiSettings - Optional user-specific API settings
   * @returns {Promise<object>} Course outline with title, description, and modules
   */
  async generateCourseOutline(topic, userApiSettings = null) {
    throw new Error('Method "generateCourseOutline" must be implemented by subclass');
  }

  /**
   * Generate detailed lesson content for a micro-topic
   * @param {string} topic - The micro-topic title
   * @param {string} moduleTitle - The parent module title
   * @param {string} courseTitle - The course title
   * @param {object} userApiSettings - Optional user-specific API settings
   * @param {object} context - Additional context for content generation
   * @returns {Promise<object>} Lesson content with explanation, example, analogy, keyTakeaways, practiceQuestions
   */
  async generateLessonContent(topic, moduleTitle, courseTitle, userApiSettings = null, context = {}) {
    throw new Error('Method "generateLessonContent" must be implemented by subclass');
  }

  /**
   * Regenerate a specific module with new content
   * @param {string} topic - The course topic
   * @param {string} moduleTitle - The module title to regenerate
   * @param {array} existingModules - Other modules in the course for context
   * @param {object} userApiSettings - Optional user-specific API settings
   * @returns {Promise<object>} New module with title and microTopics
   */
  async regenerateModule(topic, moduleTitle, existingModules = [], userApiSettings = null) {
    throw new Error('Method "regenerateModule" must be implemented by subclass');
  }

  /**
   * Generate embedding vector for text
   * @param {string} text - The text to embed
   * @returns {Promise<Array<number>>} Embedding vector
   */
  async generateEmbedding(text) {
    throw new Error('Method "generateEmbedding" must be implemented by subclass');
  }

  /**
   * Generate embedding for video title and description
   * @param {string} title - Video title
   * @param {string} description - Video description (optional)
   * @returns {Promise<Array<number>>} Embedding vector
   */
  async generateVideoEmbedding(title, description = '') {
    throw new Error('Method "generateVideoEmbedding" must be implemented by subclass');
  }

  /**
   * Compute similarity between two vectors
   * @param {Array<number>} vecA - First vector
   * @param {Array<number>} vecB - Second vector
   * @returns {number} Similarity score
   */
  computeSimilarity(vecA, vecB) {
    throw new Error('Method "computeSimilarity" must be implemented by subclass');
  }

  /**
   * Check provider health/status
   * @returns {Promise<boolean>} True if provider is healthy
   */
  async checkHealth() {
    throw new Error('Method "checkHealth" must be implemented by subclass');
  }

  /**
   * Get provider name
   * @returns {string} Provider name
   */
  getProviderName() {
    return this.providerName;
  }
}

export default BaseAiProvider;
