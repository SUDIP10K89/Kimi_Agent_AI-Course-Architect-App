import Course from './course.model.js';

export const findById = (courseId, select = null) => {
  const query = Course.findById(courseId);
  if (select) {
    query.select(select);
  }
  return query;
};

export const findByIdAndDelete = (courseId) => Course.findByIdAndDelete(courseId);

export const findOwnedActiveCourseByTopic = (topic, userId) => Course.findOne({
  topic: { $regex: new RegExp(`^${topic}$`, 'i') },
  isArchived: false,
  createdBy: userId,
});

export const findRecentByUser = (userId, limit = 5) => Course.find({ createdBy: userId, isArchived: false })
  .sort({ createdAt: -1 })
  .limit(limit);

export const findPagedByUser = ({ query, sortOptions, skip, limit, select }) => Course.find(query)
  .sort(sortOptions)
  .skip(skip)
  .limit(limit)
  .select(select);

export const countByQuery = (query) => Course.countDocuments(query);

export const aggregateOverviewByUser = (userId) => Course.aggregate([
  { $match: { createdBy: userId, isArchived: false } },
  {
    $group: {
      _id: null,
      totalCourses: { $sum: 1 },
      totalModules: { $sum: { $size: '$modules' } },
      totalMicroTopics: { $sum: '$progress.totalMicroTopics' },
      completedMicroTopics: { $sum: '$progress.completedMicroTopics' },
      avgProgress: { $avg: '$progress.percentage' },
    },
  },
]);

export default {
  aggregateOverviewByUser,
  countByQuery,
  findById,
  findByIdAndDelete,
  findOwnedActiveCourseByTopic,
  findPagedByUser,
  findRecentByUser,
};
