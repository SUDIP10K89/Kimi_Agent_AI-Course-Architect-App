/**
 * Server-Sent Events (SSE) Utility
 * 
 * Manages SSE connections for real-time progress updates.
 * Allows multiple clients to subscribe to course generation progress.
 */

// Map to store active SSE connections per course
const clients = new Map();

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
  
  // Remove client on close
  res.on('close', () => {
    courseClients.delete(res);
    if (courseClients.size === 0) {
      clients.delete(courseId);
    }
  });
  
  console.log(`📡 SSE client connected for course: ${courseId} (${courseClients.size} total)`);
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
  
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  
  courseClients.forEach((res) => {
    try {
      res.write(message);
    } catch (error) {
      console.error(`Error sending SSE event: ${error.message}`);
      courseClients.delete(res);
    }
  });
};

/**
 * Send progress update for a specific course
 * @param {string} courseId - The course ID
 * @param {number} progress - Progress percentage (0-100)
 * @param {string} message - Status message
 * @param {object} additionalData - Additional data to send
 */
export const sendProgress = (courseId, progress, message, additionalData = {}) => {
  sendEvent(courseId, 'progress', {
    progress,
    message,
    timestamp: new Date().toISOString(),
    ...additionalData,
  });
};

/**
 * Send error event for a specific course
 * @param {string} courseId - The course ID
 * @param {string} error - Error message
 */
export const sendError = (courseId, error) => {
  sendEvent(courseId, 'error', {
    error,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send completion event for a specific course
 * @param {string} courseId - The course ID
 * @param {object} data - Completion data
 */
export const sendComplete = (courseId, data) => {
  sendEvent(courseId, 'complete', {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Get the number of connected clients for a course
 * @param {string} courseId - The course ID
 * @returns {number} Number of connected clients
 */
export const getClientCount = (courseId) => {
  return clients.get(courseId)?.size || 0;
};

export default {
  addClient,
  sendEvent,
  sendProgress,
  sendError,
  sendComplete,
  getClientCount,
};
