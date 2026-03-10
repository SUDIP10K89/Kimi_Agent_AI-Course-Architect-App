import * as youtubeService from '../../providers/video/youtube.service.js';

// In-memory video pool per course (reset on server restart)
// Format: { courseId: { videos: [], usedIndices: Set } }
const courseVideoPools = new Map();

/**
 * Create a video pool for a course by fetching bulk videos (2 API calls)
 * @param {string} courseId - The course ID
 * @param {string} courseName - The course name/topic
 * @param {number} maxVideos - Maximum videos to fetch (default 50)
 * @returns {Promise<Array>} Array of video objects
 */
export const createVideoPool = async (courseId, courseName, maxVideos = 50) => {
  try {
    const videos = await youtubeService.fetchBulkCourseVideos(courseName, maxVideos);
    
    courseVideoPools.set(courseId, {
      videos: videos,
      usedIndices: new Set(),
    });
    
    return videos;
  } catch (error) {
    // If quota exceeded or error, return empty pool
    courseVideoPools.set(courseId, {
      videos: [],
      usedIndices: new Set(),
    });
    return [];
  }
};

/**
 * Get videos for a microTopic from the course video pool
 * Filters by relevance to microTopic title and avoids duplicates
 * @param {string} courseId - The course ID
 * @param {string} microTopicTitle - The microTopic title
 * @param {number} maxVideos - Maximum videos to return (default 3)
 * @returns {Array} Array of video objects
 */
export const getVideosFromPool = (courseId, microTopicTitle, maxVideos = 3) => {
  const pool = courseVideoPools.get(courseId);
  
  if (!pool || !pool.videos || pool.videos.length === 0) {
    return [];
  }
  
  const { videos, usedIndices } = pool;
  const microTopicLower = microTopicTitle.toLowerCase();
  
  // Score and sort videos by relevance to microTopic
  const scoredVideos = videos
    .map((video, index) => {
      if (usedIndices.has(index)) {
        return { video, score: -1, index };
      }
      
      const titleLower = video.title.toLowerCase();
      const descLower = (video.description || '').toLowerCase();
      
      // Calculate relevance score
      let score = 0;
      
      // Exact match in title (highest priority)
      if (titleLower.includes(microTopicLower)) {
        score += 100;
      }
      
      // Keywords match in title
      const keywords = microTopicLower.split(/\\s+/);
      keywords.forEach(keyword => {
        if (keyword.length > 2 && titleLower.includes(keyword)) {
          score += 50;
        }
      });
      
      // Description match
      keywords.forEach(keyword => {
        if (keyword.length > 2 && descLower.includes(keyword)) {
          score += 10;
        }
      });
      
      // Prefer medium duration videos (10-30 min) for tutorials
      const durationMinutes = (video.durationSeconds || 0) / 60;
      if (durationMinutes >= 10 && durationMinutes <= 30) {
        score += 20;
      }
      
      return { video, score, index };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);
  
  // Select top videos
  const selectedVideos = [];
  for (const item of scoredVideos) {
    if (selectedVideos.length >= maxVideos) break;
    if (!usedIndices.has(item.index)) {
      selectedVideos.push(item.video);
      usedIndices.add(item.index);
    }
  }
  
  return selectedVideos;
};

/**
 * Clear video pool for a course
 * @param {string} courseId - The course ID
 */
export const clearVideoPool = (courseId) => {
  courseVideoPools.delete(courseId);
};

/**
 * Legacy function - fetches videos per microTopic (not optimized)
 * @param {string} courseId - Course ID (unused in optimized version but kept for compatibility)
 * @param {string} microTopicTitle - The microTopic title
 * @returns {Promise<Array>} Array of video objects
 */
export const findVideosForMicroTopic = async (courseId, microTopicTitle) => {
  // Check if we have a pool for this course
  const pool = courseVideoPools.get(courseId);
  
  if (pool && pool.videos.length > 0) {
    // Use pool-based filtering
    return getVideosFromPool(courseId, microTopicTitle, 3);
  }
  
  // Fallback to legacy API call (single microTopic search)
  // This path is used if no pool was created
  console.warn(`No video pool found for course ${courseId}, using legacy API`);
  return [];
};

/**
 * Initialize video pool for a course (called during content generation)
 * @param {object} course - The course object
 * @returns {Promise<Array>} Array of video objects
 */
export const initializeVideoPool = async (course) => {
  const courseName = course.searchTopic || course.topic;
  return createVideoPool(String(course._id), courseName, 50);
};

export default {
  findVideosForMicroTopic,
  createVideoPool,
  getVideosFromPool,
  clearVideoPool,
  initializeVideoPool,
};
