/**
 * YouTube Service
 *
 * Handles all YouTube Data API interactions for fetching relevant videos.
 * Implements caching and fallback strategies for robustness.
 */

import { google } from 'googleapis';
import { YOUTUBE_CONFIG } from '../../../config/env.js';
import { logDebug, logError, logInfo, logWarn } from '../../../shared/utils/logger.js';

const youtube = google.youtube({
  version: 'v3',
  auth: YOUTUBE_CONFIG.API_KEY,
});

const videoCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

const getCacheKey = (query) => query.toLowerCase().trim();

const isCacheValid = (entry) => entry && (Date.now() - entry.timestamp) < CACHE_TTL;

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

const getBestThumbnail = (thumbnails) => {
  if (!thumbnails) return '';

  const qualities = ['maxres', 'standard', 'high', 'medium', 'default'];

  for (const quality of qualities) {
    if (thumbnails[quality]) {
      return thumbnails[quality].url;
    }
  }

  return '';
};

const parseDurationSeconds = (duration) => {
  if (!duration) return 0;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);

  return hours * 3600 + minutes * 60 + seconds;
};

const rankVideosByDuration = (videos) => {
  const MIN_DURATION = 600;
  const MAX_DURATION = 1800;

  return [...videos].sort((a, b) => {
    const aSeconds = a.durationSeconds || 0;
    const bSeconds = b.durationSeconds || 0;

    const aInRange = aSeconds >= MIN_DURATION && aSeconds <= MAX_DURATION;
    const bInRange = bSeconds >= MIN_DURATION && bSeconds <= MAX_DURATION;

    if (aInRange && !bInRange) return -1;
    if (!aInRange && bInRange) return 1;

    return aSeconds - bSeconds;
  });
};

export const searchVideos = async (query, maxResults = YOUTUBE_CONFIG.MAX_RESULTS) => {
  try {
    const cacheKey = getCacheKey(query);
    const cached = videoCache.get(cacheKey);

    if (isCacheValid(cached)) {
      logDebug('YouTube cache hit', { query });
      return cached.data;
    }

    logDebug('Searching YouTube', { query, maxResults });

    const searchResponse = await youtube.search.list({
      part: 'snippet',
      q: query,
      type: 'video',
      videoEmbeddable: 'true',
      videoSyndicated: 'true',
      maxResults: maxResults * 2,
      order: 'relevance',
      safeSearch: 'moderate',
      relevanceLanguage: 'en',
      regionCode: 'US',
      videoDuration: 'medium',
    });

    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      logWarn('No YouTube videos found', { query });
      return [];
    }

    const videoIds = searchResponse.data.items
      .map((item) => item.id.videoId)
      .filter(Boolean)
      .slice(0, maxResults);

    if (videoIds.length === 0) {
      return [];
    }

    const videosResponse = await youtube.videos.list({
      part: 'snippet,contentDetails',
      id: videoIds.join(','),
    });

    if (!videosResponse.data.items) {
      return [];
    }

    const videos = videosResponse.data.items.map((video) => ({
      videoId: video.id,
      title: video.snippet.title,
      description: video.snippet.description?.substring(0, 200) || '',
      thumbnailUrl: getBestThumbnail(video.snippet.thumbnails),
      channelTitle: video.snippet.channelTitle,
      duration: formatDuration(video.contentDetails.duration),
      durationSeconds: parseDurationSeconds(video.contentDetails.duration),
      publishedAt: video.snippet.publishedAt,
    }));

    const rankedVideos = rankVideosByDuration(videos);

    videoCache.set(cacheKey, {
      data: rankedVideos,
      timestamp: Date.now(),
    });

    logDebug('YouTube search completed', { query, resultCount: rankedVideos.length });
    return rankedVideos;
  } catch (error) {
    logError('YouTube search failed', { query, error: error.message });

    if (error.code === 403) {
      const isQuotaExceeded =
        error?.errors?.[0]?.reason === 'quotaExceeded' ||
        error?.errors?.[0]?.reason === 'dailyLimitExceeded' ||
        error?.message?.toLowerCase().includes('quota') ||
        error?.message?.toLowerCase().includes('daily limit');

      if (isQuotaExceeded) {
        logError('YouTube API quota exceeded', { query });
        const quotaError = new Error(
          'YouTube API daily quota exceeded. Video recommendations will be unavailable until the quota resets (midnight Pacific Time). Course content generation will continue without videos.'
        );
        quotaError.code = 'YOUTUBE_QUOTA_EXCEEDED';
        throw quotaError;
      }

      logError('YouTube API access denied', { query });
      const accessError = new Error(
        'YouTube API access denied. Please check your YouTube API key in the server configuration. Video recommendations will be skipped.'
      );
      accessError.code = 'YOUTUBE_ACCESS_DENIED';
      throw accessError;
    }

    if (error.code === 400) {
      logWarn('Invalid YouTube request parameters', { query });
    }

    return [];
  }
};

export const searchEducationalVideos = async (topic, microTopic = '') => {
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

  let videos = await searchVideos(baseQuery);

  if (videos.length === 0) {
    for (const keyword of educationalKeywords) {
      const altQuery = microTopic
        ? `${topic} ${microTopic} ${keyword}`
        : `${topic} ${keyword}`;

      videos = await searchVideos(altQuery);
      if (videos.length > 0) break;
    }
  }

  if (videos.length === 0) {
    videos = await searchVideos(topic);
  }

  if (videos.length === 0) {
    videos = await searchVideos(`${topic} for beginners`);
  }

  return videos;
};

export const batchSearchVideos = async (topics) => {
  const results = {};

  for (const topic of topics) {
    results[topic] = await searchEducationalVideos(topic);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
};

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
    logError('Failed to fetch YouTube video details', { videoId, error: error.message });
    return null;
  }
};

export const clearCache = () => {
  videoCache.clear();
  logInfo('YouTube cache cleared', { cacheSize: 0 });
};

export const getCacheStats = () => ({
  size: videoCache.size,
  entries: Array.from(videoCache.keys()),
});

export const checkYouTubeHealth = async () => {
  try {
    await youtube.search.list({
      part: 'snippet',
      q: 'test',
      maxResults: 1,
    });
    return true;
  } catch (error) {
    logError('YouTube API health check failed', { error: error.message });
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
