/**
 * Gemini Service
 *
 * Handles all AI-powered content generation using Google's Gemini API.
 * Specifically focused on embedding generation for semantic matching.
 */

import { GoogleGenAI } from '@google/genai';
import { GEMINI_CONFIG } from '../../../config/env.js';
import { logDebug, logError, logWarn } from '../../../shared/utils/logger.js';
import { BaseAiProvider } from './base.provider.js';

const createDefaultClient = () => {
    return new GoogleGenAI({ apiKey: GEMINI_CONFIG.API_KEY });
};

const defaultClient = createDefaultClient();

export class GeminiAiProvider extends BaseAiProvider {
  constructor() {
    super('Gemini');
    this.defaultClient = defaultClient;
  }

  async generateEmbedding(text) {
    return generateEmbedding(text);
  }

  async generateVideoEmbedding(title, description = '') {
    return generateVideoEmbedding(title, description);
  }

  computeSimilarity(vecA, vecB) {
    return computeCosineSimilarity(vecA, vecB);
  }

  async checkHealth() {
    try {
      const { client, model } = getGeminiClient();
      // Use new GoogleGenAI API for health check - embedding model uses embedContent
      await client.models.embedContent({
        model: model,
        contents: ['health check'],
      });
      return true;
    } catch (error) {
      logError('Gemini health check failed', { error: error.message });
      return false;
    }
  }
}

export const geminiAiProvider = new GeminiAiProvider();

export const getGeminiClient = () => {
    logDebug('Using Gemini client', {
        model: GEMINI_CONFIG.MODEL || 'gemini-embedding-001',
    });

    return {
        client: defaultClient,
        model: GEMINI_CONFIG.MODEL || 'gemini-embedding-001',
    };
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const TRANSIENT_ERROR_CODES = [429, 500, 502, 503, 504];

const isTransientError = (error) => {
    // Handle rate limiting and transient errors
    if (error?.response?.status === 429) {
        return true;
    }

    if (TRANSIENT_ERROR_CODES.includes(error?.response?.status)) {
        return true;
    }

    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        return true;
    }

    return false;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate embedding for a single text string using Gemini embedding model
 * @param {string} text - The text to embed
 * @returns {Promise<Array<number>>} - The embedding vector
 */
export const generateEmbedding = async (text) => {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('Text is required and must be a non-empty string');
    }

    const trimmedText = text.trim();
    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            logDebug('Generating embedding', {
                textLength: trimmedText.length,
                attempt,
                maxRetries: MAX_RETRIES,
            });

            const { client, model } = getGeminiClient();

            // Use new GoogleGenAI API for embeddings
            const response = await client.models.embedContent({
                model: model,
                contents: [trimmedText],
            });
            
            const embedding = response.embeddings?.[0]?.values;

            if (!embedding || !Array.isArray(embedding)) {
                throw new Error('Invalid embedding response from Gemini API');
            }

            logDebug('Embedding generated successfully', {
                textLength: trimmedText.length,
                embeddingDimension: embedding.length,
            });

            return embedding;
        } catch (error) {
            lastError = error;

            logError('Gemini embedding generation attempt failed', {
                textLength: trimmedText.length,
                attempt,
                error: error.message,
            });

            if (attempt < MAX_RETRIES && isTransientError(error)) {
                const delay = RETRY_DELAY * attempt;
                logDebug('Retrying embedding generation', { delay, attempt });
                await sleep(delay);
            } else if (attempt < MAX_RETRIES) {
                logDebug('Skipping retry for non-transient embedding error', {
                    error: error.message,
                });
                break;
            }
        }
    }

    throw new Error(`Failed to generate embedding after ${MAX_RETRIES} attempts: ${lastError.message}`);
};

/**
 * Generate embedding for video title and description combined
 * @param {string} title - Video title
 * @param {string} description - Video description (optional)
 * @returns {Promise<Array<number>>} - The embedding vector
 */
export const generateVideoEmbedding = async (title, description = '') => {
    if (!title || typeof title !== 'string') {
        throw new Error('Video title is required and must be a string');
    }

    // Combine title and description with a separator for better context
    const combinedText = description
        ? `${title}. ${description}`
        : title;

    return await generateEmbedding(combinedText);
};

/**
 * Compute cosine similarity between two vectors
 * @param {Array<number>} vecA - First vector
 * @param {Array<number>} vecB - Second vector
 * @returns {number} - Cosine similarity between -1 and 1
 */
export const computeCosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
        return 0;
    }

    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    const magnitudeA = Math.sqrt(normA);
    const magnitudeB = Math.sqrt(normB);

    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
};

export default {
    getGeminiClient,
    generateEmbedding,
    generateVideoEmbedding,
    computeCosineSimilarity,
    GeminiAiProvider,
    geminiAiProvider,
};