/**
 * Course Context
 * 
 * Manages course state including fetching courses, generating new courses, and tracking progress.
 */

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Course, CourseWithStatus, StatsResponse, GenerationStatus } from '@/types';
import * as courseApi from '@/api/courseApi';

interface CourseContextType {
  courses: Course[];
  currentCourse: CourseWithStatus | null;
  stats: StatsResponse | null;
  isLoading: boolean;
  error: string | null;
  generationStatus: GenerationStatus | null;
  pagination: { page: number; total: number; pages: number } | null;
  fetchCourses: (page?: number, search?: string) => Promise<void>;
  fetchCourse: (courseId: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  generateCourse: (topic: string) => Promise<string>;
  updateProgress: (courseId: string, moduleId: string, microTopicId: string, isCompleted: boolean) => Promise<void>;
  deleteCourse: (courseId: string) => Promise<void>;
  pollGenerationStatus: (courseId: string) => Promise<void>;
  stopPolling: () => void;
  clearError: () => void;
  setCourses: (courses: Course[]) => void;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

const COURSES_CACHE_KEY = 'cached_courses';

export const CourseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentCourse, setCurrentCourse] = useState<CourseWithStatus | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);
  const [pagination, setPagination] = useState<{ page: number; total: number; pages: number } | null>(null);
  
  let pollingInterval: NodeJS.Timeout | null = null;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }, []);

  const fetchCourses = async (page = 1, search = '') => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await courseApi.getAllCourses(page, 10, search);
      
      if (response.success) {
        setCourses(response.data.courses);
        setPagination({
          page: response.data.pagination.page,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages,
        });
        
        // Cache courses for offline use
        await AsyncStorage.setItem(COURSES_CACHE_KEY, JSON.stringify(response.data.courses));
      } else {
        // Try to load from cache
        const cached = await AsyncStorage.getItem(COURSES_CACHE_KEY);
        if (cached) {
          setCourses(JSON.parse(cached));
        } else {
          throw new Error(response.error || 'Failed to fetch courses');
        }
      }
    } catch (error: any) {
      // Try to load from cache on error
      try {
        const cached = await AsyncStorage.getItem(COURSES_CACHE_KEY);
        if (cached) {
          setCourses(JSON.parse(cached));
          setError('Loaded from cache - you are offline');
        } else {
          setError(error.message || 'Failed to fetch courses');
        }
      } catch {
        setError(error.message || 'Failed to fetch courses');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourse = async (courseId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await courseApi.getCourseById(courseId);
      
      if (response.success) {
        setCurrentCourse(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch course');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch course');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      
      const response = await courseApi.getCourseStats();
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCourse = async (topic: string): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);
      setGenerationStatus({
        isComplete: false,
        generatedCount: 0,
        totalCount: 0,
        percentage: 0,
        currentMessage: 'Starting course generation...',
      });
      
      const response = await courseApi.generateCourse(topic);
      
      if (response.success) {
        return response.data.courseId;
      } else {
        throw new Error(response.error || 'Failed to generate course');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to generate course');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const pollGenerationStatus = async (courseId: string) => {
    stopPolling();
    
    const poll = async () => {
      try {
        const response = await courseApi.getCourseStatus(courseId);
        
        if (response.success) {
          setGenerationStatus(response.data.generationStatus);
          
          if (response.data.generationStatus.isComplete) {
            stopPolling();
            // Refresh the course
            await fetchCourse(courseId);
            // Refresh courses list
            await fetchCourses();
          } else if (response.data.generationStatus.failed) {
            stopPolling();
            setError(response.data.generationStatus.failedReason || 'Course generation failed');
          }
        }
      } catch (error) {
        console.error('Error polling generation status:', error);
      }
    };
    
    // Poll immediately
    await poll();
    
    // Then poll every 3 seconds
    pollingInterval = setInterval(poll, 3000);
  };

  const updateProgress = async (courseId: string, moduleId: string, microTopicId: string, isCompleted: boolean) => {
    try {
      const response = isCompleted
        ? await courseApi.completeMicroTopic(courseId, moduleId, microTopicId)
        : await courseApi.uncompleteMicroTopic(courseId, moduleId, microTopicId);
      
      if (response.success) {
        await fetchCourse(courseId);
        setCourses((prev) =>
          prev.map((course) =>
            course._id === courseId
              ? {
                  ...course,
                  progress: response.data.progress,
                }
              : course
          )
        );
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update progress');
    }
  };

  const deleteCourse = async (courseId: string) => {
    try {
      setIsLoading(true);
      
      const response = await courseApi.deleteCourse(courseId);
      
      if (response.success) {
        setCourses(prev => prev.filter(c => c._id !== courseId));
      } else {
        throw new Error(response.error || 'Failed to delete course');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to delete course');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CourseContext.Provider
      value={{
        courses,
        currentCourse,
        stats,
        isLoading,
        error,
        generationStatus,
        pagination,
        fetchCourses,
        fetchCourse,
        fetchStats,
        generateCourse,
        updateProgress,
        deleteCourse,
        pollGenerationStatus,
        stopPolling,
        clearError,
        setCourses,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = (): CourseContextType => {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
};

export default CourseContext;
