/**
 * Video Service Facade
 *
 * Main orchestrator for video recommendations.
 * Provides unified interface for fetching and ranking videos.
 *
 * Flow:
 *   1. Make fresh YouTube API call for each microtopic
 *   2. Use embedding-based matching to find most relevant videos
 */

import * as youtubeService from './youtube.service.js';
import * as ranking from './ranking.service.js';
import { generateEmbedding, generateVideoEmbedding, computeCosineSimilarity } from '../../../providers/ai/gemini.service.js';
import { logDebug, logWarn } from '../../../../shared/utils/logger.js';

/**
 * Match a topic to videos using embedding similarity
 * @param {string} topic - The topic text to match against
 * @param {Array<Object>} videos - Array of video objects
 * @param {Object} options - Configuration
 * @returns {Promise<Array<Object>>} Videos sorted by similarity
 */
const matchTopicToVideos = async (topic, videos, options = {}) => {
  const { limit, threshold = 0.3 } = options;

  if (!topic || typeof topic !== 'string' || !Array.isArray(videos) || videos.length === 0) {
    return [];
  }

  try {
    // Generate embedding for the topic
    const topicEmbedding = await generateEmbedding(topic);

    // Generate embeddings for videos and compute similarity
    const videosWithScores = await Promise.all(
      videos.map(async (video) => {
        try {
          const videoEmbedding = await generateVideoEmbedding(video.title, video.description);
          const similarity = computeCosineSimilarity(topicEmbedding, videoEmbedding);
          return { ...video, similarity };
        } catch (error) {
          logWarn('Failed to generate embedding for video', { title: video.title, error: error.message });
          return null;
        }
      })
    );

    // Filter out failed embeddings and sort by similarity
    const validVideos = videosWithScores
      .filter((v) => v !== null && v.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);

    return validVideos.slice(0, limit || validVideos.length);
  } catch (error) {
    logWarn('Embedding-based matching failed, falling back to keyword ranking', {
      topic,
      error: error.message,
    });
    // Fallback to keyword-based ranking
    return ranking.rankVideos(videos, topic, limit || videos.length);
  }
};

/**
 * Get videos for a microTopic - fetches maximum videos from YouTube API
 * @param {string} courseId
 * @param {string} courseName
 * @param {string} microTopic
 * @param {number} maxVideos - Legacy parameter, now fetches maximum (50)
 * @param {Object} options - Optional configuration
 * @param {number} options.embeddingLimit - Max videos to return from embedding matching
 * @returns {Promise<Object>} Object containing videos and metadata
 */
export const getVideos = async (courseId, courseName, microTopic, maxVideos = 50, options = {}) => {
  const { embeddingLimit } = options;

  logDebug('Fetching maximum videos for microtopic with embeddings', { courseName, microTopic });

  try {
    // Fetch maximum allowed by YouTube API (50 results)
    const youtubeVideos = await youtubeService.searchTargetedVideos(
      courseName,
      microTopic,
      50  // Maximum allowed by YouTube Data API
    );

    if (!youtubeVideos || youtubeVideos.length === 0) {
      return { videos: [], strategy: 'embedding', confidence: 'none' };
    }

    // Use embedding-based matching to find most relevant videos
    const matchedVideos = await matchTopicToVideos(microTopic, youtubeVideos, {
      limit: 3,  // Return only 3 best videos to user
      threshold: 0.3,
    });

    if (matchedVideos && matchedVideos.length > 0) {
      return {
        videos: matchedVideos,
        strategy: 'embedding',
        confidence: 'high',
      };
    }

    // Fallback to keyword ranking if embeddings didn't work
    const rankedVideos = ranking.rankVideos(youtubeVideos, microTopic, 3);
    return {
      videos: rankedVideos,
      strategy: 'keyword',
      confidence: 'medium',
    };
  } catch (error) {
    logWarn('Video fetch failed', { courseName, microTopic, error: error.message });
    return { videos: [], strategy: 'error', confidence: 'none', error: error.message };
  }
};

export default {
  getVideos,
};
