/**
 * Type Definitions
 * 
 * TypeScript interfaces for the AI Course Architect application.
 */

// ============================================
// SSE Types
// ============================================

export interface SSEProgressEvent {
  progress: number;
  message: string;
  timestamp: string;
}

export interface SSECompleteEvent {
  message: string;
  courseId: string;
  title: string;
  timestamp: string;
}

export interface SSEErrorEvent {
  error: string;
  timestamp: string;
}

export interface SSEWarningEvent {
  message: string;
  timestamp: string;
}

export type SSEEventType = 'progress' | 'complete' | 'error' | 'warning' | 'connected';

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
  currentMessage?: string;
  failed?: boolean;
  failedReason?: string | null;
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
  needsVerification?: boolean;
  email?: string;
}

// ============================================
// Authentication Types
// ============================================

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
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
