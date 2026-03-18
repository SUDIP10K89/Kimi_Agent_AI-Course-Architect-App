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
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Returns basic health status of the API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 environment:
 *                   type: string
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
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check
 *     description: Returns detailed health status including all dependent services
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: All services are healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *       503:
 *         description: One or more services are unhealthy
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
