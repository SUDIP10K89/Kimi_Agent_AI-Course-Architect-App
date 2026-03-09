/**
 * YouTube Service
 * 
 * Handles all YouTube Data API interactions for fetching relevant videos.
 * Implements caching and fallback strategies for robustness.
 */

import { google } from 'googleapis';
import { YOUTUBE_CONFIG } from '../config/env.js';

// Initialize YouTube API client
const youtube = google.youtube({
  version: 'v3',
  auth: YOUTUBE_CONFIG.API_KEY,
});

/**
 * Cache for video search results
 * Simple in-memory cache to reduce API calls
 */
const videoCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate cache key from search query
 * @param {string} query - Search query
 * @returns {string} Cache key
 */
const getCacheKey = (query) => query.toLowerCase().trim();

/**
 * Check if cache entry is valid
 * @param {Object} entry - Cache entry
 * @returns {boolean} True if valid
 */
const isCacheValid = (entry) => {
  return entry && (Date.now() - entry.timestamp) < CACHE_TTL;
};

/**
 * Format video duration from ISO 8601 to readable format
 * @param {string} duration - ISO 8601 duration (PT#H#M#S)
 * @returns {string} Formatted duration (e.g., "10:30")
 */
const formatDuration = (duration) => {
  if (!duration) return '';

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';

  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Extract best thumbnail URL from video snippet
 * @param {Object} thumbnails - Thumbnails object from API
 * @returns {string} Best available thumbnail URL
 */
const getBestThumbnail = (thumbnails) => {
  if (!thumbnails) return '';

  // Prefer higher quality thumbnails
  const qualities = ['maxres', 'standard', 'high', 'medium', 'default'];

  for (const quality of qualities) {
    if (thumbnails[quality]) {
      return thumbnails[quality].url;
    }
  }

  return '';
};

/**
 * Parse ISO 8601 duration to seconds
 * @param {string} duration - ISO 8601 duration (PT#H#M#S)
 * @returns {number} Duration in seconds
 */
const parseDurationSeconds = (duration) => {
  if (!duration) return 0;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);

  return hours * 3600 + minutes * 60 + seconds;
};

/**
 * Rank videos by duration preference (prefer 10-30 minute videos for courses)
 * @param {Array} videos - Array of video objects with durationSeconds
 * @returns {Array} Re-ranked video array
 */
const rankVideosByDuration = (videos) => {
  const MIN_DURATION = 600;  // 10 minutes
  const MAX_DURATION = 1800; // 30 minutes

  return [...videos].sort((a, b) => {
    const aSeconds = a.durationSeconds || 0;
    const bSeconds = b.durationSeconds || 0;

    const aInRange = aSeconds >= MIN_DURATION && aSeconds <= MAX_DURATION;
    const bInRange = bSeconds >= MIN_DURATION && bSeconds <= MAX_DURATION;

    // Prefer videos in the ideal range (10-30 minutes)
    if (aInRange && !bInRange) return -1;
    if (!aInRange && bInRange) return 1;

    // If both in range or both out of range, prefer shorter videos
    return aSeconds - bSeconds;
  });
};

/**
 * Search for relevant YouTube videos
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum number of results (default: 3)
 * @returns {Promise<Array>} Array of video objects
 */
export const searchVideos = async (query, maxResults = YOUTUBE_CONFIG.MAX_RESULTS) => {
  try {
    // Check cache first
    const cacheKey = getCacheKey(query);
    const cached = videoCache.get(cacheKey);

    if (isCacheValid(cached)) {
      console.log(`📦 Cache hit for query: "${query}"`);
      return cached.data;
    }

    console.log(`🔍 Searching YouTube for: "${query}"`);

    // Search for videos
    const searchResponse = await youtube.search.list({
      part: 'snippet',
      q: query,
      type: 'video',
      videoEmbeddable: 'true',
      videoSyndicated: 'true',
      maxResults: maxResults * 2, // Fetch more to filter
      order: 'relevance', // Can be 'relevance', 'date', 'viewCount', 'rating'
      safeSearch: 'moderate',
      // Language and region settings for better results
      relevanceLanguage: 'en',
      regionCode: 'US',
      // Duration filter: 'short' (<4min), 'medium' (4-20min), 'long' (>20min)
      videoDuration: 'medium',
    });

    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      console.warn(`⚠️  No videos found for query: "${query}"`);
      return [];
    }

    // Get video IDs for detailed info
    const videoIds = searchResponse.data.items
      .map(item => item.id.videoId)
      .filter(Boolean)
      .slice(0, maxResults);

    if (videoIds.length === 0) {
      return [];
    }

    // Fetch detailed video information (including duration)
    const videosResponse = await youtube.videos.list({
      part: 'snippet,contentDetails',
      id: videoIds.join(','),
    });

    if (!videosResponse.data.items) {
      return [];
    }

    // Format video data
    const videos = videosResponse.data.items.map(video => ({
      videoId: video.id,
      title: video.snippet.title,
      description: video.snippet.description?.substring(0, 200) || '',
      thumbnailUrl: getBestThumbnail(video.snippet.thumbnails),
      channelTitle: video.snippet.channelTitle,
      duration: formatDuration(video.contentDetails.duration),
      durationSeconds: parseDurationSeconds(video.contentDetails.duration),
      publishedAt: video.snippet.publishedAt,
    }));

    // Re-rank videos by duration preference (prefer 10-30 minute videos for courses)
    const rankedVideos = rankVideosByDuration(videos);

    // Cache the results
    videoCache.set(cacheKey, {
      data: rankedVideos,
      timestamp: Date.now(),
    });

    console.log(`✅ Found ${rankedVideos.length} videos for "${query}"`);

    return rankedVideos;

  } catch (error) {
    console.error('❌ YouTube search error:', error.message);

    // Detect quota exhaustion — surface to caller so user can be notified
    if (error.code === 403) {
      const isQuotaExceeded =
        error?.errors?.[0]?.reason === 'quotaExceeded' ||
        error?.errors?.[0]?.reason === 'dailyLimitExceeded' ||
        error?.message?.toLowerCase().includes('quota') ||
        error?.message?.toLowerCase().includes('daily limit');

      if (isQuotaExceeded) {
        console.error('❌ YouTube API daily quota exceeded');
        const quotaError = new Error(
          'YouTube API daily quota exceeded. Video recommendations will be unavailable until the quota resets (midnight Pacific Time). Course content generation will continue without videos.'
        );
        quotaError.code = 'YOUTUBE_QUOTA_EXCEEDED';
        throw quotaError;
      }

      console.error('   YouTube API access denied — invalid API key or insufficient permissions');
      const accessError = new Error(
        'YouTube API access denied. Please check your YouTube API key in the server configuration. Video recommendations will be skipped.'
      );
      accessError.code = 'YOUTUBE_ACCESS_DENIED';
      throw accessError;
    }

    if (error.code === 400) {
      console.error('   Invalid request parameters');
    }

    // Return empty array on other errors - don't break the course generation
    return [];
  }
};

