/**
 * Type Definitions
 * 
 * TypeScript interfaces for the AI Course Architect application.
 */

// ============================================
// Video Types
// ============================================

export interface Video {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  duration: string;
  publishedAt?: string;
}

// ============================================
// Lesson Content Types
// ============================================

export interface PracticeQuestion {
  question: string;
  answer: string;
}

export interface LessonContent {
  explanation: string;
  example: string;
  analogy: string;
  keyTakeaways: string[];
  practiceQuestions: PracticeQuestion[];
}

// ============================================
// Micro-Topic Types
// ============================================

export interface MicroTopic {
  _id: string;
  title: string;
  order: number;
  isCompleted: boolean;
  content: LessonContent | null;
  videos: Video[];
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// Module Types
// ============================================

export interface Module {
  _id: string;
  title: string;
  description: string;
  order: number;
  microTopics: MicroTopic[];
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// Course Types
// ============================================

export interface Progress {
  completedMicroTopics: number;
  totalMicroTopics: number;
  percentage: number;
}

export interface CourseMetadata {
  generatedAt: string;
  lastAccessed: string;
  version: number;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  modules: Module[];
  progress: Progress;
  isArchived: boolean;
  metadata: CourseMetadata;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Generation Status Types
// ============================================

export interface GenerationStatus {
  isComplete: boolean;
  generatedCount: number;
  totalCount: number;
  percentage: number;
}

export interface CourseWithStatus {
  course: Course;
  generationStatus: GenerationStatus;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
  code?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedCourses {
  courses: Course[];
  pagination: PaginationInfo;
}

// ============================================
// UI State Types
// ============================================

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message: string;
  code?: string;
}

export type Theme = 'light' | 'dark';

// ============================================
// Form Types
// ============================================

export interface GenerateCourseForm {
  topic: string;
}

// ============================================
// Stats Types
// ============================================

export interface CourseStats {
  totalCourses: number;
  totalModules: number;
  totalMicroTopics: number;
  completedMicroTopics: number;
  avgProgress: number;
}

export interface StatsResponse {
  overview: CourseStats;
  recentCourses: Course[];
}
