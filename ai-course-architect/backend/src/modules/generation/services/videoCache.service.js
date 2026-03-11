/**
 * Video Cache Service
 * 
 * In-memory caching for video search results.
 * Saves API quota by reusing results.
 */

const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cache key
 */
const getKey = (query) => query.toLowerCase().trim();

/**
 * Check if cache entry is valid
 */
const isValid = (entry) => entry && (Date.now() - entry.timestamp) < CACHE_TTL;

/**
 * Get cached results
 */
export const get = (query) => {
  const key = getKey(query);
  const entry = cache.get(key);
  
  if (isValid(entry)) {
    return entry.data;
  }
  
  cache.delete(key);
  return null;
};

/**
 * Store results in cache
 */
export const set = (query, data) => {
  const key = getKey(query);
  cache.set(key, { data, timestamp: Date.now() });
};

/**
 * Clear all cache
 */
export const clear = () => {
  cache.clear();
};

/**
 * Get cache stats
 */
export const stats = () => ({
  size: cache.size,
  keys: Array.from(cache.keys()),
});

/**
 * Video pool management (for bulk search)
 */
const videoPools = new Map();

/**
 * Get videos from pool for a course
 */
export const getFromPool = (courseId) => {
  return videoPools.get(courseId) || null;
};

/**
 * Store videos in pool for a course
 */
export const setPool = (courseId, videos) => {
  videoPools.set(courseId, videos);
};

/**
 * Clear pool for a course
 */
export const clearPool = (courseId) => {
  videoPools.delete(courseId);
};

export default { get, set, clear, stats, getFromPool, setPool, clearPool };
