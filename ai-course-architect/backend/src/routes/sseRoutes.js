/**
 * SSE (Server-Sent Events) Routes
 * 
 * Provides real-time progress updates for course generation.
 * Clients connect to these endpoints to receive live updates.
 */

import express from 'express';
import { addClient } from '../utils/sse.js';
import { getClientCount } from '../utils/sse.js';

const router = express.Router();

/**
 * SSE endpoint for course generation progress
 * GET /api/sse/courses/:id/events
 * 
 * Clients connect to this endpoint to receive real-time updates
 * about course generation progress.
 */
router.get('/courses/:id/events', (req, res) => {
  const { id: courseId } = req.params;
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  
  // Enable CORS for SSE
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
  
  // Add client to SSE subscribers
  addClient(courseId, res);
  
  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ 
    message: 'Connected to course progress updates',
    courseId,
    timestamp: new Date().toISOString()
  })}\n\n`);
  
  console.log(`🔗 SSE connection established for course: ${courseId}`);
  
  // Handle client disconnect
  req.on('close', () => {
    console.log(`🔌 SSE connection closed for course: ${courseId}`);
  });
});

/**
 * Check number of connected clients for a course
 * GET /api/courses/:id/events/count
 */
router.get('/:id/events/count', (req, res) => {
  const { id: courseId } = req.params;
  const count = getClientCount(courseId);
  
  res.json({
    success: true,
    data: { courseId, clientCount: count },
  });
});

export default router;
