/**
 * Video Recommendation Service
 * 
 * Main orchestrator for video recommendations.
 * Flow:
 *   1. Try bulk search + local ranking
 *   2. Check confidence
 *   3. If low → fallback to targeted search
 */

import * as youtubeService from './youtube.service.js';
import * as ranking from './videoRanking.service.js';
import * as cache from './videoCache.service.js';
import { logWarn } from '../../../shared/utils/logger.js';

/**
 * Get videos for a microTopic
 * @param {string} courseId 
 * @param {string} courseName 
 * @param {string} microTopic 
 * @param {number} maxVideos 
 * @returns {Promise<Object[]>} Array of videos
 */
export const getVideos = async (courseId, courseName, microTopic, maxVideos = 3) => {
  // Try bulk search first (efficient)
  let pool = youtubeService.getFromPool(courseId);
  
  if (!pool) {
    pool = await youtubeService.initializePool(courseId, courseName);
  }

  if (pool?.length) {
    // Rank from pool
    const ranked = pool.map((v, i) => ({ video: v, score: ranking.scoreVideo(v, microTopic), index: i }))
      .filter(v => v.score > 0)
      .sort((a, b) => b.score - a.score);

    const confidence = ranking.calculateConfidence(ranked);

    // If good confidence, return from pool
    if (!confidence.needsFallback || ranked.length >= maxVideos) {
      const videos = ranking.rankVideos(pool, microTopic, maxVideos, courseId);
      return {
        videos,
        strategy: 'bulk',
        confidence: confidence.confidence,
      };
    }
  }

  // Fallback: targeted search
  try {
    const targetedVideos = await youtubeService.searchTargetedVideos(courseName, microTopic, maxVideos);
    
    return {
      videos: targetedVideos.slice(0, maxVideos),
      strategy: 'targeted',
      confidence: 'high',
    };
  } catch (error) {
    logWarn('Targeted video search failed', { courseName, microTopic, error: error.message });
    return { videos: [], strategy: 'error', confidence: 'low' };
  }
};

/**
 * Initialize video pool for a course
 */
export const initializePool = async (courseId, courseName) => {
  return youtubeService.initializePool(courseId, courseName);
};

/**
 * Clear pool for a course
 */
export const clearPool = (courseId) => {
  youtubeService.clearPool(courseId);
  ranking.resetUsedVideos(courseId);
};

export default { getVideos, initializePool, clearPool };
