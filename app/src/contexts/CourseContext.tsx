/**
 * Course Context
 * 
 * Manages global course state including current course,
 * loading states, and course list.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Course, CourseWithStatus, GenerationStatus } from '@/types';
import * as courseApi from '@/api/courseApi';

interface CourseContextType {
  // Course list
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  refreshCourses: () => Promise<void>;

  // Current course
  currentCourse: CourseWithStatus | null;
  setCurrentCourse: React.Dispatch<React.SetStateAction<CourseWithStatus | null>>;
  loadCourse: (courseId: string) => Promise<void>;

  // Loading states
  isGenerating: boolean;
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;

  // Generation status
  generationStatus: GenerationStatus | null;
  pollGenerationStatus: (courseId: string) => void;
  stopPolling: () => void;

  // Error state
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  clearError: () => void;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export const useCourse = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
};

interface CourseProviderProps {
  children: React.ReactNode;
}

export const CourseProvider: React.FC<CourseProviderProps> = ({ children }) => {
  // Course list state
  const [courses, setCourses] = useState<Course[]>([]);

  // Current course state
  const [currentCourse, setCurrentCourse] = useState<CourseWithStatus | null>(null);

  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Generation status
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Polling interval ref
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh courses list
  const refreshCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await courseApi.getAllCourses(1, 50);
      if (response.success) {
        setCourses(response.data.courses);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load courses';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load a specific course
  const loadCourse = useCallback(async (courseId: string) => {
    try {
      setIsLoading(true);
      clearError();
      const response = await courseApi.getCourseById(courseId);
      if (response.success) {
        setCurrentCourse(response.data);
        setGenerationStatus(response.data.generationStatus);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load course';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  // Poll generation status
  const pollGenerationStatus = useCallback((courseId: string) => {
    // Don't start if already complete or already polling
    if (generationStatus?.isComplete) {
      return;
    }
    
    // Clear existing interval
    if (pollInterval) {
      clearInterval(pollInterval);
    }

    // Start new polling interval
    const interval = setInterval(async () => {
      try {
        const response = await courseApi.getCourseStatus(courseId);
        
        // Stop polling if course not found (404)
        if (!response.success && response.error?.includes('not found')) {
          console.error('Course not found - stopping polling');
          clearInterval(interval);
          setPollInterval(null);
          setError('Course not found');
          return;
        }
        
        if (response.success) {
          setGenerationStatus(response.data.generationStatus);

          // Stop polling if generation is complete
          if (response.data.generationStatus.isComplete) {
            clearInterval(interval);
            setPollInterval(null);
            // Reload course to get updated data
            loadCourse(courseId);
          } else {
            // Also reload course periodically to get latest microtopic content
            // This helps show which microtopic is currently being generated
            loadCourse(courseId);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
        // Stop polling on error to prevent infinite retries
        clearInterval(interval);
        setPollInterval(null);
      }
    }, 10000); // Poll every 10 seconds

    setPollInterval(interval);

    // Auto-stop after 10 minutes
    setTimeout(() => {
      clearInterval(interval);
      setPollInterval(null);
    }, 10 * 60 * 1000);
  }, [pollInterval, loadCourse, generationStatus]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  }, [pollInterval]);

  return (
    <CourseContext.Provider
      value={{
        courses,
        setCourses,
        refreshCourses,
        currentCourse,
        setCurrentCourse,
        loadCourse,
        isGenerating,
        setIsGenerating,
        isLoading,
        setIsLoading,
        generationStatus,
        pollGenerationStatus,
        stopPolling,
        error,
        setError,
        clearError,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export default CourseProvider;
