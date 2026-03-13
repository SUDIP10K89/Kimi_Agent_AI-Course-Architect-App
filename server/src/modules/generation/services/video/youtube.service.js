/**
 * YouTube Service
 *
 * Direct YouTube API calls for video search.
 */

import * as youtubeAdapter from '../youtube.adapter.js';
import { buildQuery } from '../queryBuilder.js';

/**
 * Search targeted videos for a microTopic
 * @param {string} courseName 
 * @param {string} microTopic 
 * @param {number} maxVideos 
 * @returns {Promise<Object[]>} Array of video objects
 */
export const searchTargetedVideos = async (courseName, microTopic, maxVideos = 50) => {
  const query = buildQuery(courseName, microTopic);
  
  // YouTube API max is 50
  const fetchCount = Math.min(maxVideos, 50);
  
  // Search for video IDs
  const videoIds = await youtubeAdapter.searchVideos(query, fetchCount);
  
  if (!videoIds.length) return [];

  // Fetch details
  const videos = await youtubeAdapter.fetchVideoDetails(videoIds);
  
  return videos;
};

export default {
  searchTargetedVideos,
};
