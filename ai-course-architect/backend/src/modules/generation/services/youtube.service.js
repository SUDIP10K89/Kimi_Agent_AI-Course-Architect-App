/**
 * YouTube Service
 * 
 * Bulk video fetching with query expansion and retry logic.
 */

import * as youtubeAdapter from './adapters/youtube.adapter.js';
import * as cache from './videoCache.service.js';
import { buildQuery } from './utils/queryBuilder.js';
import { logWarn } from '../../../shared/utils/logger.js';

/**
 * Search bulk videos for a course (efficient - 2 API calls)
 * @param {string} courseName 
 * @param {number} maxVideos 
 * @returns {Promise<Object[]>} Array of video objects
 */
export const searchBulkVideos = async (courseName, maxVideos = 50) => {
  const query = buildQuery(courseName);
  
  // Check cache first
  const cached = cache.get(query);
  if (cached) return cached;

  // Search for video IDs
  const videoIds = await youtubeAdapter.searchVideos(query, maxVideos);
  
  if (!videoIds.length) return [];

  // Fetch details
  const videos = await youtubeAdapter.fetchVideoDetails(videoIds);
  
  // Cache results
  cache.set(query, videos);
  
  return videos;
};

/**
 * Search targeted videos for a microTopic
 * @param {string} courseName 
 * @param {string} microTopic 
 * @param {number} maxVideos 
 * @returns {Promise<Object[]>} Array of video objects
 */
export const searchTargetedVideos = async (courseName, microTopic, maxVideos = 3) => {
  const query = buildQuery(courseName, microTopic);
  
  // Check cache
  const cached = cache.get(query);
  if (cached) return cached;

  // Search
  const videoIds = await youtubeAdapter.searchVideos(query, maxVideos * 2);
  
  if (!videoIds.length) return [];

  // Fetch details
  const videos = await youtubeAdapter.fetchVideoDetails(videoIds);
  
  // Cache
  cache.set(query, videos);
  
  return videos;
};

/**
 * Initialize video pool for a course (called once at start)
 * @param {string} courseId 
 * @param {string} courseName 
 * @returns {Promise<Object[]>}
 */
export const initializePool = async (courseId, courseName) => {
  const videos = await searchBulkVideos(courseName, 50);
  cache.setPool(courseId, videos);
  return videos;
};

/**
 * Get videos from pool
 * @param {string} courseId 
 * @returns {Object[]|null}
 */
export const getFromPool = (courseId) => {
  return cache.getFromPool(courseId);
};

/**
 * Clear pool
 */
export const clearPool = (courseId) => {
  cache.clearPool(courseId);
};

export default {
  searchBulkVideos,
  searchTargetedVideos,
  initializePool,
  getFromPool,
  clearPool,
};
