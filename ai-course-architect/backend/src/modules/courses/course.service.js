import * as courseRepository from './course.repository.js';

export const ensureCourseOwnership = (course, userId) => {
  const ownerId = course.createdBy?._id || course.createdBy;
  if (String(ownerId) !== String(userId)) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }
};

export const getCourseWithStatus = async (courseId) => {
  const course = await courseRepository.findById(courseId);

  if (!course) {
    throw new Error('Course not found');
  }

  let generatedMicroTopics = 0;
  let totalMicroTopics = 0;

  course.modules.forEach((module) => {
    module.microTopics.forEach((microTopic) => {
      totalMicroTopics++;
      if (microTopic.content && microTopic.videos.length > 0) {
        generatedMicroTopics++;
      }
    });
  });

  const derivedPercentage = totalMicroTopics > 0
    ? Math.round((generatedMicroTopics / totalMicroTopics) * 100)
    : 0;

  const storedGeneration = course.metadata?.generation || {};
  const storedState = storedGeneration.status || 'idle';
  const normalizedState = generatedMicroTopics === totalMicroTopics && totalMicroTopics > 0
    ? 'completed'
    : storedState === 'idle' && generatedMicroTopics > 0
      ? 'in-progress'
      : storedState;

  return {
    course: course.toObject(),
    generationStatus: {
      isComplete: generatedMicroTopics === totalMicroTopics,
      generatedCount: generatedMicroTopics,
      totalCount: totalMicroTopics,
      percentage: normalizedState === 'completed'
        ? 100
        : typeof storedGeneration.progress === 'number'
          ? storedGeneration.progress
          : derivedPercentage,
      state: normalizedState,
      failed: normalizedState === 'failed' || course.metadata?.generationFailed || false,
      interrupted: normalizedState === 'interrupted',
      failedReason: storedGeneration.error || course.metadata?.generationFailedReason || null,
      message: storedGeneration.message || null,
      lastEvent: storedGeneration.event || null,
      updatedAt: storedGeneration.updatedAt || null,
    },
  };
};

export const completeMicroTopic = async (courseId, moduleId, microTopicId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) {
    throw new Error('Course not found');
  }

  await course.completeMicroTopic(moduleId, microTopicId);
  return course;
};

export const uncompleteMicroTopic = async (courseId, moduleId, microTopicId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) {
    throw new Error('Course not found');
  }

  await course.uncompleteMicroTopic(moduleId, microTopicId);
  return course;
};

export const deleteCourse = async (courseId) => {
  const result = await courseRepository.findByIdAndDelete(courseId);
  return !!result;
};

export const archiveCourse = async (courseId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) {
    throw new Error('Course not found');
  }

  course.isArchived = true;
  await course.save();
  return course;
};

export const exportCourse = async (courseId) => {
  const course = await courseRepository.findById(courseId);
  if (!course) {
    throw new Error('Course not found');
  }

  return {
    title: course.title,
    description: course.description,
    topic: course.topic,
    generatedAt: course.metadata.generatedAt,
    modules: course.modules.map((module) => ({
      title: module.title,
      microTopics: module.microTopics.map((microTopic) => ({
        title: microTopic.title,
        content: microTopic.content,
        videos: microTopic.videos,
      })),
    })),
  };
};

export default {
  archiveCourse,
  completeMicroTopic,
  deleteCourse,
  ensureCourseOwnership,
  exportCourse,
  getCourseWithStatus,
  uncompleteMicroTopic,
};
