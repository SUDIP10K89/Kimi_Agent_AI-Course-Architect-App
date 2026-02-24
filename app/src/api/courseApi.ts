/**
 * Course API Service
 * 
 * Handles all HTTP requests to the backend API.
 * Provides typed methods for course operations.
 */

import axios, { type AxiosInstance } from 'axios';
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

// ============================================
// Axios Configuration
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      console.error('API Error:', error.response.data);
      return Promise.reject(error.response.data);
    }
    return Promise.reject({ success: false, error: 'Network error' });
  }
);

// ============================================
// Course API Methods
// ============================================

/**
 * Generate a new course from a topic
 */
export const generateCourse = async (topic: string): Promise<ApiResponse<{ courseId: string; title: string; description: string; modulesCount: number; microTopicsCount: number }>> => {
  const response = await apiClient.post('/courses/generate', { topic });
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

  const response = await apiClient.get(`/courses?${params.toString()}`);
  return response.data;
};

/**
 * Get recent courses
 */
export const getRecentCourses = async (limit = 5): Promise<ApiResponse<{ courses: Course[] }>> => {
  const response = await apiClient.get(`/courses/recent?limit=${limit}`);
  return response.data;
};

/**
 * Get course by ID
 */
export const getCourseById = async (courseId: string): Promise<ApiResponse<CourseWithStatus>> => {
  const response = await apiClient.get(`/courses/${courseId}`);
  return response.data;
};

/**
 * Get course generation status
 */
export const getCourseStatus = async (courseId: string): Promise<ApiResponse<{ courseId: string; generationStatus: GenerationStatus; progress: { completedMicroTopics: number; totalMicroTopics: number; percentage: number } }>> => {
  const response = await apiClient.get(`/courses/${courseId}/status`);
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
  const response = await apiClient.post(`/courses/${courseId}/modules/${moduleId}/topics/${topicId}/generate`);
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
  const response = await apiClient.post(`/courses/${courseId}/modules/${moduleId}/topics/${topicId}/complete`);
  return response.data;
};

/**
 * Regenerate a module
 */
export const regenerateModule = async (
  courseId: string,
  moduleId: string
): Promise<ApiResponse<{ module: Module }>> => {
  const response = await apiClient.post(`/courses/${courseId}/modules/${moduleId}/regenerate`);
  return response.data;
};

/**
 * Archive a course
 */
export const archiveCourse = async (courseId: string): Promise<ApiResponse<{ course: Course }>> => {
  const response = await apiClient.post(`/courses/${courseId}/archive`);
  return response.data;
};

/**
 * Delete a course
 */
export const deleteCourse = async (courseId: string): Promise<ApiResponse<void>> => {
  const response = await apiClient.delete(`/courses/${courseId}`);
  return response.data;
};

/**
 * Export course
 */
export const exportCourse = async (courseId: string): Promise<ApiResponse<unknown>> => {
  const response = await apiClient.get(`/courses/${courseId}/export`);
  return response.data;
};

/**
 * Get course statistics
 */
export const getCourseStats = async (): Promise<ApiResponse<StatsResponse>> => {
  const response = await apiClient.get('/courses/stats/overview');
  return response.data;
};

// ============================================
// Health Check
// ============================================

/**
 * Check API health
 */
export const checkHealth = async (): Promise<ApiResponse<{ message: string; timestamp: string; uptime: number }>> => {
  const response = await apiClient.get('/health');
  return response.data;
};

/**
 * Check detailed health status
 */
export const checkDetailedHealth = async (): Promise<ApiResponse<unknown>> => {
  const response = await apiClient.get('/health/detailed');
  return response.data;
};

export default {
  generateCourse,
  getAllCourses,
  getRecentCourses,
  getCourseById,
  getCourseStatus,
  generateMicroTopicContent,
  completeMicroTopic,
  regenerateModule,
  archiveCourse,
  deleteCourse,
  exportCourse,
  getCourseStats,
  checkHealth,
  checkDetailedHealth,
};
