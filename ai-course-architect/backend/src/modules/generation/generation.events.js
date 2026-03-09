/**
 * Server-Sent Events (SSE) Utility
 *
 * Manages SSE connections for real-time progress updates.
 * Allows multiple clients to subscribe to course generation progress.
 */

import { logDebug, logWarn } from '../../shared/utils/logger.js';

const clients = new Map();

export const formatSseEvent = (event, data) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

/**
 * Add a client to receive SSE events for a specific course
 * @param {string} courseId - The course ID
 * @param {object} res - Express response object
 */
export const addClient = (courseId, res) => {
  if (!clients.has(courseId)) {
    clients.set(courseId, new Set());
  }

  const courseClients = clients.get(courseId);
  courseClients.add(res);

  res.on('close', () => {
    courseClients.delete(res);
    if (courseClients.size === 0) {
      clients.delete(courseId);
    }
  });

  logDebug('SSE client connected', { courseId, clientCount: courseClients.size });
};

/**
 * Send a progress event to all clients subscribed to a course
 * @param {string} courseId - The course ID
 * @param {string} event - Event type (e.g., 'progress', 'complete', 'error')
 * @param {object} data - Event data
 */
export const sendEvent = (courseId, event, data) => {
  const courseClients = clients.get(courseId);

  if (!courseClients || courseClients.size === 0) {
    return;
  }

  const message = formatSseEvent(event, data);

  courseClients.forEach((res) => {
    try {
      res.write(message);
    } catch (error) {
      logWarn('Failed to send SSE event', { courseId, event, error: error.message });
      courseClients.delete(res);
    }
  });
};

export const sendProgress = (courseId, progress, message, additionalData = {}) => {
  sendEvent(courseId, 'progress', {
    progress,
    message,
    timestamp: new Date().toISOString(),
    ...additionalData,
  });
};

export const sendError = (courseId, error) => {
  sendEvent(courseId, 'error', {
    error,
    timestamp: new Date().toISOString(),
  });
};

export const sendComplete = (courseId, data) => {
  sendEvent(courseId, 'complete', {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

export const getClientCount = (courseId) => clients.get(courseId)?.size || 0;

export default {
  addClient,
  formatSseEvent,
  sendEvent,
  sendProgress,
  sendError,
  sendComplete,
  getClientCount,
};
