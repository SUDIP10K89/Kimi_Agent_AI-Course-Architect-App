/**
 * YouTube Adapter
 * 
 * Pure API layer that only handles YouTube Data API interactions.
 * No business logic - just HTTP calls to YouTube.
 * 
 * Responsibilities:
 * - Search for videos
 * - Fetch video details
 * - Handle API errors and quota limits
 */

import { google } from 'googleapis';
import { YOUTUBE_CONFIG } from '../../../config/env.js';
import { logDebug, logError, logInfo, logWarn } from '../../../shared/utils/logger.js';

const youtube = google.youtube({
  version: 'v3',
  auth: YOUTUBE_CONFIG.API_KEY,
});

// Cache for API responses (24 hours TTL)
const apiCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Check if cached data is still valid
 */
const isCacheValid = (entry) => entry && (Date.now() - entry.timestamp) < CACHE_TTL;

/**
 * Format ISO 8601 duration to human readable
 */
const formatDuration = (duration) => {
  if (!duration) return '';
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Parse duration to seconds
 */
const parseDurationSeconds = (duration) => {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || 0) * 3600) + (parseInt(match[2] || 0) * 60) + parseInt(match[3] || 0);
};

/**
 * Get best quality thumbnail URL
 */
const getBestThumbnail = (thumbnails) => {
  if (!thumbnails) return '';
  const qualities = ['maxres', 'standard', 'high', 'medium', 'default'];
  for (const quality of qualities) {
    if (thumbnails[quality]) return thumbnails[quality].url;
  }
  return '';
};

/**
 * Search for videos by query
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum results to return
 * @returns {Promise<Array>} Array of video ID strings
 */
export const searchVideos = async (query, maxResults = 50) => {
  const cacheKey = `search:${query.toLowerCase().trim()}:${maxResults}`;
  const cached = apiCache.get(cacheKey);

  if (isCacheValid(cached)) {
    logDebug('YouTube search cache hit', { query });
    return cached.data;
  }

  try {
    logDebug('YouTube API: searching videos', { query, maxResults });

    const response = await youtube.search.list({
      part: 'snippet',
      q: query,
      type: 'video',
      videoEmbeddable: 'true',
      videoSyndicated: 'true',
      maxResults,
      order: 'relevance',
      safeSearch: 'moderate',
      relevanceLanguage: 'en',
      regionCode: 'US',
    });

    if (!response.data.items?.length) {
      logWarn('YouTube API: no results found', { query });
      return [];
    }

    const videoIds = response.data.items
      .map((item) => item.id.videoId)
      .filter(Boolean);

    apiCache.set(cacheKey, { data: videoIds, timestamp: Date.now() });
    return videoIds;
  } catch (error) {
    logError('YouTube API: search failed', { query, error: error.message });
    throw error;
  }
};

/**
 * Fetch details for multiple video IDs
 * @param {Array<string>} videoIds - Array of YouTube video IDs
 * @returns {Promise<Array>} Array of video detail objects
 */
export const fetchVideoDetails = async (videoIds) => {
  if (!videoIds?.length) return [];

  const cacheKey = `details:${videoIds.join(',')}`;
  const cached = apiCache.get(cacheKey);

  if (isCacheValid(cached)) {
    logDebug('YouTube API: cache hit for video details', { count: videoIds.length });
    return cached.data;
  }

  try {
    logDebug('YouTube API: fetching video details', { count: videoIds.length });

    // YouTube API allows max 50 IDs per request
    const CHUNK_SIZE = 50;
    const allVideos = [];

    for (let i = 0; i < videoIds.length; i += CHUNK_SIZE) {
      const chunk = videoIds.slice(i, i + CHUNK_SIZE);
      
      const response = await youtube.videos.list({
        part: 'snippet,contentDetails,statistics',
        id: chunk.join(','),
      });

      if (response.data.items) {
        const videos = response.data.items.map((video) => ({
          videoId: video.id,
          title: video.snippet.title,
          description: video.snippet.description?.substring(0, 200) || '',
          thumbnailUrl: getBestThumbnail(video.snippet.thumbnails),
          channelTitle: video.snippet.channelTitle,
          duration: formatDuration(video.contentDetails.duration),
          durationSeconds: parseDurationSeconds(video.contentDetails.duration),
          publishedAt: video.snippet.publishedAt,
          viewCount: parseInt(video.statistics?.viewCount || '0', 10),
          likeCount: parseInt(video.statistics?.likeCount || '0', 10),
        }));
        allVideos.push(...videos);
      }
    }

    apiCache.set(cacheKey, { data: allVideos, timestamp: Date.now() });
    return allVideos;
  } catch (error) {
    logError('YouTube API: fetch video details failed', { count: videoIds.length, error: error.message });
    throw error;
  }
};

/**
 * Fetch single video details
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object|null>} Video detail object or null
 */
export const fetchSingleVideo = async (videoId) => {
  const videos = await fetchVideoDetails([videoId]);
  return videos[0] || null;
};

/**
 * Check if API key is valid
 * @returns {Promise<boolean>}
 */
export const healthCheck = async () => {
  try {
    await youtube.search.list({ part: 'snippet', q: 'test', maxResults: 1 });
    return true;
  } catch (error) {
    logError('YouTube API: health check failed', { error: error.message });
    return false;
  }
};

/**
 * Clear the cache
 */
export const clearCache = () => {
  apiCache.clear();
  logInfo('YouTube API cache cleared');
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => ({
  size: apiCache.size,
  entries: Array.from(apiCache.keys()),
});

/**
 * Check if quota is exceeded
 * @param {Error} error - YouTube API error
 * @returns {boolean}
 */
export const isQuotaExceeded = (error) => {
  return (
    error?.code === 403 &&
    (error?.errors?.[0]?.reason === 'quotaExceeded' ||
      error?.errors?.[0]?.reason === 'dailyLimitExceeded' ||
      error?.message?.toLowerCase().includes('quota') ||
      error?.message?.toLowerCase().includes('daily limit'))
  );
};

export default {
  searchVideos,
  fetchVideoDetails,
  fetchSingleVideo,
  healthCheck,
  clearCache,
  getCacheStats,
  isQuotaExceeded,
};
