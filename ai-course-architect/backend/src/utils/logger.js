/**
 * Logger Utility
 * 
 * Provides consistent logging across the application.
 * Supports different log levels and formatting.
 */

import { SERVER_CONFIG } from '../config/env.js';

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

/**
 * Format log message with timestamp
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @returns {string} Formatted message
 */
const formatMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
};

/**
 * Log error message
 * @param {string} message - Error message
 * @param {Error} error - Error object (optional)
 */
export const logError = (message, error = null) => {
  if (CURRENT_LEVEL >= LOG_LEVELS.ERROR) {
    console.error(formatMessage('ERROR', message));
    if (error) {
      console.error('  Stack:', error.stack);
    }
  }
};

/**
 * Log warning message
 * @param {string} message - Warning message
 */
export const logWarn = (message) => {
  if (CURRENT_LEVEL >= LOG_LEVELS.WARN) {
    console.warn(formatMessage('WARN', message));
  }
};

/**
 * Log info message
 * @param {string} message - Info message
 */
export const logInfo = (message) => {
  if (CURRENT_LEVEL >= LOG_LEVELS.INFO) {
    console.log(formatMessage('INFO', message));
  }
};

/**
 * Log debug message
 * @param {string} message - Debug message
 * @param {Object} data - Additional data (optional)
 */
export const logDebug = (message, data = null) => {
  if (CURRENT_LEVEL >= LOG_LEVELS.DEBUG) {
    console.log(formatMessage('DEBUG', message));
    if (data) {
      console.log('  Data:', JSON.stringify(data, null, 2));
    }
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