/**
 * Search videos for a course topic with educational focus
 * @param {string} topic - Course topic
 * @param {string} microTopic - Specific micro-topic (optional)
 * @returns {Promise<Array>} Array of educational videos
 */
export const searchEducationalVideos = async (topic, microTopic = '') => {
  // Build educational-focused query
  const baseQuery = microTopic
    ? `${topic} ${microTopic} tutorial`
    : `${topic} course tutorial`;

  const educationalKeywords = [
    'tutorial',
    'course',
    'explained',
    'introduction',
    'basics',
    'complete course',
    'full course',
    'learn',
  ];

  // Try the main query first
  let videos = await searchVideos(baseQuery);

  // If no results, try with educational keywords
  if (videos.length === 0) {
    for (const keyword of educationalKeywords) {
      const altQuery = microTopic
        ? `${topic} ${microTopic} ${keyword}`
        : `${topic} ${keyword}`;

      videos = await searchVideos(altQuery);
      if (videos.length > 0) break;
    }
  }

  // If still no results, try searching for just the topic name
  if (videos.length === 0) {
    videos = await searchVideos(topic);
  }

  // If still no results, try with "for beginners" suffix
  if (videos.length === 0) {
    videos = await searchVideos(`${topic} for beginners`);
  }

  return videos;
};

/**
 * Fetch videos for multiple topics in batch
 * @param {Array<string>} topics - Array of search queries
 * @returns {Promise<Object>} Object mapping topics to videos
 */
export const batchSearchVideos = async (topics) => {
  const results = {};

  // Process sequentially to avoid rate limits
  for (const topic of topics) {
    results[topic] = await searchEducationalVideos(topic);

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
};

/**
 * Get video details by ID
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object|null>} Video details or null
 */
export const getVideoDetails = async (videoId) => {
  try {
    const response = await youtube.videos.list({
      part: 'snippet,contentDetails,statistics',
      id: videoId,
    });

    if (!response.data.items || response.data.items.length === 0) {
      return null;
    }

    const video = response.data.items[0];

    return {
      videoId: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnailUrl: getBestThumbnail(video.snippet.thumbnails),
      channelTitle: video.snippet.channelTitle,
      duration: formatDuration(video.contentDetails.duration),
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount,
      publishedAt: video.snippet.publishedAt,
    };

  } catch (error) {
    console.error('Error fetching video details:', error.message);
    return null;
  }
};

/**
 * Clear the video cache
 */
export const clearCache = () => {
  videoCache.clear();
  console.log('🗑️  Video cache cleared');
};

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export const getCacheStats = () => {
  return {
    size: videoCache.size,
    entries: Array.from(videoCache.keys()),
  };
};

/**
 * Health check for YouTube API
 * @returns {Promise<boolean>} True if API is accessible
 */
export const checkYouTubeHealth = async () => {
  try {
    await youtube.search.list({
      part: 'snippet',
      q: 'test',
      maxResults: 1,
    });
    return true;
  } catch (error) {
    console.error('YouTube API health check failed:', error.message);
    return false;
  }
};

export default {
  searchVideos,
  searchEducationalVideos,
  batchSearchVideos,
  getVideoDetails,
  clearCache,
  getCacheStats,
  checkYouTubeHealth,
};
