/**
 * Video Recommendation Service
 * 
 * Business logic layer for video recommendations.
 * Handles all filtering, scoring, and ranking algorithms.
 * 
 * Responsibilities:
 * - Fetch and manage video pools per course
 * - Filter videos by relevance to microTopics
 * - Rank videos by multiple criteria
 * - Prevent duplicate video assignments
 * 
 * This layer knows NOTHING about YouTube API details.
 * It uses the YouTubeAdapter for API calls.
 */

import * as youtubeAdapter from './youtubeAdapter.js';

// In-memory video pools per course
const courseVideoPools = new Map();

/**
 * Video Recommendation Service
 * Public API for the service layer
 */
export const VideoRecommendationService = {
  /**
   * Initialize a video pool for a course
   * Fetches videos once using course name
   * @param {string} courseId - Course ID
   * @param {string} courseName - Course name/topic
   * @param {number} maxVideos - Max videos to fetch
   */
  async initializePool(courseId, courseName, maxVideos = 50) {
    try {
      // 1. Search for video IDs
      const videoIds = await youtubeAdapter.searchVideos(courseName, maxVideos);
      
      if (!videoIds.length) {
        courseVideoPools.set(courseId, { videos: [], usedIndices: new Set() });
        return [];
      }

      // 2. Fetch details for all videos
      const videos = await youtubeAdapter.fetchVideoDetails(videoIds);

      // 3. Store in pool
      courseVideoPools.set(courseId, {
        videos,
        usedIndices: new Set(),
      });

      return videos;
    } catch (error) {
      if (youtubeAdapter.isQuotaExceeded(error)) {
        const quotaError = new Error('YouTube API quota exceeded');
        quotaError.code = 'YOUTUBE_QUOTA_EXCEEDED';
        throw quotaError;
      }
      // Return empty pool on other errors
      courseVideoPools.set(courseId, { videos: [], usedIndices: new Set() });
      return [];
    }
  },

  /**
   * Get best videos for a microTopic from the pool
   * Uses relevance scoring algorithm
   * @param {string} courseId - Course ID
   * @param {string} microTopicTitle - MicroTopic title
   * @param {number} maxVideos - Max videos to return
   */
  getVideosForMicroTopic(courseId, microTopicTitle, maxVideos = 3) {
    const pool = courseVideoPools.get(courseId);
    
    if (!pool?.videos?.length) {
      return [];
    }

    const { videos, usedIndices } = pool;
    const microTopicLower = microTopicTitle.toLowerCase();
    const keywords = microTopicLower.split(/\s+/).filter(k => k.length > 2);

    // Score each video
    const scoredVideos = videos
      .map((video, index) => {
        if (usedIndices.has(index)) {
          return { video, score: -1, index };
        }

        const titleLower = video.title.toLowerCase();
        const descLower = (video.description || '').toLowerCase();

        let score = 0;

        // Exact match in title (+100)
        if (titleLower.includes(microTopicLower)) {
          score += 100;
        }

        // Keyword matches in title (+50 each)
        keywords.forEach(keyword => {
          if (titleLower.includes(keyword)) {
            score += 50;
          }
        });

        // Keyword matches in description (+10 each)
        keywords.forEach(keyword => {
          if (descLower.includes(keyword)) {
            score += 10;
          }
        });

        // Prefer medium-length videos (10-30 min) for tutorials (+20)
        const durationMinutes = (video.durationSeconds || 0) / 60;
        if (durationMinutes >= 10 && durationMinutes <= 30) {
          score += 20;
        }

        // Prefer videos with more views (+5 for every 100k views, max +20)
        const viewBonus = Math.min(20, Math.floor((video.viewCount || 0) / 100000) * 5);
        score += viewBonus;

        return { video, score, index };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    // Select top videos
    const selected = [];
    for (const item of scoredVideos) {
      if (selected.length >= maxVideos) break;
      if (!usedIndices.has(item.index)) {
        selected.push(item.video);
        usedIndices.add(item.index);
      }
    }

    return selected;
  },

  /**
   * Clear video pool for a course
   * @param {string} courseId - Course ID
   */
  clearPool(courseId) {
    courseVideoPools.delete(courseId);
  },

  /**
   * Get pool statistics
   * @param {string} courseId - Course ID
   */
  getPoolStats(courseId) {
    const pool = courseVideoPools.get(courseId);
    if (!pool) return null;
    return {
      totalVideos: pool.videos.length,
      usedVideos: pool.usedIndices.size,
      availableVideos: pool.videos.length - pool.usedIndices.size,
    };
  },
};

/**
 * Legacy compatibility - redirect to service
 */
export const initializeVideoPool = (course, maxVideos) => 
  VideoRecommendationService.initializePool(String(course._id), course.searchTopic || course.topic, maxVideos);

export const getVideosFromPool = (courseId, microTopicTitle, maxVideos) =>
  VideoRecommendationService.getVideosForMicroTopic(courseId, microTopicTitle, maxVideos);

export const clearVideoPool = (courseId) =>
  VideoRecommendationService.clearPool(courseId);

// Legacy function for backward compatibility
export const findVideosForMicroTopic = (courseId, microTopicTitle) =>
  VideoRecommendationService.getVideosForMicroTopic(courseId, microTopicTitle, 3);

// Legacy export
export default VideoRecommendationService;
