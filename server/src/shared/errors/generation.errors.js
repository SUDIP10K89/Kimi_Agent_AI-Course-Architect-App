/**
 * Generation Module Error Classes
 *
 * Standardized error hierarchy for generation-related failures.
 * Each error includes a code for programmatic handling and context for debugging.
 */

import { GENERATION_ERROR_CODES } from '../generation.constants.js';

/**
 * Base generation error
 */
export class GenerationError extends Error {
  constructor(code, message, context = {}) {
    super(message);
    this.name = 'GenerationError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

/**
 * Course-related errors
 */
export class CourseNotFoundError extends GenerationError {
  constructor(courseId, context = {}) {
    super(
      GENERATION_ERROR_CODES.COURSE_NOT_FOUND,
      `Course not found: ${courseId}`,
      { courseId, ...context }
    );
    this.name = 'CourseNotFoundError';
  }
}

/**
 * Content generation errors
 */
export class ContentGenerationError extends GenerationError {
  constructor(message, context = {}) {
    super(GENERATION_ERROR_CODES.CONTENT_GENERATION_FAILED, message, context);
    this.name = 'ContentGenerationError';
  }
}

/**
 * OpenAI-specific errors
 */
export class OpenAIQuotaExceededError extends GenerationError {
  constructor(details = '') {
    const message = `OpenAI API quota exceeded${details ? `: ${details}` : ''}. Please add credits or upgrade at platform.openai.com.`;
    super(GENERATION_ERROR_CODES.OPENAI_QUOTA_EXCEEDED, message, { details });
    this.name = 'OpenAIQuotaExceededError';
  }
}

export class OpenAITokenLimitError extends GenerationError {
  constructor(context = {}) {
    super(
      GENERATION_ERROR_CODES.OPENAI_TOKEN_LIMIT,
      'OpenAI token limit exceeded. The request context is too large.',
      context
    );
    this.name = 'OpenAITokenLimitError';
  }
}

export class OpenAIUnauthorizedError extends GenerationError {
  constructor(context = {}) {
    super(
      GENERATION_ERROR_CODES.OPENAI_UNAUTHORIZED,
      'OpenAI API unauthorized. Please verify your API key.',
      context
    );
    this.name = 'OpenAIUnauthorizedError';
  }
}

/**
 * YouTube-specific errors
 */
export class YouTubeQuotaExceededError extends GenerationError {
  constructor(context = {}) {
    super(
      GENERATION_ERROR_CODES.YOUTUBE_QUOTA_EXCEEDED,
      'YouTube API quota exceeded. Please check your quota usage at console.cloud.google.com.',
      context
    );
    this.name = 'YouTubeQuotaExceededError';
  }
}

export class YouTubeAccessDeniedError extends GenerationError {
  constructor(context = {}) {
    super(
      GENERATION_ERROR_CODES.YOUTUBE_ACCESS_DENIED,
      'YouTube API access denied. Please verify your API key and permissions.',
      context
    );
    this.name = 'YouTubeAccessDeniedError';
  }
}

/**
 * Video-related errors
 */
export class VideoMatchingError extends GenerationError {
  constructor(message, context = {}) {
    super(GENERATION_ERROR_CODES.VIDEO_MATCHING_FAILED, message, context);
    this.name = 'VideoMatchingError';
  }
}

/**
 * Retryable error wrapper
 */
export class RetryableError extends GenerationError {
  constructor(code, message, attempt, maxRetries, context = {}) {
    super(code, message, { attempt, maxRetries, ...context });
    this.name = 'RetryableError';
    this.shouldRetry = attempt < maxRetries;
  }
}

/**
 * Create error from API error
 * @param {Error} error - Original error
 * @param {string} defaultCode - Default error code if not detected
 * @returns {GenerationError} Wrapped generation error
 */
export const createGenerationError = (error, defaultCode = GENERATION_ERROR_CODES.CONTENT_GENERATION_FAILED) => {
  if (error instanceof GenerationError) {
    return error;
  }

  const message = error?.message || 'An unexpected error occurred';
  const context = {
    originalError: error?.stack || String(error),
  };

  // Detect error type from message or properties
  if (error?.code === GENERATION_ERROR_CODES.OPENAI_QUOTA_EXCEEDED ||
      error?.message?.includes('quota') ||
      error?.message?.includes('billing')) {
    return new OpenAIQuotaExceededError(message);
  }

  if (error?.code === GENERATION_ERROR_CODES.OPENAI_TOKEN_LIMIT ||
      error?.message?.includes('context_length') ||
      error?.message?.includes('token limit')) {
    return new OpenAITokenLimitError(context);
  }

  if (error?.response?.status === 401 || error?.message?.includes('unauthorized')) {
    return new OpenAIUnauthorizedError(context);
  }

  if (error?.code === GENERATION_ERROR_CODES.YOUTUBE_QUOTA_EXCEEDED ||
      (error?.code === 403 && error?.message?.includes('quota'))) {
    return new YouTubeQuotaExceededError(context);
  }

  if (error?.code === GENERATION_ERROR_CODES.YOUTUBE_ACCESS_DENIED ||
      (error?.code === 403 && !error?.message?.includes('quota'))) {
    return new YouTubeAccessDeniedError(context);
  }

  return new GenerationError(defaultCode, message, context);
};

export default {
  GenerationError,
  CourseNotFoundError,
  ContentGenerationError,
  OpenAIQuotaExceededError,
  OpenAITokenLimitError,
  OpenAIUnauthorizedError,
  YouTubeQuotaExceededError,
  YouTubeAccessDeniedError,
  VideoMatchingError,
  RetryableError,
  createGenerationError,
};
