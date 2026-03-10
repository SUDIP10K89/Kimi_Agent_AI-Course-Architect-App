/**
 * Video Finder
 * 
 * Compatibility layer - redirects to VideoRecommendationService.
 * 
 * @deprecated Use VideoRecommendationService directly for new code
 */

import { VideoRecommendationService, initializeVideoPool, getVideosFromPool, clearVideoPool } from './videoRecommendationService.js';

// Re-export for backward compatibility
export {
  VideoRecommendationService,
  initializeVideoPool,
  getVideosFromPool,
  clearVideoPool,
};

// Legacy function - uses VideoRecommendationService internally
export const findVideosForMicroTopic = async (courseId, microTopicTitle) => {
  return getVideosFromPool(courseId, microTopicTitle, 3);
};

export default {
  VideoRecommendationService,
  findVideosForMicroTopic,
  initializeVideoPool,
  getVideosFromPool,
  clearVideoPool,
};
