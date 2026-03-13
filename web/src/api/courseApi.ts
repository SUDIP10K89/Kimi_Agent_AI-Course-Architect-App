/**
 * Course API Service
 * 
 * Handles all HTTP requests to the backend API.
 * Uses the unified API client from client.ts
 */

import type {
  ApiResponse,
  Course,
  CourseWithStatus,
  PaginatedCourses,
  StatsResponse,
  MicroTopic,
  Module,
  GenerationStatus,
} from '@/types';
import { apiGet, apiPost, apiDelete } from './client';

// ============================================
// Course API Methods
// ============================================

/**
 * Generate a new course from a topic
 */
export const generateCourse = async (topic: string): Promise<ApiResponse<{ courseId: string; title: string; description: string; modulesCount: number; microTopicsCount: number }>> => {
  const response = await apiPost<ApiResponse<{ courseId: string; title: string; description: string; modulesCount: number; microTopicsCount: number }>>('/courses/generate', { topic });
  return response.data;
};

/**
 * Get all courses with pagination
 */
export const getAllCourses = async (
  page = 1,
  limit = 10,
  search = '',
  status = ''
): Promise<ApiResponse<PaginatedCourses>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) params.append('search', search);
  if (status) params.append('status', status);

  const response = await apiGet<ApiResponse<PaginatedCourses>>(`/courses?${params.toString()}`);
  return response.data;
};

/**
 * Get recent courses
 */
export const getRecentCourses = async (limit = 5): Promise<ApiResponse<{ courses: Course[] }>> => {
  const response = await apiGet<ApiResponse<{ courses: Course[] }>>(`/courses/recent?limit=${limit}`);
  return response.data;
};

/**
 * Get course by ID
 */
export const getCourseById = async (courseId: string): Promise<ApiResponse<CourseWithStatus>> => {
  const response = await apiGet<ApiResponse<CourseWithStatus>>(`/courses/${courseId}`);
  return response.data;
};

/**
 * Get course generation status
 */
export const getCourseStatus = async (courseId: string): Promise<ApiResponse<{ courseId: string; generationStatus: GenerationStatus; progress: { completedMicroTopics: number; totalMicroTopics: number; percentage: number } }>> => {
  const response = await apiGet<ApiResponse<{ courseId: string; generationStatus: GenerationStatus; progress: { completedMicroTopics: number; totalMicroTopics: number; percentage: number } }>>(`/courses/${courseId}/status`);
  return response.data;
};

/**
 * Generate content for a specific micro-topic
 */
export const generateMicroTopicContent = async (
  courseId: string,
  moduleId: string,
  topicId: string
): Promise<ApiResponse<{ microTopic: MicroTopic }>> => {
  const response = await apiPost<ApiResponse<{ microTopic: MicroTopic }>>(`/courses/${courseId}/modules/${moduleId}/topics/${topicId}/generate`);
  return response.data;
};

/**
 * Continue/Resume content generation for a course
 */
export const continueCourseGeneration = async (
  courseId: string
): Promise<ApiResponse<{ courseId: string; processedItems?: number; totalItems?: number }>> => {
  const response = await apiPost<ApiResponse<{ courseId: string; processedItems?: number; totalItems?: number }>>(`/courses/${courseId}/continue`);
  return response.data;
};

/**
 * Mark micro-topic as complete
 */
export const completeMicroTopic = async (
  courseId: string,
  moduleId: string,
  topicId: string
): Promise<ApiResponse<{ progress: { completedMicroTopics: number; totalMicroTopics: number; percentage: number } }>> => {
  const response = await apiPost<ApiResponse<{ progress: { completedMicroTopics: number; totalMicroTopics: number; percentage: number } }>>(`/courses/${courseId}/modules/${moduleId}/topics/${topicId}/complete`);
  return response.data;
};

/**
 * Undo micro-topic completion (mark as incomplete)
 */
export const uncompleteMicroTopic = async (
  courseId: string,
  moduleId: string,
  topicId: string
): Promise<ApiResponse<{ progress: { completedMicroTopics: number; totalMicroTopics: number; percentage: number } }>> => {
  const response = await apiDelete<ApiResponse<{ progress: { completedMicroTopics: number; totalMicroTopics: number; percentage: number } }>>(`/courses/${courseId}/modules/${moduleId}/topics/${topicId}/complete`);
  return response.data;
};

/**
 * Regenerate a module
 */
export const regenerateModule = async (
  courseId: string,
  moduleId: string
): Promise<ApiResponse<{ module: Module }>> => {
  const response = await apiPost<ApiResponse<{ module: Module }>>(`/courses/${courseId}/modules/${moduleId}/regenerate`);
  return response.data;
};

/**
 * Archive a course
 */
export const archiveCourse = async (courseId: string): Promise<ApiResponse<{ course: Course }>> => {
  const response = await apiPost<ApiResponse<{ course: Course }>>(`/courses/${courseId}/archive`);
  return response.data;
};

/**
 * Delete a course
 */
export const deleteCourse = async (courseId: string): Promise<ApiResponse<void>> => {
  const response = await apiDelete<ApiResponse<void>>(`/courses/${courseId}`);
  return response.data;
};

/**
 * Export course
 */
export const exportCourse = async (courseId: string): Promise<ApiResponse<unknown>> => {
  const response = await apiGet<ApiResponse<unknown>>(`/courses/${courseId}/export`);
  return response.data;
};

/**
 * Get course statistics
 */
export const getCourseStats = async (): Promise<ApiResponse<StatsResponse>> => {
  const response = await apiGet<ApiResponse<StatsResponse>>('/courses/stats/overview');
  return response.data;
};

// ============================================
// Health Check
// ============================================

/**
 * Check API health
 */
export const checkHealth = async (): Promise<ApiResponse<{ message: string; timestamp: string; uptime: number }>> => {
  const response = await apiGet<ApiResponse<{ message: string; timestamp: string; uptime: number }>>('/health');
  return response.data;
};

/**
 * Check detailed health status
 */
export const checkDetailedHealth = async (): Promise<ApiResponse<unknown>> => {
  const response = await apiGet<ApiResponse<unknown>>('/health/detailed');
  return response.data;
};

export { connectToCourseProgress } from '@/utils/sse';
export type { SSEProgressEvent, SSECompleteEvent, SSEErrorEvent, SSEWarningEvent } from '@/utils/sse';

export default {
  generateCourse,
  getAllCourses,
  getRecentCourses,
  getCourseById,
  getCourseStatus,
  generateMicroTopicContent,
  completeMicroTopic,
  uncompleteMicroTopic,
  regenerateModule,
  archiveCourse,
  deleteCourse,
  exportCourse,
  getCourseStats,
  checkHealth,
  checkDetailedHealth,
};
