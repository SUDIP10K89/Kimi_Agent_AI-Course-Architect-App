/**
 * Logger Utility
 * 
 * Provides consistent logging across the application.
 * Supports different log levels and formatting.
 */

import { SERVER_CONFIG } from '../../config/env.js';

/**
 * Log levels
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

/**
 * Current log level
 */
const CURRENT_LEVEL = SERVER_CONFIG.IS_DEVELOPMENT 
  ? LOG_LEVELS.DEBUG 
  : LOG_LEVELS.INFO;

const serializeMeta = (meta) => {
  if (!meta) {
    return '';
  }

  if (meta instanceof Error) {
    return JSON.stringify({
      errorName: meta.name,
      errorMessage: meta.message,
    });
  }

  if (typeof meta === 'string') {
    return meta;
  }

  return JSON.stringify(meta);
};

/**
 * Format log message with timestamp
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @returns {string} Formatted message
 */
const formatMessage = (level, message, meta = null) => {
  const timestamp = new Date().toISOString();
  const serializedMeta = serializeMeta(meta);

  return serializedMeta
    ? `[${timestamp}] [${level}] ${message} ${serializedMeta}`
    : `[${timestamp}] [${level}] ${message}`;
};

/**
 * Log error message
 * @param {string} message - Error message
 * @param {Error} error - Error object (optional)
 */
export const logError = (message, errorOrMeta = null) => {
  if (CURRENT_LEVEL >= LOG_LEVELS.ERROR) {
    console.error(formatMessage('ERROR', message, errorOrMeta));
    if (errorOrMeta instanceof Error && errorOrMeta.stack) {
      console.error(errorOrMeta.stack);
    }
  }
};

/**
 * Log warning message
 * @param {string} message - Warning message
 */
export const logWarn = (message, meta = null) => {
  if (CURRENT_LEVEL >= LOG_LEVELS.WARN) {
    console.warn(formatMessage('WARN', message, meta));
  }
};

/**
 * Log info message
 * @param {string} message - Info message
 */
export const logInfo = (message, meta = null) => {
  if (CURRENT_LEVEL >= LOG_LEVELS.INFO) {
    console.log(formatMessage('INFO', message, meta));
  }
};

/**
 * Log debug message
 * @param {string} message - Debug message
 * @param {Object} data - Additional data (optional)
 */
export const logDebug = (message, data = null) => {
  if (CURRENT_LEVEL >= LOG_LEVELS.DEBUG) {
    console.log(formatMessage('DEBUG', message, data));
  }
};

/**
 * Log API request
 * @param {Object} req - Express request object
 * @param {number} statusCode - Response status code
 * @param {number} duration - Request duration in ms
 */
export const logRequest = (req, statusCode, duration) => {
  if (CURRENT_LEVEL >= LOG_LEVELS.INFO) {
    const message = `${req.method} ${req.originalUrl} - ${statusCode} - ${duration}ms`;
    const level = statusCode >= 400 ? 'ERROR' : 'INFO';
    console.log(formatMessage(level, message));
  }
};

export default {
  error: logError,
  warn: logWarn,
  info: logInfo,
  debug: logDebug,
  request: logRequest,
};
