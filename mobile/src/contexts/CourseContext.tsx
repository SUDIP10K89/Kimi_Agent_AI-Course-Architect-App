/**
 * Course Context
 * 
 * Manages course state including fetching courses, generating new courses, and tracking progress.
 */

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Course, CourseWithStatus, StatsResponse, GenerationStatus, CourseSyncState } from '@/types';
import * as courseApi from '@/api/courseApi';
import { useAuth } from '@/contexts/AuthContext';

interface CourseContextType {
  courses: Course[];
  currentCourse: CourseWithStatus | null;
  stats: StatsResponse | null;
  isLoading: boolean;
  error: string | null;
  generationStatus: GenerationStatus | null;
  syncState: CourseSyncState;
  pagination: { page: number; total: number; pages: number } | null;
  fetchCourses: (page?: number, search?: string) => Promise<void>;
  fetchCourse: (courseId: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  generateCourse: (topic: string) => Promise<string>;
  updateProgress: (courseId: string, moduleId: string, microTopicId: string, isCompleted: boolean) => Promise<void>;
  archiveCourse: (courseId: string) => Promise<void>;
  deleteCourse: (courseId: string) => Promise<void>;
  continueGeneration: (courseId: string) => Promise<void>;
  pollGenerationStatus: (courseId: string) => Promise<void>;
  retryGeneration: (courseId: string) => Promise<void>;
  resumeGeneration: (courseId: string) => Promise<void>;
  stopPolling: () => void;
  markOnline: () => Promise<void>;
  clearError: () => void;
  setCourses: (courses: Course[]) => void;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

const getCoursesCacheKey = (userId: string) => `cached_courses_${userId}`;
const getCourseDetailCacheKey = (userId: string, courseId: string) => `cached_course_detail_${userId}_${courseId}`;
const getSyncStateKey = (userId: string) => `course_sync_state_${userId}`;
const DEFAULT_SYNC_STATE: CourseSyncState = {
  isOffline: false,
  usingCachedCourses: false,
  usingCachedCourseDetail: false,
  hasPendingSync: false,
  lastSyncedAt: null,
};

const loadCachedCourses = async (userId: string): Promise<Course[]> => {
  try {
    const cached = await AsyncStorage.getItem(getCoursesCacheKey(userId));
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
};

const loadCachedCourseDetail = async (userId: string, courseId: string): Promise<CourseWithStatus | null> => {
  try {
    const cached = await AsyncStorage.getItem(getCourseDetailCacheKey(userId, courseId));
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

export const CourseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentCourse, setCurrentCourse] = useState<CourseWithStatus | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null);
  const [syncState, setSyncState] = useState<CourseSyncState>(DEFAULT_SYNC_STATE);
  const [pagination, setPagination] = useState<{ page: number; total: number; pages: number } | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userId = user?._id ?? null;

  const updateSyncState = useCallback(async (updates: Partial<CourseSyncState>) => {
    if (!userId) {
      setSyncState((prev) => ({ ...prev, ...updates }));
      return;
    }

    setSyncState((prev) => {
      const next = { ...prev, ...updates };
      AsyncStorage.setItem(getSyncStateKey(userId), JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, [userId]);

  const saveCourseDetailToCache = useCallback(async (courseWithStatus: CourseWithStatus) => {
    if (!userId) {
      return;
    }

    const cacheKey = getCourseDetailCacheKey(userId, courseWithStatus.course._id);
    await AsyncStorage.setItem(cacheKey, JSON.stringify(courseWithStatus));

    const cachedCourses = await loadCachedCourses(userId);
    const existingIndex = cachedCourses.findIndex((course) => course._id === courseWithStatus.course._id);
    const nextCourses = [...cachedCourses];

    if (existingIndex >= 0) {
      nextCourses[existingIndex] = courseWithStatus.course;
    } else {
      nextCourses.unshift(courseWithStatus.course);
    }

    await AsyncStorage.setItem(getCoursesCacheKey(userId), JSON.stringify(nextCourses));
  }, [userId]);

  useEffect(() => {
    const hydrateCache = async () => {
      if (!userId) {
        setCourses([]);
        setCurrentCourse(null);
        setGenerationStatus(null);
        setSyncState(DEFAULT_SYNC_STATE);
        return;
      }

      const [cachedCourses, cachedSyncState] = await Promise.all([
        loadCachedCourses(userId),
        AsyncStorage.getItem(getSyncStateKey(userId)),
      ]);

      if (cachedCourses.length > 0) {
        setCourses(cachedCourses);
      }

      if (cachedSyncState) {
        try {
          setSyncState(JSON.parse(cachedSyncState));
        } catch {
          setSyncState(DEFAULT_SYNC_STATE);
        }
      }
    };

    hydrateCache().catch(() => undefined);
  }, [userId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const markOnline = useCallback(async () => {
    await updateSyncState({
      isOffline: false,
      usingCachedCourses: false,
      usingCachedCourseDetail: false,
      hasPendingSync: false,
      lastSyncedAt: new Date().toISOString(),
    });
  }, [updateSyncState]);

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
        if (userId) {
          await AsyncStorage.setItem(getCoursesCacheKey(userId), JSON.stringify(response.data.courses));
        }
        await markOnline();
      } else {
        // Try to load from cache
        const cachedCourses = userId ? await loadCachedCourses(userId) : [];
        if (cachedCourses.length > 0) {
          setCourses(cachedCourses);
          await updateSyncState({
            isOffline: true,
            usingCachedCourses: true,
            hasPendingSync: true,
          });
        } else {
          throw new Error(response.error || 'Failed to fetch courses');
        }
      }
    } catch (error: any) {
      // Try to load from cache on error
      try {
        const cachedCourses = userId ? await loadCachedCourses(userId) : [];
        if (cachedCourses.length > 0) {
          setCourses(cachedCourses);
          await updateSyncState({
            isOffline: true,
            usingCachedCourses: true,
            hasPendingSync: true,
          });
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
        setGenerationStatus(response.data.generationStatus);
        await saveCourseDetailToCache(response.data);
        await markOnline();
      } else {
        throw new Error(response.error || 'Failed to fetch course');
      }
    } catch (error: any) {
      const cachedCourse = userId ? await loadCachedCourseDetail(userId, courseId) : null;
      if (cachedCourse) {
        setCurrentCourse(cachedCourse);
        setGenerationStatus(cachedCourse.generationStatus);
        await updateSyncState({
          isOffline: true,
          usingCachedCourseDetail: true,
          hasPendingSync: true,
        });
        setError('Loaded saved course detail - connect to sync fresh content');
      } else {
        setError(error.message || 'Failed to fetch course');
      }
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
        await markOnline();
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
        await updateSyncState({
          isOffline: false,
          usingCachedCourses: false,
          usingCachedCourseDetail: false,
          hasPendingSync: true,
        });
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
          await updateSyncState({
            isOffline: false,
            usingCachedCourseDetail: false,
            lastSyncedAt: new Date().toISOString(),
          });
          
          if (response.data.generationStatus.isComplete) {
            stopPolling();
            // Refresh the course
            await fetchCourse(courseId);
            // Refresh courses list
            await fetchCourses();
          } else if (response.data.generationStatus.failed) {
            stopPolling();
            setError(response.data.generationStatus.failedReason || 'Course generation failed');
          } else {
            await fetchCourse(courseId);
          }
        } else {
          throw new Error(response.error || 'Failed to fetch generation status');
        }
      } catch (error) {
        await updateSyncState({
          isOffline: true,
          usingCachedCourseDetail: true,
          hasPendingSync: true,
        });
        console.error('Error polling generation status:', error);
      }
    };
    
    // Poll immediately
    await poll();
    
    // Then poll every 3 seconds
    pollingIntervalRef.current = setInterval(poll, 3000);
  };

  const continueGeneration = async (courseId: string) => {
    try {
      setError(null);
      setGenerationStatus((prev) =>
        prev
          ? {
              ...prev,
              currentMessage: 'Continuing course generation...',
            }
          : {
              isComplete: false,
              generatedCount: 0,
              totalCount: 0,
              percentage: 0,
              currentMessage: 'Continuing course generation...',
            }
      );

      const response = await courseApi.continueCourseGeneration(courseId);

      if (response.success) {
        await updateSyncState({
          isOffline: false,
          hasPendingSync: true,
        });
        await pollGenerationStatus(courseId);
      } else {
        throw new Error(response.error || 'Failed to continue course generation');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to continue course generation');
    }
  };

  const retryGeneration = async (courseId: string) => {
    try {
      setError(null);
      setGenerationStatus({
        isComplete: false,
        generatedCount: 0,
        totalCount: 0,
        percentage: 0,
        currentMessage: 'Retrying course generation...',
      });
      
      const response = await courseApi.retryCourseGeneration(courseId);
      
      if (response.success) {
        setGenerationStatus(response.data.generationStatus);
        await updateSyncState({
          isOffline: false,
          hasPendingSync: true,
        });
        await pollGenerationStatus(courseId);
      } else {
        throw new Error(response.error || 'Failed to retry course generation');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to retry course generation');
    }
  };

  const resumeGeneration = async (courseId: string) => {
    try {
      setError(null);
      setGenerationStatus(prev => prev ? {
        ...prev,
        currentMessage: 'Resuming course generation...',
      } : null);
      
      const response = await courseApi.resumeCourseGeneration(courseId);
      
      if (response.success) {
        setGenerationStatus(response.data.generationStatus);
        await updateSyncState({
          isOffline: false,
          hasPendingSync: true,
        });
        await pollGenerationStatus(courseId);
      } else {
        throw new Error(response.error || 'Failed to resume course generation');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to resume course generation');
    }
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
        await markOnline();
      }
    } catch (error: any) {
      await updateSyncState({
        isOffline: true,
        hasPendingSync: true,
      });
      setError(error.message || 'Failed to update progress');
    }
  };

  const archiveCourse = async (courseId: string) => {
    try {
      setError(null);

      const response = await courseApi.archiveCourse(courseId);

      if (!response.success) {
        throw new Error(response.error || 'Failed to archive course');
      }

      setCourses((prev) =>
        prev.map((course) =>
          course._id === courseId
            ? {
                ...course,
                isArchived: true,
              }
            : course
        )
      );

      if (currentCourse?.course._id === courseId) {
        setCurrentCourse({
          ...currentCourse,
          course: {
            ...currentCourse.course,
            isArchived: true,
          },
        });
      }

      await markOnline();
    } catch (error: any) {
      await updateSyncState({
        isOffline: true,
        hasPendingSync: true,
      });
      setError(error.message || 'Failed to archive course');
    }
  };

  const deleteCourse = async (courseId: string) => {
    try {
      setIsLoading(true);
      
      const response = await courseApi.deleteCourse(courseId);
      
      if (response.success) {
        setCourses(prev => prev.filter(c => c._id !== courseId));
        if (userId) {
          await AsyncStorage.removeItem(getCourseDetailCacheKey(userId, courseId));
        }
        await markOnline();
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
        syncState,
        pagination,
        fetchCourses,
        fetchCourse,
        fetchStats,
        generateCourse,
        updateProgress,
        archiveCourse,
        deleteCourse,
        continueGeneration,
        pollGenerationStatus,
        retryGeneration,
        resumeGeneration,
        stopPolling,
        markOnline,
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
