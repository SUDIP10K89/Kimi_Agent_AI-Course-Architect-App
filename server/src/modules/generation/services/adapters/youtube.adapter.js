/**
 * YouTube Adapter
 * 
 * Pure API layer - ONLY talks to YouTube Data API.
 * No business logic, no caching, no ranking.
 */

import { google } from 'googleapis';
import { YOUTUBE_CONFIG } from '../../../../config/env.js';
import { logError, logWarn } from '../../../../shared/utils/logger.js';

const youtube = google.youtube({ version: 'v3', auth: YOUTUBE_CONFIG.API_KEY });

/**
 * Search for videos by query
 * @param {string} query - Search query
 * @param {number} maxResults - Max results
 * @returns {Promise<string[]>} Array of video IDs
 */
export const searchVideos = async (query, maxResults = 25) => {
  try {
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

    if (!response.data.items?.length) return [];

    return response.data.items
      .map(item => item.id.videoId)
      .filter(Boolean);
  } catch (error) {
    logError('YouTube search failed', { query, error: error.message });
    throw error;
  }
};

/**
 * Fetch details for multiple videos
 * @param {string[]} videoIds - Array of video IDs
 * @returns {Promise<Object[]>} Array of video details
 */
export const fetchVideoDetails = async (videoIds) => {
  if (!videoIds?.length) return [];

  const videos = [];
  const CHUNK_SIZE = 50;

  for (let i = 0; i < videoIds.length; i += CHUNK_SIZE) {
    const chunk = videoIds.slice(i, i + CHUNK_SIZE);
    
    const response = await youtube.videos.list({
      part: 'snippet,contentDetails,statistics',
      id: chunk.join(','),
    });

    if (response.data.items) {
      response.data.items.forEach(video => {
        videos.push(formatVideo(video));
      });
    }
  }

  return videos;
};

/**
 * Format video object
 */
const formatVideo = (video) => ({
  videoId: video.id,
  title: video.snippet.title,
  description: video.snippet.description?.substring(0, 200) || '',
  thumbnailUrl: getBestThumbnail(video.snippet.thumbnails),
  channelTitle: video.snippet.channelTitle,
  duration: parseDuration(video.contentDetails.duration),
  durationSeconds: parseDurationSeconds(video.contentDetails.duration),
  publishedAt: video.snippet.publishedAt,
  viewCount: parseInt(video.statistics?.viewCount || '0', 10),
});

/**
 * Get best thumbnail
 */
const getBestThumbnail = (thumbnails) => {
  if (!thumbnails) return '';
  const qualities = ['maxres', 'standard', 'high', 'medium', 'default'];
  for (const q of qualities) {
    if (thumbnails[q]) return thumbnails[q].url;
  }
  return '';
};

/**
 * Parse ISO duration to human readable
 */
const parseDuration = (duration) => {
  if (!duration) return '';
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = parseInt(match[1] || 0);
  const m = parseInt(match[2] || 0);
  const s = parseInt(match[3] || 0);
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
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
 * Check if quota exceeded
 */
export const isQuotaExceeded = (error) => {
  return error?.code === 403 && (
    error?.errors?.[0]?.reason === 'quotaExceeded' ||
    error?.message?.toLowerCase().includes('quota')
  );
};

/**
 * Health check for YouTube API
 * @returns {Promise<boolean>} True if API is accessible
 */
export const checkHealth = async () => {
  try {
    await youtube.channels.list({
      part: 'id',
      mine: true,
      maxResults: 1,
    });
    return true;
  } catch (error) {
    // If quota exceeded or auth error, API is still "working" just limited
    if (error?.code === 403 && error?.errors?.[0]?.reason === 'quotaExceeded') {
      return true; // API is working, just quota exceeded
    }
    // For other errors (network, invalid key, etc.), consider unhealthy
    logWarn('YouTube API health check failed', { error: error.message });
    return false;
  }
};

export default { searchVideos, fetchVideoDetails, isQuotaExceeded, checkHealth };
