/**
 * Logger Utility using Winston
 * 
 * Provides consistent logging across the application.
 */

import winston from 'winston';
import { SERVER_CONFIG } from '../../config/env.js';

// Create Winston logger
const logger = winston.createLogger({
  level: SERVER_CONFIG.IS_DEVELOPMENT ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ai-course-architect' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    }),
  ],
});

/**
 * Log error message
 */
export const logError = (message, errorOrMeta = null) => {
  if (errorOrMeta instanceof Error) {
    logger.error(message, { error: errorOrMeta.message, stack: errorOrMeta.stack });
  } else if (errorOrMeta) {
    logger.error(message, errorOrMeta);
  } else {
    logger.error(message);
  }
};

/**
 * Log warning message
 */
export const logWarn = (message, meta = null) => {
  logger.warn(message, meta || {});
};

/**
 * Log info message
 */
export const logInfo = (message, meta = null) => {
  logger.info(message, meta || {});
};

/**
 * Log debug message
 */
export const logDebug = (message, data = null) => {
  logger.debug(message, data || {});
};

/**
 * Log API request
 */
export const logRequest = (req, statusCode, duration) => {
  const meta = { 
    method: req.method, 
    url: req.originalUrl, 
    status: statusCode, 
    duration: `${duration}ms` 
  };
  
  if (statusCode >= 400) {
    logger.error('API Request', meta);
  } else {
    logger.info('API Request', meta);
  }
};

export default {
  error: logError,
  warn: logWarn,
  info: logInfo,
  debug: logDebug,
  request: logRequest,
};
