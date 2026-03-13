import Course from '../../courses/course.model.js';
import {
  sendComplete,
  sendError,
  sendEvent,
  sendProgress,
} from '../generation.events.js';
import { logWarn } from '../../../shared/utils/logger.js';

export const updateGenerationState = async (
  courseId,
  {
    status,
    event,
    progress,
    message,
    error,
    startedAt,
    completedAt,
    failedAt,
    interruptedAt,
  }
) => {
  const now = new Date();
  const set = {
    'metadata.generation.status': status,
    'metadata.generation.event': event,
    'metadata.generation.progress': Math.max(0, Math.min(100, progress ?? 0)),
    'metadata.generation.message': message || null,
    'metadata.generation.updatedAt': now,
    'metadata.generation.error': error || null,
    'metadata.generationFailed': status === 'failed',
    'metadata.generationFailedReason': status === 'failed' ? error || message || null : null,
  };

  if (startedAt) {
    set['metadata.generation.startedAt'] = startedAt;
  }

  if (completedAt !== undefined) {
    set['metadata.generation.completedAt'] = completedAt;
  }

  if (failedAt !== undefined) {
    set['metadata.generation.failedAt'] = failedAt;
  }

  if (interruptedAt !== undefined) {
    set['metadata.generation.interruptedAt'] = interruptedAt;
  }

  await Course.updateOne({ _id: courseId }, { $set: set });
};

export const emitProgressState = async (courseId, progress, message, additionalData = {}, options = {}) => {
  await updateGenerationState(courseId, {
    status: 'in-progress',
    event: 'progress',
    progress,
    message,
    error: null,
    startedAt: options.startedAt,
    completedAt: null,
    failedAt: null,
    interruptedAt: null,
  });

  sendProgress(courseId, progress, message, additionalData);
};

export const emitFailureState = async (courseId, message, options = {}) => {
  await updateGenerationState(courseId, {
    status: 'failed',
    event: 'error',
    progress: options.progress ?? 0,
    message,
    error: options.error || message,
    failedAt: new Date(),
  });

  sendError(courseId, message);
};

export const emitCompletionState = async (courseId, data) => {
  await updateGenerationState(courseId, {
    status: 'completed',
    event: 'complete',
    progress: 100,
    message: data.message,
    error: null,
    completedAt: new Date(),
    failedAt: null,
    interruptedAt: null,
  });

  sendComplete(courseId, data);
};

export const sendWarning = (courseId, message) => {
  sendEvent(courseId, 'warning', { message, timestamp: new Date().toISOString() });
};

export const markInterruptedGenerationsOnStartup = async () => {
  const now = new Date();
  const result = await Course.updateMany(
    { 'metadata.generation.status': { $in: ['queued', 'in-progress'] } },
    {
      $set: {
        'metadata.generation.status': 'interrupted',
        'metadata.generation.event': 'interrupted',
        'metadata.generation.message': 'Generation stopped before completion. Resume to continue.',
        'metadata.generation.updatedAt': now,
        'metadata.generation.interruptedAt': now,
      },
    }
  );

  if (result.modifiedCount > 0) {
    logWarn('Marked interrupted generations after restart', { modifiedCount: result.modifiedCount });
  }
};
