/**
 * Environment Configuration Module
 * 
 * Centralizes all environment variable access.
 * Provides defaults and validation for required variables.
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Server configuration
 */
export const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
};

/**
 * Database configuration
 */
export const DB_CONFIG = {
  MONGODB_URI: process.env.MONGODB_URI,
};

/**
 * OpenAI configuration
 */
export const OPENAI_CONFIG = {
  API_KEY: process.env.OPENAI_API_KEY,
  MODEL: process.env.OPENAI_MODEL,
  MAX_TOKENS: 4000,
  TEMPERATURE: 0.7,
  // Optional override for non-standard endpoints (e.g. OpenRouter)
  BASE_URL: process.env.OPENAI_BASE_URL,
};

/**
 * YouTube API configuration
 */
export const YOUTUBE_CONFIG = {
  API_KEY: process.env.YOUTUBE_API_KEY,
  MAX_RESULTS: parseInt(process.env.YOUTUBE_MAX_RESULTS, 10) || 3,
};

/**
 * Gemini API configuration
 */
export const GEMINI_CONFIG = {
  API_KEY: process.env.GEMINI_API_KEY,
  MODEL: process.env.GEMINI_MODEL || 'gemini-embedding-001',
};

/**
 * CORS configuration
 */
export const CORS_CONFIG = {
  ORIGIN: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : [
        'http://localhost:5173', 
        'http://localhost:3000', 
        'http://localhost:8081',
        'http://localhost:19000',
        'https://coursexai.vercel.app',
        'exp://localhost:8081',
        'exp://localhost:19000',
      ],
};

/**
 * JWT configuration
 */
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET,
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || process.env.tokenExpiry || '1h',
};

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
};

/**
 * Email configuration
 */
export const EMAIL_CONFIG = {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  APP_URL: process.env.APP_URL || 'http://localhost:5173',
};

/**
 * Google OAuth configuration
 */
export const GOOGLE_CONFIG = {
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
};

/**
 * Validate required environment variables
 * @throws {Error} If required variables are missing
 */
export const validateEnv = () => {
  const required = [
    { key: 'OPENAI_API_KEY', value: OPENAI_CONFIG.API_KEY },
    { key: 'YOUTUBE_API_KEY', value: YOUTUBE_CONFIG.API_KEY },
    { key: 'JWT_SECRET', value: JWT_CONFIG.SECRET },
    // BASE_URL is optional and therefore not validated here
  ];

  const missing = required
    .filter(({ value }) => !value)
    .map(({ key }) => key);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('\nPlease set these variables in your .env file');
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
};
