/**
 * Course Service
 * 
 * Orchestrates the course generation process.
 * Combines AI generation with video fetching to create complete courses.
 */

import Course from '../models/Course.js';
import * as openaiService from './openaiService.js';
import * as youtubeService from './youtubeService.js';
import { sendProgress, sendError, sendComplete } from '../utils/sse.js';

/**
 * Generate a complete course from a topic
 * @param {string} topic - The course topic
 * @returns {Promise<Object>} Generated course document
 */
export const generateCourse = async (topic, userId) => {
  try {
    console.log(`\n🚀 Starting course generation for: "${topic}" (user ${userId})\n`);
    
    // Step 1: Generate course outline using AI
    const outline = await openaiService.generateCourseOutline(topic);
    
    // Step 2: Prepare course structure
    const courseData = {
      createdBy: userId,
      title: outline.title,
      description: outline.description,
      topic: topic,
      difficulty: 'beginner',
      modules: [],
      progress: {
        completedMicroTopics: 0,
        totalMicroTopics: 0,
        percentage: 0,
      },
      metadata: {
        generatedAt: new Date(),
        lastAccessed: new Date(),
        version: 1,
      },
    };
    
    // Step 3: Build modules with micro-topics
    let totalMicroTopics = 0;
    
    for (let moduleIndex = 0; moduleIndex < outline.modules.length; moduleIndex++) {
      const moduleOutline = outline.modules[moduleIndex];
      
      const moduleData = {
        title: moduleOutline.title,
        description: '',
        order: moduleIndex,
        microTopics: [],
      };
      
      // Create micro-topics
      for (let topicIndex = 0; topicIndex < moduleOutline.microTopics.length; topicIndex++) {
        const microTopicTitle = moduleOutline.microTopics[topicIndex];
        
        moduleData.microTopics.push({
          title: microTopicTitle,
          order: topicIndex,
          isCompleted: false,
          content: null,
          videos: [],
        });
        
        totalMicroTopics++;
      }
      
      courseData.modules.push(moduleData);
    }
    
    courseData.progress.totalMicroTopics = totalMicroTopics;
    
    // Step 4: Save initial course structure
    const course = new Course(courseData);
    await course.save();
    
    console.log(`✅ Course structure created with ID: ${course._id}`);
    console.log(`   📚 ${courseData.modules.length} modules`);
    console.log(`   📝 ${totalMicroTopics} micro-topics`);
    
    // Step 5: Start async content generation
    // We don't await this - it runs in background
    generateCourseContent(course._id).catch(error => {
      console.error('Background content generation failed:', error.message);
    });
    
    return course;
    
  } catch (error) {
    console.error('❌ Course generation failed:', error.message);
    throw error;
  }
};

/**
 * Generate content for all micro-topics in a course
 * This runs asynchronously after course creation
 * @param {string} courseId - Course ID
 */
export const generateCourseContent = async (courseId) => {
  try {
    console.log(`\n🔄 Starting content generation for course: ${courseId}\n`);
    
    // Send initial progress
    sendProgress(courseId, 0, 'Starting content generation...');
    
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Calculate total items to process
    let totalItems = 0;
    course.modules.forEach(module => {
      totalItems += module.microTopics.length; // Each micro-topic needs content + videos
    });
    
    let processedItems = 0;
    const updateProgress = (message) => {
      const progress = Math.round((processedItems / totalItems) * 100);
      sendProgress(courseId, progress, message);
    };
    
    // Process each module
    for (const module of course.modules) {
      console.log(`📖 Processing module: "${module.title}"`);
      sendProgress(courseId, Math.round((processedItems / totalItems) * 100), `Processing module: ${module.title}`);
      
      // Process each micro-topic
      for (const microTopic of module.microTopics) {
        try {
          // Generate lesson content
          console.log(`   📝 Generating content for: "${microTopic.title}"`);
          updateProgress(`Generating lesson: ${microTopic.title}`);
          
          const lessonContent = await openaiService.generateLessonContent(
            microTopic.title,
            module.title,
            course.title
          );
          
          microTopic.content = lessonContent;
          processedItems++;
          updateProgress(`Content generated for: ${microTopic.title}`);
          
          // Fetch relevant videos
          console.log(`   🎥 Fetching videos for: "${microTopic.title}"`);
          updateProgress(`Finding videos for: ${microTopic.title}`);
          
          const videos = await youtubeService.searchEducationalVideos(
            course.topic,
            microTopic.title
          );
          
          microTopic.videos = videos.slice(0, 3); // Max 3 videos per topic
          processedItems++;
          
          // Save after each micro-topic (for progress tracking)
          await course.save();
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`   ❌ Error processing "${microTopic.title}":`, error.message);
          sendError(courseId, `Failed to generate content for: ${microTopic.title}`);
          // Continue with next micro-topic
        }
      }
    }
    
    sendComplete(courseId, { 
      message: 'Course content generation complete',
      courseId: course._id,
      title: course.title
    });
    console.log(`\n✅ Content generation completed for course: ${courseId}\n`);
    
  } catch (error) {
    console.error('❌ Content generation error:', error.message);
    sendError(courseId, error.message);
    throw error;
  }
};

