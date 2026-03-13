/**
 * Generation Module Constants
 *
 * Centralized constants for event types, status enums, and error codes
 * used throughout the generation module.
 */

/**
 * Generation status values
 */
export const GENERATION_STATUS = {
  QUEUED: 'queued',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  INTERRUPTED: 'interrupted',
};

/**
 * Generation event types
 */
export const GENERATION_EVENTS = {
  QUEUED: 'queued',
  STARTED: 'started',
  PROGRESS: 'progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  ERROR: 'error',
  WARNING: 'warning',
  INTERRUPTED: 'interrupted',
};

/**
 * Error codes for generation failures
 */
export const GENERATION_ERROR_CODES = {
  COURSE_NOT_FOUND: 'COURSE_NOT_FOUND',
  OPENAI_QUOTA_EXCEEDED: 'OPENAI_QUOTA_EXCEEDED',
  OPENAI_TOKEN_LIMIT: 'OPENAI_TOKEN_LIMIT',
  OPENAI_UNAUTHORIZED: 'OPENAI_UNAUTHORIZED',
  YOUTUBE_QUOTA_EXCEEDED: 'YOUTUBE_QUOTA_EXCEEDED',
  YOUTUBE_ACCESS_DENIED: 'YOUTUBE_ACCESS_DENIED',
  VIDEO_MATCHING_FAILED: 'VIDEO_MATCHING_FAILED',
  CONTENT_GENERATION_FAILED: 'CONTENT_GENERATION_FAILED',
};

/**
 * Progress messages for common generation steps
 */
export const PROGRESS_MESSAGES = {
  STARTING: 'Starting content generation...',
  RESUMING: 'Resuming content generation...',
  GENERATING_CONTENT: (topic) => `Generating lesson: ${topic}`,
  FINDING_VIDEOS: (topic) => `Finding videos for: ${topic}`,
  PROCESSING_MODULE: (title) => `Processing module: ${title}`,
  CONTENT_COMPLETE: (title) => `Content generated for: ${title}`,
  COMPLETED: 'Course content generation complete',
};

/**
 * Completion states
 */
export const COMPLETION_STATES = {
  SUCCESS: 'success',
  PARTIAL: 'partial',
  FAILED: 'failed',
};

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000,
  MAX_DELAY: 10000,
};

export default {
  GENERATION_STATUS,
  GENERATION_EVENTS,
  GENERATION_ERROR_CODES,
  PROGRESS_MESSAGES,
  COMPLETION_STATES,
  RETRY_CONFIG,
};
