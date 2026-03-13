import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

import { CORS_CONFIG } from '../config/env.js';
import authRoutes from '../modules/auth/auth.routes.js';
import courseRoutes from '../modules/courses/course.routes.js';
import generationRoutes from '../modules/generation/generation.routes.js';
import healthRoutes from '../modules/health/health.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import {
  globalErrorHandler,
  notFoundHandler,
} from '../shared/middleware/errorHandler.js';
import {
  generationLimiter,
  standardLimiter,
} from '../shared/middleware/rateLimiter.js';
import { logError, logInfo } from '../shared/utils/logger.js';

export const createApp = () => {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'", 'https://www.youtube.com'],
      },
    },
  }));

  app.use(cors({
    origin: CORS_CONFIG.ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));

  app.use(standardLimiter);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use((req, res, next) => {
    req.id = req.headers['x-request-id'] || uuidv4();
    res.setHeader('X-Request-ID', req.id);
    next();
  });

  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;

      if (res.statusCode >= 400) {
        logError(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
      } else {
        logInfo(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
      }
    });

    next();
  });

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/courses/generate', generationLimiter);
  app.use('/api/courses', courseRoutes);
  app.use('/api/sse', generationRoutes);

  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'AI Course Architect API',
      version: '1.0.0',
      documentation: '/api/health',
      endpoints: {
        health: '/api/health',
        courses: '/api/courses',
        generate: '/api/courses/generate',
      },
    });
  });

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};

export default createApp;
