/**
 * AI Course Architect - Main Server
 * 
 * Express server that serves the REST API for course generation.
 * Integrates OpenAI for content generation and YouTube for video fetching.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Configuration
import { SERVER_CONFIG, CORS_CONFIG, validateEnv } from './config/env.js';
import { connectDatabase } from './config/database.js';

// Middleware
import { standardLimiter, generationLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, globalErrorHandler, handleUnhandledRejection, handleUncaughtException } from './middleware/errorHandler.js';

// Routes
import courseRoutes from './routes/courseRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

// Utils
import { logInfo, logError } from './utils/logger.js';

// ============================================
// Initialize Application
// ============================================

const app = express();

// ============================================
// Security Middleware
// ============================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://www.youtube.com"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: CORS_CONFIG.ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ============================================
// Rate Limiting
// ============================================

app.use(standardLimiter);

// ============================================
// Body Parsing
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// Request Logging
// ============================================

app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    if (logLevel === 'error') {
      logError(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    } else {
      logInfo(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    }
  });
  
  next();
});

// ============================================
// API Routes
// ============================================

// Health check routes (no rate limiting)
app.use('/api/health', healthRoutes);

// Course routes with generation limiter for POST /generate
app.use('/api/courses/generate', generationLimiter);
app.use('/api/courses', courseRoutes);

// ============================================
// Root Route
// ============================================

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

// ============================================
// Error Handling
// ============================================

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

// ============================================
// Process Error Handlers
// ============================================

process.on('unhandledRejection', handleUnhandledRejection);
process.on('uncaughtException', handleUncaughtException);

// ============================================
// Server Startup
// ============================================

const startServer = async () => {
  try {
    // Validate environment variables
    validateEnv();
    
    // Connect to database
    await connectDatabase();
    
    // Start server
    app.listen(SERVER_CONFIG.PORT, () => {
      logInfo('='.repeat(50));
      logInfo('🚀 AI Course Architect Server Started');
      logInfo('='.repeat(50));
      logInfo(`📡 Environment: ${SERVER_CONFIG.NODE_ENV}`);
      logInfo(`🌐 Port: ${SERVER_CONFIG.PORT}`);
      logInfo(`🔗 API URL: http://localhost:${SERVER_CONFIG.PORT}`);
      logInfo(`❤️  Health Check: http://localhost:${SERVER_CONFIG.PORT}/api/health`);
      logInfo('='.repeat(50));
    });
    
  } catch (error) {
    logError('Failed to start server:', error);
    process.exit(1);
  }
};

// ============================================
// Graceful Shutdown
// ============================================

const gracefulShutdown = (signal) => {
  logInfo(`\n${signal} received. Starting graceful shutdown...`);
  
  // Close server
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// Start Server
// ============================================

startServer();

export default app;
