/**
 * Health Check Routes
 * 
 * Provides endpoints for monitoring API and service health.
 */

import express from 'express';
import mongoose from 'mongoose';
import * as openaiService from '../providers/ai/openai.service.js';
import { checkHealth } from '../generation/services/adapters/youtube.adapter.js';

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AI Course Architect API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed health check with service status
 * @access  Public
 */
router.get('/detailed', async (req, res) => {
  try {
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check OpenAI API
    const openaiHealthy = await openaiService.checkOpenAIHealth();
    
    // Check YouTube API
    const youtubeHealthy = await checkHealth();
    
    const allHealthy = mongoStatus === 'connected' && openaiHealthy && youtubeHealthy;
    
    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        },
        database: {
          status: mongoStatus,
          name: 'MongoDB',
        },
        openai: {
          status: openaiHealthy ? 'healthy' : 'unhealthy',
          name: 'OpenAI API',
        },
        youtube: {
          status: youtubeHealthy ? 'healthy' : 'unhealthy',
          name: 'YouTube Data API',
        },
      },
    });
    
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      message: error.message,
    });
  }
});

export default router;
