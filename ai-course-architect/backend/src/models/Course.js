/**
 * Course Model
 * 
 * Defines the MongoDB schema for storing generated courses.
 * Includes modules, micro-topics, lesson content, and embedded videos.
 */

import mongoose from 'mongoose';

/**
 * Video Schema - Embedded document for YouTube videos
 */
const videoSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  thumbnailUrl: {
    type: String,
    default: '',
  },
  channelTitle: {
    type: String,
    default: '',
  },
  duration: {
    type: String,
    default: '',
  },
}, { _id: false });

/**
 * Lesson Content Schema - Stores AI-generated lesson details
 */
const lessonContentSchema = new mongoose.Schema({
  explanation: {
    type: String,
    required: true,
    trim: true,
  },
  example: {
    type: String,
    required: true,
    trim: true,
  },
  analogy: {
    type: String,
    required: true,
    trim: true,
  },
  keyTakeaways: [{
    type: String,
    trim: true,
  }],
  practiceQuestions: [{
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
  }],
}, { _id: false });

/**
 * Micro-Topic Schema - Individual lessons within a module
 */
const microTopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  order: {
    type: Number,
    required: true,
    min: 0,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  content: {
    type: lessonContentSchema,
    default: null,
  },
  videos: [videoSchema],
}, { _id: true, timestamps: true });

/**
 * Module Schema - Groups related micro-topics
 */
const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  order: {
    type: Number,
    required: true,
    min: 0,
  },
  microTopics: [microTopicSchema],
}, { _id: true, timestamps: true });

/**
 * Main Course Schema
 */
const courseSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  topic: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  estimatedDuration: {
    type: Number, // in hours
    default: 0,
  },
  modules: [moduleSchema],
  progress: {
    completedMicroTopics: {
      type: Number,
      default: 0,
    },
    totalMicroTopics: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  metadata: {
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
    version: {
      type: Number,
      default: 1,
    },
    generationFailed: {
      type: Boolean,
      default: false,
    },
    generationFailedReason: {
      type: String,
      default: null,
    },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ensure any find query populates user name/email maybe
courseSchema.pre(/^find/, function (next) {
  this.populate({ path: 'createdBy', select: 'name email' });
  next();
});

// Indexes for efficient queries
courseSchema.index({ createdAt: -1 });
courseSchema.index({ 'metadata.lastAccessed': -1 });
courseSchema.index({ isArchived: 1 });

/**
 * Virtual property to get course status
 */
courseSchema.virtual('status').get(function () {
  if (this.progress.percentage === 0) return 'not-started';
  if (this.progress.percentage === 100) return 'completed';
  return 'in-progress';
});

/**
 * Pre-save middleware to calculate progress
 */
courseSchema.pre('save', function (next) {
  if (this.modules && this.modules.length > 0) {
    let totalMicroTopics = 0;
    let completedMicroTopics = 0;

    this.modules.forEach((module) => {
      if (module.microTopics) {
        totalMicroTopics += module.microTopics.length;
        completedMicroTopics += module.microTopics.filter(mt => mt.isCompleted).length;
      }
    });

    this.progress.totalMicroTopics = totalMicroTopics;
    this.progress.completedMicroTopics = completedMicroTopics;
    this.progress.percentage = totalMicroTopics > 0
      ? Math.round((completedMicroTopics / totalMicroTopics) * 100)
      : 0;
  }

  next();
});

/**
 * Method to update last accessed timestamp
 */
courseSchema.methods.updateLastAccessed = async function () {
  this.metadata.lastAccessed = new Date();
  return this.save({ validateBeforeSave: false });
};

/**
 * Method to mark micro-topic as complete
 */
courseSchema.methods.completeMicroTopic = async function (moduleId, microTopicId) {
  const module = this.modules.id(moduleId);
  if (!module) throw new Error('Module not found');

  const microTopic = module.microTopics.id(microTopicId);
  if (!microTopic) throw new Error('Micro-topic not found');

  microTopic.isCompleted = true;
  return this.save();
};

/**
 * Method to undo micro-topic completion (mark as incomplete)
 */
courseSchema.methods.uncompleteMicroTopic = async function (moduleId, microTopicId) {
  const module = this.modules.id(moduleId);
  if (!module) throw new Error('Module not found');

  const microTopic = module.microTopics.id(microTopicId);
  if (!microTopic) throw new Error('Micro-topic not found');

  microTopic.isCompleted = false;
  return this.save();
};

/**
 * Static method to get recent courses
 */
courseSchema.statics.getRecent = function (limit = 10) {
  return this.find({ isArchived: false })
    .sort({ 'metadata.lastAccessed': -1 })
    .limit(limit)
    .select('title description topic progress difficulty metadata.lastAccessed');
};

/**
 * Static method to search courses
 */
courseSchema.statics.search = function (query) {
  return this.find({
    isArchived: false,
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { topic: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
    ],
  }).sort({ createdAt: -1 });
};

const Course = mongoose.model('Course', courseSchema);

export default Course;
