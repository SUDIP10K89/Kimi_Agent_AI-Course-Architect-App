/**
 * Rate Limiting Middleware
 * 
 * Protects API from abuse and ensures fair usage.
 * Uses express-rate-limit for IP-based limiting.
 */

import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_CONFIG } from '../../config/env.js';

/**
 * Standard rate limiter for general API routes
 * Limits requests per IP address
 */
export const standardLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health' || req.path === '/api/health/detailed'||req.path.includes('/status');
  },
});

/**
 * Stricter rate limiter for course generation
 * Course generation is resource-intensive
 */
export const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 course generations per hour
  message: {
    success: false,
    error: 'Course generation limit reached. Please try again later.',
    code: 'GENERATION_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    console.warn(`Generation limit exceeded for IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
});

/**
 * Limiter for AI content generation endpoints
 */
export const aiGenerationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 AI generations per 15 minutes
  message: {
    success: false,
    error: 'AI generation limit reached. Please try again later.',
    code: 'AI_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  standardLimiter,
  generationLimiter,
  aiGenerationLimiter,
};
