/**
 * Unified Cache Service
 *
 * Consolidated caching for:
 * - Video search results
 * - Video embeddings
 * - Video pools for courses
 *
 * Features:
 * - TTL-based expiration
 * - Memory limits with LRU eviction
 * - Stats and monitoring
 */

import { logDebug, logWarn } from '../../../../shared/utils/logger.js';

const CACHE_CONFIG = {
  VIDEO_TTL: 24 * 60 * 60 * 1000, // 24 hours
  EMBEDDING_TTL: 48 * 60 * 60 * 1000, // 48 hours (embeddings are expensive)
  POOL_TTL: 12 * 60 * 60 * 1000, // 12 hours
  MAX_VIDEO_ENTRIES: 1000,
  MAX_EMBEDDING_ENTRIES: 5000,
  MAX_POOL_ENTRIES: 100,
};

/**
 * LRU Cache implementation with TTL
 */
class LRUCache {
  constructor(maxSize, defaultTTL) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.cache = new Map();
    this.accessOrder = new Map();
    this.accessCounter = 0;
  }

  _normalizeKey(key) {
    return String(key).toLowerCase().trim();
  }

  _isValid(entry) {
    if (!entry) return false;
    const expired = entry.expiresAt && Date.now() > entry.expiresAt;
    if (expired) {
      this.delete(entry.key);
      return false;
    }
    return true;
  }

  _evictIfNeeded() {
    if (this.cache.size < this.maxSize) return;

    // Find least recently used entry
    let oldestKey = null;
    let oldestAccess = Infinity;

    for (const [key, accessTime] of this.accessOrder) {
      if (accessTime < oldestAccess) {
        oldestAccess = accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      logDebug('Cache eviction', { reason: 'max_size', key: oldestKey });
    }
  }

  get(key) {
    const normalizedKey = this._normalizeKey(key);
    const entry = this.cache.get(normalizedKey);

    if (!this._isValid(entry)) {
      return null;
    }

    // Update access time for LRU
    this.accessOrder.set(normalizedKey, ++this.accessCounter);
    return entry.value;
  }

  set(key, value, ttl = this.defaultTTL) {
    const normalizedKey = this._normalizeKey(key);
    this._evictIfNeeded();

    this.cache.set(normalizedKey, {
      key: normalizedKey,
      value,
      timestamp: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : null,
    });

    this.accessOrder.set(normalizedKey, ++this.accessCounter);
  }

  delete(key) {
    const normalizedKey = this._normalizeKey(key);
    this.cache.delete(normalizedKey);
    this.accessOrder.delete(normalizedKey);
  }

  clear() {
    this.cache.clear();
    this.accessOrder.clear();
  }

  has(key) {
    return this.get(key) !== null;
  }

  get size() {
    return this.cache.size;
  }

  getStats() {
    const now = Date.now();
    let expiredCount = 0;

    for (const entry of this.cache.values()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expiredCount,
      utilization: (this.cache.size / this.maxSize * 100).toFixed(2) + '%',
    };
  }

  cleanup() {
    let cleaned = 0;
    for (const [key, entry] of this.cache) {
      if (!this._isValid(entry)) {
        cleaned++;
      }
    }
    return cleaned;
  }
}

// Create cache instances
const videoCache = new LRUCache(CACHE_CONFIG.MAX_VIDEO_ENTRIES, CACHE_CONFIG.VIDEO_TTL);
const embeddingCache = new LRUCache(CACHE_CONFIG.MAX_EMBEDDING_ENTRIES, CACHE_CONFIG.EMBEDDING_TTL);
const poolCache = new LRUCache(CACHE_CONFIG.MAX_POOL_ENTRIES, CACHE_CONFIG.POOL_TTL);

/**
 * Video search results cache
 */
export const getVideo = (query) => {
  return videoCache.get(query);
};

export const setVideo = (query, data) => {
  videoCache.set(query, data);
  logDebug('Video cache set', { query, cacheSize: videoCache.size });
};

// Aliases for backward compatibility with cache.get() and cache.set()
export const get = getVideo;
export const set = setVideo;

export const clearVideoCache = () => {
  videoCache.clear();
  logDebug('Video cache cleared');
};

/**
 * Video embedding cache
 */
const getEmbeddingCacheKey = (title, description = '') => {
  return `${title}||${description}`;
};

export const getVideoEmbedding = (title, description = '') => {
  const key = getEmbeddingCacheKey(title, description);
  return embeddingCache.get(key);
};

export const setVideoEmbedding = (title, description, embedding) => {
  const key = getEmbeddingCacheKey(title, description);
  embeddingCache.set(key, embedding);
  logDebug('Video embedding cached', { title, embeddingDimension: embedding.length });
};

export const clearEmbeddingCache = () => {
  embeddingCache.clear();
  logDebug('Video embedding cache cleared');
};

export const getEmbeddingCacheSize = () => embeddingCache.size;

/**
 * Video pool cache (for bulk course videos)
 */
export const getPool = (courseId) => {
  return poolCache.get(courseId);
};

export const setPool = (courseId, videos) => {
  poolCache.set(courseId, videos);
  logDebug('Video pool set', { courseId, videoCount: videos.length });
};

export const clearPool = (courseId) => {
  poolCache.delete(courseId);
  logDebug('Video pool cleared', { courseId });
};

export const clearAllPools = () => {
  poolCache.clear();
  logDebug('All video pools cleared');
};

/**
 * Cache statistics and monitoring
 */
export const getStats = () => ({
  videos: videoCache.getStats(),
  embeddings: embeddingCache.getStats(),
  pools: poolCache.getStats(),
  totalEntries: videoCache.size + embeddingCache.size + poolCache.size,
});

/**
 * Cleanup expired entries
 */
export const cleanup = () => ({
  videos: videoCache.cleanup(),
  embeddings: embeddingCache.cleanup(),
  pools: poolCache.cleanup(),
});

/**
 * Memory management - clear oldest entries if memory is high
 */
export const trimCache = (percentage = 10) => {
  const trimCount = (count, pct) => Math.floor(count * (pct / 100));

  if (videoCache.size > 0) {
    const toRemove = trimCount(videoCache.size, percentage);
    logDebug('Trimming video cache', { toRemove });
    // Simple trim: clear oldest by recreating with limited entries
    const entries = Array.from(videoCache.cache.entries()).slice(toRemove);
    videoCache.clear();
    for (const [key, entry] of entries) {
      videoCache.cache.set(key, entry);
      videoCache.accessOrder.set(key, videoCache.accessCounter++);
    }
  }

  if (embeddingCache.size > 0) {
    const toRemove = trimCount(embeddingCache.size, percentage);
    logDebug('Trimming embedding cache', { toRemove });
    const entries = Array.from(embeddingCache.cache.entries()).slice(toRemove);
    embeddingCache.clear();
    for (const [key, entry] of entries) {
      embeddingCache.cache.set(key, entry);
      embeddingCache.accessOrder.set(key, embeddingCache.accessCounter++);
    }
  }
};

export default {
  // Video cache
  getVideo,
  setVideo,
  clearVideoCache,
  // Embedding cache
  getVideoEmbedding,
  setVideoEmbedding,
  clearEmbeddingCache,
  getEmbeddingCacheSize,
  // Pool cache
  getPool,
  setPool,
  clearPool,
  clearAllPools,
  // Monitoring
  getStats,
  cleanup,
  trimCache,
};
