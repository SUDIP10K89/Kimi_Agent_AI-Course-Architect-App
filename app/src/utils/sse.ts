/**
 * Server-Sent Events (SSE) Utility for Frontend
 * 
 * Handles SSE connections to receive real-time progress updates
 * from the backend during course generation.
 */

export interface SSEProgressEvent {
  progress: number;
  message: string;
  timestamp: string;
}

export interface SSECompleteEvent {
  message: string;
  courseId: string;
  title: string;
  timestamp: string;
}

export interface SSEErrorEvent {
  error: string;
  timestamp: string;
}

export type SSEEventType = 'progress' | 'complete' | 'error' | 'connected';

type EventHandler = (data: SSEProgressEvent | SSECompleteEvent | SSEErrorEvent) => void;

/**
 * Connect to SSE endpoint for course generation progress
 * @param courseId - The course ID to subscribe to
 * @param onProgress - Callback for progress updates
 * @param onComplete - Callback when generation is complete
 * @param onError - Callback for error events
 * @returns cleanup function to disconnect
 */
export const connectToCourseProgress = (
  courseId: string,
  onProgress?: (data: SSEProgressEvent) => void,
  onComplete?: (data: SSECompleteEvent) => void,
  onError?: (data: SSEErrorEvent) => void
): (() => void) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const eventSource = new EventSource(`${apiUrl}/sse/courses/${courseId}/events`);

  eventSource.addEventListener('connected', (event) => {
    console.log('SSE Connected:', event.data);
  });

  eventSource.addEventListener('progress', (event) => {
    try {
      const data = JSON.parse(event.data) as SSEProgressEvent;
      console.log('SSE Progress:', data);
      onProgress?.(data);
    } catch (error) {
      console.error('Failed to parse SSE progress event:', error);
    }
  });

  eventSource.addEventListener('complete', (event) => {
    try {
      const data = JSON.parse(event.data) as SSECompleteEvent;
      console.log('SSE Complete:', data);
      onComplete?.(data);
      // Auto-close after complete
      eventSource.close();
    } catch (error) {
      console.error('Failed to parse SSE complete event:', error);
    }
  });

  eventSource.addEventListener('error', (event: Event) => {
    try {
      const target = event as MessageEvent;
      const data = JSON.parse(target.data) as SSEErrorEvent;
      console.error('SSE Error:', data);
      onError?.(data);
    } catch (error) {
      console.error('Failed to parse SSE error event:', error);
    }
  });

  eventSource.onerror = (event: Event) => {
    console.error('SSE connection error:', event);
    eventSource.close();
  };

  // Return cleanup function
  return () => {
    console.log('Closing SSE connection');
    eventSource.close();
  };
};

export default {
  connectToCourseProgress,
};