/**
 * Continue/Resume content generation for a course
 * Only generates content for micro-topics that don't have content yet
 * @param {string} courseId - Course ID
 */
export const continueCourseContent = async (courseId) => {
  try {
    console.log(`\n🔄 Continuing content generation for course: ${courseId}\n`);
    
    // Send initial progress
    sendProgress(courseId, 0, 'Resuming content generation...');
    
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Find micro-topics that need content
    const topicsNeedingContent = [];
    const topicsNeedingVideos = [];
    
    course.modules.forEach(module => {
      module.microTopics.forEach(microTopic => {
        // Check if content exists and has explanation
        const hasContent = microTopic.content && microTopic.content.explanation;
        // Check if videos exist and have at least one video
        const hasVideos = microTopic.videos && Array.isArray(microTopic.videos) && microTopic.videos.length > 0;
        
        if (!hasContent) {
          topicsNeedingContent.push({ microTopic, module });
        } else if (!hasVideos) {
          topicsNeedingVideos.push({ microTopic, module });
        }
      });
    });
    
    const totalItems = topicsNeedingContent.length + topicsNeedingVideos.length;
    
    console.log(`📊 Found ${topicsNeedingContent.length} topics needing content and ${topicsNeedingVideos.length} needing videos`);
    
    // Debug: Log each topic's status
    course.modules.forEach(module => {
      module.microTopics.forEach(microTopic => {
        const hasContent = microTopic.content && microTopic.content.explanation;
        const hasVideos = microTopic.videos && Array.isArray(microTopic.videos) && microTopic.videos.length > 0;
        console.log(`   - ${microTopic.title}: content=${!!hasContent}, videos=${!!hasVideos}`);
      });
    });
    
    if (totalItems === 0) {
      sendComplete(courseId, { 
        message: 'Course content is already complete!',
        courseId: course._id,
        title: course.title
      });
      console.log(`\n✅ Course content is already complete: ${courseId}\n`);
      return { message: 'Course content is already complete', courseId };
    }
    
    console.log(`📊 Found ${topicsNeedingContent.length} topics needing content and ${topicsNeedingVideos.length} needing videos`);
    
    let processedItems = 0;
    const updateProgress = (message) => {
      const progress = Math.round((processedItems / totalItems) * 100);
      sendProgress(courseId, progress, message);
    };
    
    // FIRST: Process topics that already have content but need videos
    for (const { microTopic, module } of topicsNeedingVideos) {
      try {
        console.log(`   🎥 Fetching videos for: "${microTopic.title}"`);
        updateProgress(`Finding videos for: ${microTopic.title}`);
        
        const videos = await youtubeService.searchEducationalVideos(
          course.topic,
          microTopic.title
        );
        
        microTopic.videos = videos.slice(0, 3);
        processedItems++;
        
        await course.save();
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`   ❌ Error fetching videos for "${microTopic.title}":`, error.message);
        sendError(courseId, `Failed to fetch videos for: ${microTopic.title}`);
        // Continue with next
      }
    }
    
    // SECOND: Process topics that need content (generate both content and videos)
    for (const { microTopic, module } of topicsNeedingContent) {
      try {
        console.log(`   📝 Generating content for: "${microTopic.title}"`);
        updateProgress(`Generating lesson: ${microTopic.title}`);
        
        const lessonContent = await openaiService.generateLessonContent(
          microTopic.title,
          module.title,
          course.title
        );
        
        microTopic.content = lessonContent;
        processedItems++;
        updateProgress(`Content generated for: ${microTopic.title}`);
        
        // Generate videos for this topic immediately after content
        console.log(`   🎥 Fetching videos for: "${microTopic.title}"`);
        updateProgress(`Finding videos for: ${microTopic.title}`);
        
        const videos = await youtubeService.searchEducationalVideos(
          course.topic,
          microTopic.title
        );
        
        microTopic.videos = videos.slice(0, 3);
        processedItems++;
        
        await course.save();
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`   ❌ Error generating content for "${microTopic.title}":`, error.message);
        sendError(courseId, `Failed to generate content for: ${microTopic.title}`);
        // Continue with next
      }
    }
    
    sendComplete(courseId, { 
      message: 'Course content generation continued and completed',
      courseId: course._id,
      title: course.title
    });
    console.log(`\n✅ Content generation continued for course: ${courseId}\n`);
    
    return { 
      message: 'Course content generation continued',
      courseId,
      processedItems,
      totalItems 
    };
    
  } catch (error) {
    console.error('❌ Continue content generation error:', error.message);
    sendError(courseId, error.message);
    throw error;
  }
};

/**
 * Generate content for a specific micro-topic
 * @param {string} courseId - Course ID
 * @param {string} moduleId - Module ID
 * @param {string} microTopicId - Micro-topic ID
 * @returns {Promise<Object>} Updated micro-topic
 */
