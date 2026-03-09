/**
 * Course Service
 * 
 * Orchestrates the course generation process.
 * Combines AI generation with video fetching to create complete courses.
 */

import Course from '../models/Course.js';
import User from '../models/User.js';
import * as openaiService from './openaiService.js';
import * as youtubeService from './youtubeService.js';
import { sendProgress, sendError, sendComplete, sendEvent } from '../utils/sse.js';

/**
 * Send a user-facing warning via SSE (non-fatal, generation continues)
 * @param {string} courseId - Course ID
 * @param {string} message - Warning message for the user
 */
const sendWarning = (courseId, message) => {
  sendEvent(courseId, 'warning', { message, timestamp: new Date().toISOString() });
};

/**
 * Fetch user's API settings if they want to use custom provider
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User API settings or null
 */
const getUserApiSettings = async (userId) => {
  try {
    const user = await User.findById(userId).select('+apiSettings.apiKey');
    console.log('🔍 getUserApiSettings - User found:', !!user);
    console.log('🔍 getUserApiSettings - apiSettings exists:', !!(user?.apiSettings));
    console.log('🔍 getUserApiSettings - apiSettings object:', JSON.stringify(user?.apiSettings));
    console.log('🔍 getUserApiSettings - useCustomProvider:', user?.apiSettings?.useCustomProvider);
    console.log('🔍 getUserApiSettings - apiKey exists:', !!(user?.apiSettings?.apiKey));

    if (user && user.apiSettings && user.apiSettings.useCustomProvider && user.apiSettings.apiKey) {
      console.log('🔍 getUserApiSettings - Returning custom settings');
      return {
        apiKey: user.apiSettings.apiKey,
        model: user.apiSettings.model,
        baseUrl: user.apiSettings.baseUrl,
        useCustomProvider: user.apiSettings.useCustomProvider,
      };
    }
    console.log('🔍 getUserApiSettings - Returning null (no custom settings)');
    return null;
  } catch (error) {
    console.error('Error fetching user API settings:', error.message);
    return null;
  }
};

/**
 * Generate a complete course from a topic
 * @param {string} topic - The course topic
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Generated course document
 */
