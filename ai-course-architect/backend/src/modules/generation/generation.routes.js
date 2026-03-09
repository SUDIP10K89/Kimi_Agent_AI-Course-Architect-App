/**
 * SSE (Server-Sent Events) Routes
 *
 * Provides real-time progress updates for course generation.
 * Clients connect to these endpoints to receive live updates.
 */

import express from 'express';
import { logDebug } from '../../shared/utils/logger.js';
import { protect } from '../auth/auth.middleware.js';
import Course from '../courses/course.model.js';
import { addClient, formatSseEvent, getClientCount } from './generation.events.js';

const router = express.Router();

const ensureCourseOwnership = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).select('createdBy metadata.generation');
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const ownerId = course.createdBy?._id || course.createdBy;
    if (String(ownerId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    req.course = course;
    next();
  } catch (error) {
    next(error);
  }
};

router.get('/courses/:id/events', protect, ensureCourseOwnership, (req, res) => {
  const { id: courseId } = req.params;
  const generationState = req.course.metadata?.generation;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

  addClient(courseId, res);

  res.write(formatSseEvent('connected', {
    message: 'Connected to course progress updates',
    courseId,
    timestamp: new Date().toISOString(),
  }));

  if (generationState?.status && generationState.status !== 'idle') {
    res.write(formatSseEvent('snapshot', {
      courseId,
      state: generationState.status,
      event: generationState.event,
      progress: generationState.progress,
      message: generationState.message,
      error: generationState.error,
      updatedAt: generationState.updatedAt,
      startedAt: generationState.startedAt,
      completedAt: generationState.completedAt,
      failedAt: generationState.failedAt,
      interruptedAt: generationState.interruptedAt,
    }));
  }

  logDebug('SSE connection established', { courseId });

  req.on('close', () => {
    logDebug('SSE connection closed', { courseId });
  });
});

router.get('/:id/events/count', protect, ensureCourseOwnership, (req, res) => {
  const { id: courseId } = req.params;
  const count = getClientCount(courseId);

  res.json({
    success: true,
    data: { courseId, clientCount: count },
  });
});

export default router;
