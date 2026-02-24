/**
 * Error Handling Middleware
 * 
 * Centralized error handling for all API routes.
 * Provides consistent error responses and logging.
 */

import { SERVER_CONFIG } from '../config/env.js';

/**
 * Custom API Error class
 */
export class APIError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper
 * Automatically catches errors in async route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 Not Found handler
 * Catches requests to undefined routes
 */
export const notFoundHandler = (req, res, next) => {
  const error = new APIError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

/**
 * Global error handler
 * Processes all errors and sends appropriate response
 */
export const globalErrorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';
  
  // Handle specific error types
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    const messages = Object.values(err.errors).map(e => e.message);
    message = `Validation Error: ${messages.join(', ')}`;
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_ERROR';
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }
  
  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Invalid ${err.path}: ${err.value}`;
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid token';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token expired';
  }
  
  // OpenAI API errors
  if (err.message && err.message.includes('OpenAI')) {
    statusCode = 503;
    code = 'AI_SERVICE_ERROR';
    message = 'AI service temporarily unavailable';
  }
  
  // YouTube API errors
  if (err.message && err.message.includes('YouTube')) {
    statusCode = 503;
    code = 'VIDEO_SERVICE_ERROR';
    message = 'Video service temporarily unavailable';
  }
  
  // Log error in development
  if (SERVER_CONFIG.IS_DEVELOPMENT) {
    console.error('Error:', {
      statusCode,
      code,
      message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    });
  } else {
    // Log only essential info in production
    console.error(`Error ${statusCode}: ${message}`);
  }
  
  // Send response
  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    ...(SERVER_CONFIG.IS_DEVELOPMENT && { stack: err.stack }),
  });
};

/**
 * Unhandled rejection handler
 * Catches unhandled promise rejections
 */
export const handleUnhandledRejection = (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  
  // In production, you might want to restart the process
  // or use a process manager like PM2
};

/**
 * Uncaught exception handler
 * Catches uncaught exceptions
 */
export const handleUncaughtException = (error) => {
  console.error('Uncaught Exception:', error);
  
  // Graceful shutdown
  process.exit(1);
};

export default {
  APIError,
  asyncHandler,
  notFoundHandler,
  globalErrorHandler,
  handleUnhandledRejection,
  handleUncaughtException,
};