export const generateMicroTopicContent = async (courseId, moduleId, microTopicId) => {
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    const module = course.modules.id(moduleId);
    if (!module) {
      throw new Error('Module not found');
    }
    
    const microTopic = module.microTopics.id(microTopicId);
    if (!microTopic) {
      throw new Error('Micro-topic not found');
    }
    
    // Generate lesson content
    const lessonContent = await openaiService.generateLessonContent(
      microTopic.title,
      module.title,
      course.title
    );
    
    microTopic.content = lessonContent;
    
    // Fetch videos
    const videos = await youtubeService.searchEducationalVideos(
      course.topic,
      microTopic.title
    );
    
    microTopic.videos = videos.slice(0, 3);
    
    await course.save();
    
    return microTopic;
    
  } catch (error) {
    console.error('Error generating micro-topic content:', error.message);
    throw error;
  }
};

/**
 * Regenerate a course module
 * @param {string} courseId - Course ID
 * @param {string} moduleId - Module ID to regenerate
 * @returns {Promise<Object>} Updated module
 */
export const regenerateModule = async (courseId, moduleId) => {
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    const module = course.modules.id(moduleId);
    if (!module) {
      throw new Error('Module not found');
    }
    
    // Get other module titles for context
    const otherModules = course.modules.filter(m => m._id.toString() !== moduleId);
    
    // Generate new module content
    const newModule = await openaiService.regenerateModule(
      course.topic,
      module.title,
      otherModules
    );
    
    // Update module
    module.title = newModule.title;
    module.microTopics = newModule.microTopics.map((title, index) => ({
      title,
      order: index,
      isCompleted: false,
      content: null,
      videos: [],
    }));
    
    await course.save();
    
    // Start content generation for new micro-topics
    generateCourseContent(courseId).catch(console.error);
    
    return module;
    
  } catch (error) {
    console.error('Error regenerating module:', error.message);
    throw error;
  }
};

/**
 * Get course with generation status
 * @param {string} courseId - Course ID
 * @returns {Promise<Object>} Course with status
 */
export const getCourseWithStatus = async (courseId) => {
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw new Error('Course not found');
  }
  
  // Update last accessed
  await course.updateLastAccessed();
  
  // Calculate generation progress
  let generatedMicroTopics = 0;
  let totalMicroTopics = 0;
  
  course.modules.forEach(module => {
    module.microTopics.forEach(mt => {
      totalMicroTopics++;
      if (mt.content && mt.videos.length > 0) {
        generatedMicroTopics++;
      }
    });
  });
  
  const generationStatus = {
    isComplete: generatedMicroTopics === totalMicroTopics,
    generatedCount: generatedMicroTopics,
    totalCount: totalMicroTopics,
    percentage: totalMicroTopics > 0 
      ? Math.round((generatedMicroTopics / totalMicroTopics) * 100) 
      : 0,
  };
  
  return {
    course: course.toObject(),
    generationStatus,
  };
};

/**
 * Mark micro-topic as complete
 * @param {string} courseId - Course ID
 * @param {string} moduleId - Module ID
 * @param {string} microTopicId - Micro-topic ID
 * @returns {Promise<Object>} Updated course
 */
export const completeMicroTopic = async (courseId, moduleId, microTopicId) => {
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw new Error('Course not found');
  }
  
  await course.completeMicroTopic(moduleId, microTopicId);
  
  return course;
};

/**
 * Undo micro-topic completion (mark as incomplete)
 * @param {string} courseId - Course ID
 * @param {string} moduleId - Module ID
 * @param {string} microTopicId - Micro-topic ID
 * @returns {Promise<Object>} Updated course
 */
export const uncompleteMicroTopic = async (courseId, moduleId, microTopicId) => {
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw new Error('Course not found');
  }
  
  await course.uncompleteMicroTopic(moduleId, microTopicId);
  
  return course;
};

/**
 * Delete a course
 * @param {string} courseId - Course ID
 * @returns {Promise<boolean>} True if deleted
 */
export const deleteCourse = async (courseId) => {
  const result = await Course.findByIdAndDelete(courseId);
  return !!result;
};

/**
 * Archive a course
 * @param {string} courseId - Course ID
 * @returns {Promise<Object>} Updated course
 */
export const archiveCourse = async (courseId) => {
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw new Error('Course not found');
  }
  
  course.isArchived = true;
  await course.save();
  
  return course;
};

/**
 * Export course to PDF-friendly format
 * @param {string} courseId - Course ID
 * @returns {Promise<Object>} Course in exportable format
 */
export const exportCourse = async (courseId) => {
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw new Error('Course not found');
  }
  
  return {
    title: course.title,
    description: course.description,
    topic: course.topic,
    generatedAt: course.metadata.generatedAt,
    modules: course.modules.map(module => ({
      title: module.title,
      microTopics: module.microTopics.map(mt => ({
        title: mt.title,
        content: mt.content,
        videos: mt.videos,
      })),
    })),
  };
};

export default {
  generateCourse,
  generateCourseContent,
  generateMicroTopicContent,
  regenerateModule,
  getCourseWithStatus,
  completeMicroTopic,
  uncompleteMicroTopic,
  deleteCourse,
  archiveCourse,
  exportCourse,
};
