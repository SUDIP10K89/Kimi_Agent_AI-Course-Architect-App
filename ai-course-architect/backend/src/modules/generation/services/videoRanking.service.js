/**
 * Video Ranking Service
 * 
 * Filters, scores, and sorts videos by relevance to a microTopic.
 */

// Used video indices to prevent duplicates
const usedVideos = new Map();

/**
 * Score a single video for relevance
 * @param {Object} video 
 * @param {string} microTopic 
 * @returns {number} Score (0-100+)
 */
export const scoreVideo = (video, microTopic) => {
  const title = video.title.toLowerCase();
  const desc = (video.description || '').toLowerCase();
  const topic = microTopic.toLowerCase();
  const keywords = topic.split(/\s+/).filter(k => k.length > 2);

  let score = 0;

  // Exact title match (+100)
  if (title.includes(topic)) score += 100;

  // Keyword matches (+50 each)
  keywords.forEach(k => {
    if (title.includes(k)) score += 50;
  });

  // Description match (+10 each)
  keywords.forEach(k => {
    if (desc.includes(k)) score += 10;
  });

  // Duration bonus (+20 for 10-30 min)
  const mins = (video.durationSeconds || 0) / 60;
  if (mins >= 10 && mins <= 30) score += 20;

  // View count bonus (+5 per 100k, max +20)
  score += Math.min(20, Math.floor((video.viewCount || 0) / 100000) * 5);

  return score;
};

/**
 * Rank videos for a microTopic
 * @param {Object[]} videos 
 * @param {string} microTopic 
 * @param {number} maxVideos 
 * @param {string} courseId 
 * @returns {Object[]} Ranked videos
 */
export const rankVideos = (videos, microTopic, maxVideos = 3, courseId = '') => {
  if (!videos?.length) return [];

  const used = usedVideos.get(courseId) || new Set();

  const scored = videos
    .map((video, index) => ({ video, score: scoreVideo(video, microTopic), index }))
    .filter(item => item.score > 0 && !used.has(item.index))
    .sort((a, b) => b.score - a.score);

  const selected = scored.slice(0, maxVideos).map(item => {
    used.add(item.index);
    return item.video;
  });

  if (courseId) usedVideos.set(courseId, used);

  return selected;
};

/**
 * Calculate confidence score
 * @param {Object[]} videos 
 * @returns {Object} { confidence: 'high'|'medium'|'low', needsFallback: boolean }
 */
export const calculateConfidence = (videos) => {
  if (!videos?.length) {
    return { confidence: 'low', needsFallback: true };
  }

  const topScore = videos[0]?.score || 0;
  const avgScore = videos.reduce((sum, v) => sum + v.score, 0) / videos.length;

  if (topScore >= 80) return { confidence: 'high', needsFallback: false };
  if (topScore >= 30) return { confidence: 'medium', needsFallback: false };
  return { confidence: 'low', needsFallback: true };
};

/**
 * Reset used videos for a course
 */
export const resetUsedVideos = (courseId) => {
  usedVideos.delete(courseId);
};

/**
 * Get used video count
 */
export const getUsedCount = (courseId) => {
  return (usedVideos.get(courseId) || new Set()).size;
};

export default { scoreVideo, rankVideos, calculateConfidence, resetUsedVideos };
