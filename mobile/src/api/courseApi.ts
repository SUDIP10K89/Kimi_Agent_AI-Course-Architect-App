/**
 * Course API Service
 *
 * Handles course-related requests against the backend API.
 */

import type {
  ApiResponse,
  Course,
  CourseWithStatus,
  GenerationStatus,
  Module,
  MicroTopic,
  PaginatedCourses,
  StatsResponse,
} from '@/types';
import { apiDelete, apiGet, apiPost, apiPatch } from './client';

export const generateCourse = async (
  topic: string
): Promise<ApiResponse<{ courseId: string; title: string; description: string; modulesCount: number; microTopicsCount: number }>> => {
  const response = await apiPost<ApiResponse<{ courseId: string; title: string; description: string; modulesCount: number; microTopicsCount: number }>>(
    '/courses/generate',
    { topic }
  );
  return response.data;
};

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

  if (search) {
    params.append('search', search);
  }

  if (status) {
    params.append('status', status);
  }

  const response = await apiGet<ApiResponse<PaginatedCourses>>(`/courses?${params.toString()}`);
  return response.data;
};

export const getCourseById = async (courseId: string): Promise<ApiResponse<CourseWithStatus>> => {
  const response = await apiGet<ApiResponse<CourseWithStatus>>(`/courses/${courseId}`);
  return response.data;
};

export const getRecentCourses = async (limit = 5): Promise<ApiResponse<{ courses: Course[] }>> => {
  const response = await apiGet<ApiResponse<{ courses: Course[] }>>(`/courses/recent?limit=${limit}`);
  return response.data;
};

export const getCourseStats = async (): Promise<ApiResponse<StatsResponse>> => {
  const response = await apiGet<ApiResponse<StatsResponse>>('/courses/stats/overview');
  return response.data;
};

export const getCourseStatus = async (
  courseId: string
): Promise<ApiResponse<{ courseId: string; generationStatus: GenerationStatus; progress: Course['progress'] }>> => {
  const response = await apiGet<ApiResponse<{ courseId: string; generationStatus: GenerationStatus; progress: Course['progress'] }>>(
    `/courses/${courseId}/status`
  );
  return response.data;
};

export const continueCourseGeneration = async (
  courseId: string
): Promise<ApiResponse<{ courseId: string; processedItems?: number; totalItems?: number }>> => {
  const response = await apiPost<ApiResponse<{ courseId: string; processedItems?: number; totalItems?: number }>>(
    `/courses/${courseId}/continue`
  );
  return response.data;
};

export const retryCourseGeneration = async (
  courseId: string
): Promise<ApiResponse<{ courseId: string; generationStatus: GenerationStatus }>> => {
  const response = await apiPost<ApiResponse<{ courseId: string; generationStatus: GenerationStatus }>>(
    `/courses/${courseId}/retry`
  );
  return response.data;
};

export const resumeCourseGeneration = async (
  courseId: string
): Promise<ApiResponse<{ courseId: string; generationStatus: GenerationStatus }>> => {
  const response = await apiPost<ApiResponse<{ courseId: string; generationStatus: GenerationStatus }>>(
    `/courses/${courseId}/resume`
  );
  return response.data;
};

export const generateMicroTopicContent = async (
  courseId: string,
  moduleId: string,
  topicId: string
): Promise<ApiResponse<{ microTopic: MicroTopic }>> => {
  const response = await apiPost<ApiResponse<{ microTopic: MicroTopic }>>(
    `/courses/${courseId}/modules/${moduleId}/topics/${topicId}/generate`
  );
  return response.data;
};

export const completeMicroTopic = async (
  courseId: string,
  moduleId: string,
  topicId: string
): Promise<ApiResponse<{ progress: Course['progress'] }>> => {
  const response = await apiPost<ApiResponse<{ progress: Course['progress'] }>>(
    `/courses/${courseId}/modules/${moduleId}/topics/${topicId}/complete`
  );
  return response.data;
};

export const uncompleteMicroTopic = async (
  courseId: string,
  moduleId: string,
  topicId: string
): Promise<ApiResponse<{ progress: Course['progress'] }>> => {
  const response = await apiDelete<ApiResponse<{ progress: Course['progress'] }>>(
    `/courses/${courseId}/modules/${moduleId}/topics/${topicId}/complete`
  );
  return response.data;
};

export const regenerateModule = async (
  courseId: string,
  moduleId: string
): Promise<ApiResponse<{ module: Module }>> => {
  const response = await apiPost<ApiResponse<{ module: Module }>>(
    `/courses/${courseId}/modules/${moduleId}/regenerate`
  );
  return response.data;
};

export const archiveCourse = async (courseId: string): Promise<ApiResponse<{ course: Course }>> => {
  const response = await apiPost<ApiResponse<{ course: Course }>>(`/courses/${courseId}/archive`);
  return response.data;
};

export const deleteCourse = async (courseId: string): Promise<ApiResponse<void>> => {
  const response = await apiDelete<ApiResponse<void>>(`/courses/${courseId}`);
  return response.data;
};

export const exportCourse = async (courseId: string): Promise<ApiResponse<unknown>> => {
  const response = await apiGet<ApiResponse<unknown>>(`/courses/${courseId}/export`);
  return response.data;
};

export interface PublicCourse {
  courses: Course[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const getPublicCourses = async (
  search = '',
  page = 1,
  limit = 20
): Promise<ApiResponse<PublicCourse>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) {
    params.append('search', search);
  }

  const response = await apiGet<ApiResponse<PublicCourse>>(`/courses/public?${params.toString()}`);
  return response.data;
};

export const updateCourseVisibility = async (
  courseId: string,
  isPublic: boolean
): Promise<ApiResponse<{ courseId: string; isPublic: boolean }>> => {
  const response = await apiPatch<ApiResponse<{ courseId: string; isPublic: boolean }>>(
    `/courses/${courseId}/visibility`,
    { isPublic }
  );
  return response.data;
};

export const forkCourse = async (
  courseId: string
): Promise<ApiResponse<{ courseId: string }>> => {
  const response = await apiPost<ApiResponse<{ courseId: string }>>(
    `/courses/${courseId}/fork`
  );
  return response.data;
};