export const generateCourse = async (topic, userId) => {
  try {
    console.log(`\n🚀 Starting course generation for: "${topic}" (user ${userId})\n`);

    // Fetch user API settings
    const userApiSettings = await getUserApiSettings(userId);
    console.log(`🔑 User API settings:`, userApiSettings);
    if (userApiSettings) {
      console.log(`🔑 Using custom API provider: ${userApiSettings.baseUrl} with model ${userApiSettings.model}`);
    }

    // Step 1: Generate course outline using AI
    const outline = await openaiService.generateCourseOutline(topic, userApiSettings);

    // Step 2: Prepare course structure
    // Extract clean topic from AI-generated title for better video search
    const cleanTopic = outline.title.replace(/^(learn|master|introduction to|basic|fundamentals of)\s+/i, '').trim();
    
    const courseData = {
      createdBy: userId,
      title: outline.title,
      description: outline.description,
      topic: topic, // Keep original for reference
      searchTopic: cleanTopic, // Cleaned topic for video searches
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
    generateCourseContent(course._id).catch(async error => {
      console.error('Background content generation failed:', error.message);
      // Send SSE error to frontend so it can stop polling and show error
      sendError(course._id, `Content generation failed: ${error.message}`);
      if (error.code === 'OPENAI_QUOTA_EXCEEDED') {
        sendWarning(course._id, error.message);
        // Mark generation as failed so frontend knows to stop polling
        await Course.updateOne(
          { _id: course._id },
          { $set: { 'metadata.generationFailed': true, 'metadata.generationFailedReason': error.message } }
        );
      }
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

    // Get course and user settings
    const course = await Course.findById(courseId);
    if (!course) {
      console.error(`❌ Course not found: ${courseId} - stopping content generation`);
      sendError(courseId, 'Course not found - generation stopped');
      return;
    }

    const userId = course.createdBy;
    const userApiSettings = await getUserApiSettings(userId);

    // Send initial progress
    sendProgress(courseId, 0, 'Starting content generation...');

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

    // Pre-compute course-level context data
    const allModuleTitles = course.modules.map(m => m.title);
    const contentSummaries = []; // Rolling summaries of all generated lessons so far

    // Process each module
    for (const [moduleIndex, module] of course.modules.entries()) {
      console.log(`📖 Processing module: "${module.title}"`);
      sendProgress(courseId, Math.round((processedItems / totalItems) * 100), `Processing module: ${module.title}`);

      const siblingTopics = module.microTopics.map(mt => mt.title);
      const moduleSummaries = []; // Summaries of lessons generated within this module

      // Process each micro-topic
      for (const [microTopicIndex, microTopic] of module.microTopics.entries()) {
        try {
          // Generate lesson content
          console.log(`   📝 Generating content for: "${microTopic.title}"`);
          updateProgress(`Generating lesson: ${microTopic.title}`);

          // Build rich context for this microtopic
          const lessonContext = {
            difficulty: course.difficulty,
            courseDescription: course.description,
            moduleIndex,
            totalModules: course.modules.length,
            microTopicIndex,
            totalMicroTopics: module.microTopics.length,
            siblingTopics,
            allModuleTitles,
            previousTopics: siblingTopics.slice(0, microTopicIndex),
            nextTopics: siblingTopics.slice(microTopicIndex + 1),
            previousModuleTitle: moduleIndex > 0 ? allModuleTitles[moduleIndex - 1] : null,
            nextModuleTitle: moduleIndex < course.modules.length - 1 ? allModuleTitles[moduleIndex + 1] : null,
            previousContentSummaries: contentSummaries.slice(-5), // Last 5 across all modules
            currentModuleSummaries: [...moduleSummaries],
          };

          const lessonContent = await openaiService.generateLessonContent(
            microTopic.title,
            module.title,
            course.title,
            userApiSettings,
            lessonContext
          );

          microTopic.content = lessonContent;
          processedItems++;
          updateProgress(`Content generated for: ${microTopic.title}`);

          // Accumulate a brief summary for subsequent lessons to reference
          const summary = `${microTopic.title}: ${lessonContent.keyTakeaways?.slice(0, 2).join('; ') || 'Generated'}`;
          contentSummaries.push(summary);
          moduleSummaries.push(summary);

          // Fetch relevant videos
          console.log(`   🎥 Fetching videos for: "${microTopic.title}"`);
          updateProgress(`Finding videos for: ${microTopic.title}`);

          try {
            const videos = await youtubeService.searchEducationalVideos(
              course.searchTopic || course.topic,
              microTopic.title
            );
            microTopic.videos = videos.slice(0, 3); // Max 3 videos per topic
          } catch (videoError) {
            if (videoError.code === 'YOUTUBE_QUOTA_EXCEEDED') {
              console.warn('⚠️ YouTube quota exceeded — skipping videos for remaining topics');
              sendWarning(courseId, videoError.message);
              microTopic.videos = [];
            } else if (videoError.code === 'YOUTUBE_ACCESS_DENIED') {
              console.warn('⚠️ YouTube access denied — skipping videos');
              sendWarning(courseId, videoError.message);
              microTopic.videos = [];
            } else {
              console.warn(`   ⚠️ Could not fetch videos for "${microTopic.title}": ${videoError.message}`);
              microTopic.videos = [];
            }
          }
          processedItems++;

          // Save after each micro-topic (for progress tracking)
          await course.save();

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          // Handle OpenAI quota/token errors — notify user but continue with remaining topics
          if (error.code === 'OPENAI_QUOTA_EXCEEDED') {
            console.error('❌ OpenAI quota exceeded — stopping content generation');
            sendWarning(courseId, error.message);
            sendError(courseId, 'Content generation stopped: OpenAI quota exceeded. Please check your billing at platform.openai.com.');
            // Mark generation as failed so frontend knows to stop polling
            await Course.updateOne(
              { _id: courseId },
              { $set: { 'metadata.generationFailed': true, 'metadata.generationFailedReason': error.message } }
            );
            return; // Stop generation entirely — quota is exhausted
          }
          if (error.code === 'OPENAI_TOKEN_LIMIT') {
            console.warn(`⚠️ Token limit hit for "${microTopic.title}" — skipping and continuing`);
            sendWarning(courseId, error.message);
            // Continue with next micro-topic
          } else {
            console.error(`   ❌ Error processing "${microTopic.title}":`, error.message);
            sendError(courseId, `Failed to generate content for: ${microTopic.title}`);
            // Continue with next micro-topic
          }
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
      console.error(`❌ Course not found: ${courseId} - stopping content generation`);
      sendError(courseId, 'Course not found - generation stopped');
      return;
    }

    // Get user API settings
    const userId = course.createdBy;
    const userApiSettings = await getUserApiSettings(userId);

    // Pre-compute course-level context data
    const allModuleTitles = course.modules.map(m => m.title);

    // Pre-populate summaries from already-generated content
    const contentSummaries = [];
    course.modules.forEach(module => {
      module.microTopics.forEach(mt => {
        if (mt.content && mt.content.explanation) {
          const summary = `${mt.title}: ${mt.content.keyTakeaways?.slice(0, 2).join('; ') || 'Generated'}`;
          contentSummaries.push(summary);
        }
      });
    });

    // Find micro-topics that need content
    const topicsNeedingContent = [];
    const topicsNeedingVideos = [];

    course.modules.forEach((module, moduleIndex) => {
      const siblingTopics = module.microTopics.map(mt => mt.title);
      module.microTopics.forEach((microTopic, microTopicIndex) => {
        // Check if content exists and has explanation
        const hasContent = microTopic.content && microTopic.content.explanation;
        // Check if videos exist and have at least one video
        const hasVideos = microTopic.videos && Array.isArray(microTopic.videos) && microTopic.videos.length > 0;

        if (!hasContent) {
          topicsNeedingContent.push({ microTopic, module, moduleIndex, microTopicIndex, siblingTopics });
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
          course.searchTopic || course.topic,
          microTopic.title
        );

        microTopic.videos = videos.slice(0, 3);
        processedItems++;

        await course.save();

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        if (error.code === 'YOUTUBE_QUOTA_EXCEEDED') {
          console.warn('⚠️ YouTube quota exceeded — skipping videos for remaining topics');
          sendWarning(courseId, error.message);
        } else if (error.code === 'YOUTUBE_ACCESS_DENIED') {
          console.warn('⚠️ YouTube access denied — skipping videos');
          sendWarning(courseId, error.message);
        } else {
          console.error(`   ❌ Error fetching videos for "${microTopic.title}":`, error.message);
          sendError(courseId, `Failed to fetch videos for: ${microTopic.title}`);
        }
        // Continue with next
      }
    }

    // SECOND: Process topics that need content (generate both content and videos)
    for (const { microTopic, module, moduleIndex, microTopicIndex, siblingTopics } of topicsNeedingContent) {
      try {
        console.log(`   📝 Generating content for: "${microTopic.title}"`);
        updateProgress(`Generating lesson: ${microTopic.title}`);

        // Build rich context for this microtopic
        const lessonContext = {
          difficulty: course.difficulty,
          courseDescription: course.description,
          moduleIndex,
          totalModules: course.modules.length,
          microTopicIndex,
          totalMicroTopics: module.microTopics.length,
          siblingTopics,
          allModuleTitles,
          previousTopics: siblingTopics.slice(0, microTopicIndex),
          nextTopics: siblingTopics.slice(microTopicIndex + 1),
          previousModuleTitle: moduleIndex > 0 ? allModuleTitles[moduleIndex - 1] : null,
          nextModuleTitle: moduleIndex < course.modules.length - 1 ? allModuleTitles[moduleIndex + 1] : null,
          previousContentSummaries: contentSummaries.slice(-5),
          currentModuleSummaries: contentSummaries.filter(s =>
            siblingTopics.some(t => s.startsWith(t + ':'))
          ),
        };

        const lessonContent = await openaiService.generateLessonContent(
          microTopic.title,
          module.title,
          course.title,
          userApiSettings,
          lessonContext
        );

        microTopic.content = lessonContent;
        processedItems++;
        updateProgress(`Content generated for: ${microTopic.title}`);

        // Accumulate summary for subsequent lessons
        const summary = `${microTopic.title}: ${lessonContent.keyTakeaways?.slice(0, 2).join('; ') || 'Generated'}`;
        contentSummaries.push(summary);

        // Generate videos for this topic immediately after content
        console.log(`   🎥 Fetching videos for: "${microTopic.title}"`);
        updateProgress(`Finding videos for: ${microTopic.title}`);

        try {
          const videos = await youtubeService.searchEducationalVideos(
            course.topic,
            microTopic.title
          );
          microTopic.videos = videos.slice(0, 3);
        } catch (videoError) {
          if (videoError.code === 'YOUTUBE_QUOTA_EXCEEDED') {
            console.warn('⚠️ YouTube quota exceeded — skipping videos for remaining topics');
            sendWarning(courseId, videoError.message);
            microTopic.videos = [];
          } else if (videoError.code === 'YOUTUBE_ACCESS_DENIED') {
            console.warn('⚠️ YouTube access denied — skipping videos');
            sendWarning(courseId, videoError.message);
            microTopic.videos = [];
          } else {
            console.warn(`   ⚠️ Could not fetch videos for "${microTopic.title}": ${videoError.message}`);
            microTopic.videos = [];
          }
        }
        processedItems++;

        await course.save();

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        if (error.code === 'OPENAI_QUOTA_EXCEEDED') {
          console.error('❌ OpenAI quota exceeded — stopping content generation');
          sendWarning(courseId, error.message);
          sendError(courseId, 'Content generation stopped: OpenAI quota exceeded. Please check your billing at platform.openai.com.');
          return { message: 'Stopped: OpenAI quota exceeded', courseId, processedItems, totalItems }; // Stop generation entirely
        }
        if (error.code === 'OPENAI_TOKEN_LIMIT') {
          console.warn(`⚠️ Token limit hit for "${microTopic.title}" — skipping and continuing`);
          sendWarning(courseId, error.message);
          // Continue with next micro-topic
        } else {
          console.error(`   ❌ Error generating content for "${microTopic.title}":`, error.message);
          sendError(courseId, `Failed to generate content for: ${microTopic.title}`);
          // Continue with next
        }
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
      course.title,
      userApiSettings
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

    // Get user API settings
    const userId = course.createdBy;
    const userApiSettings = await getUserApiSettings(userId);

    // Get other module titles for context
    const otherModules = course.modules.filter(m => m._id.toString() !== moduleId);

    // Generate new module content
    const newModule = await openaiService.regenerateModule(
      course.topic,
      module.title,
      otherModules,
      userApiSettings
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
  console.log('🔍 getCourseWithStatus - Looking for course:', courseId);
  const course = await Course.findById(courseId);
  console.log('🔍 getCourseWithStatus - Course found:', !!course);
  console.log('🔍 getCourseWithStatus - Course title:', course?.title);

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
    failed: course.metadata?.generationFailed || false,
    failedReason: course.metadata?.generationFailedReason || null,
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
