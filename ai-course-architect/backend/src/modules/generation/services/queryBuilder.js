/**
 * Query Builder
 * 
 * Generates search queries for YouTube video search.
 */

/**
 * Build search query
 * @param {string} courseName - Course name/topic
 * @param {string} microTopic - Optional micro topic
 * @returns {string} Search query
 */
export const buildQuery = (courseName, microTopic = '') => {
  if (microTopic) {
    return `${courseName} ${microTopic}`;
  }
  return courseName;
};

export default { buildQuery };
