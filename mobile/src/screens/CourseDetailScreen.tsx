/**
 * Course Detail Screen
 *
 * Displays course content with modules and lessons.
 */

import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
  useColorScheme,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useCourse } from '@/contexts/CourseContext';
import { GenerationProgress, LessonStatusIndicator, ModuleProgress } from '@/components';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { updateCourseVisibility } from '@/api/courseApi';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  PlayCircle,
  CheckCircle2,
  Circle,
  Trash2,
  RefreshCw,
  CloudOff,
  MoreVertical,
} from 'lucide-react-native';
import type { HomeStackParamList, CoursesStackParamList } from '@/navigation/types';
import type { MicroTopic, LessonGenerationStatus, Module } from '@/types';

type CourseDetailRouteProp = RouteProp<HomeStackParamList | CoursesStackParamList, 'CourseDetail'>;
type CourseDetailNavigationProp = NativeStackNavigationProp<HomeStackParamList | CoursesStackParamList, 'CourseDetail'>;

const CourseDetailScreen: React.FC = () => {
  const navigation = useNavigation<CourseDetailNavigationProp>();
  const route = useRoute<CourseDetailRouteProp>();
  const { courseId } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    currentCourse,
    fetchCourse,
    isLoading,
    deleteCourse,
    updateProgress,
    generationStatus,
    pollGenerationStatus,
    stopPolling,
    syncState,
  } = useCourse();

  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const pollingStartedRef = useRef(false);

  const textColor = isDark ? '#e2e8f0' : '#0f172a';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const primaryColor = '#6366f1';
  const successColor = '#10b981';
  const dangerColor = '#ef4444';

  // Header menu
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowOptions(true)}
          style={{ padding: 8 }}
        >
          <MoreVertical size={24} color={textColor} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, textColor, currentCourse]);

  const handleToggleVisibility = async () => {
    const course = currentCourse?.course;
    if (!course) return;
    
    try {
      await updateCourseVisibility(courseId, !course.isPublic);
      await fetchCourse(courseId);
    } catch (error) {
      Alert.alert('Error', 'Failed to update course visibility');
    }
  };

  useEffect(() => {
    // Fetch course on mount
    fetchCourse(courseId);

    // Start polling only if not already started and generation is not complete
    if (!pollingStartedRef.current && generationStatus && !generationStatus.isComplete) {
      pollingStartedRef.current = true;
      pollGenerationStatus(courseId);
    }

    return () => {
      pollingStartedRef.current = false;
      stopPolling();
    };
  }, [courseId, fetchCourse, pollGenerationStatus, stopPolling]);

  // Separate effect to start polling when generationStatus becomes available
  useEffect(() => {
    if (generationStatus && !generationStatus.isComplete && !pollingStartedRef.current) {
      pollingStartedRef.current = true;
      pollGenerationStatus(courseId);
    }
  }, [generationStatus, courseId, pollGenerationStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCourse(courseId);
    setRefreshing(false);
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const getLessonStatus = (microTopicId: string): LessonGenerationStatus | undefined =>
    generationStatus?.lessons?.find((l) => l.lessonId === microTopicId);

  const renderLessonStatus = (microTopic: MicroTopic) => {
    const lessonStatus = getLessonStatus(microTopic._id);

    if (lessonStatus) {
      return <LessonStatusIndicator status={lessonStatus.status} />;
    }

    if (microTopic.content) {
      return (
        <View className="flex-row gap-2">
          {microTopic.content.keyTakeaways.length > 0 && <BookOpen size={14} color={mutedColor} />}
          {microTopic.videos.length > 0 && <PlayCircle size={14} color="#ec4899" />}
        </View>
      );
    }

    return (
      <View className="flex-row items-center gap-1">
        <RefreshCw size={12} color={primaryColor} />
        <Text className="text-xs text-indigo-500">Generating...</Text>
      </View>
    );
  };

  const handleLessonPress = (moduleId: string, microTopic: MicroTopic) => {
    if (!microTopic.content || microTopic.videos.length === 0) {
      Alert.alert('Not Ready', 'This lesson is still being generated. Please wait.');
      return;
    }

    navigation.navigate('Lesson', {
      courseId,
      moduleId,
      microTopicId: microTopic._id,
    });
  };

  const handleToggleComplete = async (moduleId: string, microTopic: MicroTopic) => {
    await updateProgress(courseId, moduleId, microTopic._id, !microTopic.isCompleted);
  };

  const getModuleLessons = (module: Module): LessonGenerationStatus[] =>
    generationStatus?.lessons?.filter((lesson) => lesson.moduleId === module._id) || [];

  const handleDeleteCourse = () => {
    setShowOptions(false);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    await deleteCourse(courseId);
    navigation.goBack();
  };

  if (isLoading && !currentCourse) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator size="large" color={primaryColor} />
        <Text className="mt-3 text-slate-500 dark:text-slate-400">Loading course...</Text>
      </View>
    );
  }

  if (!currentCourse?.course) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Text className="text-rose-500 mb-4">Course not found</Text>
        <TouchableOpacity className="flex-row items-center gap-2 px-5 py-3 rounded-xl bg-indigo-500/10" onPress={() => fetchCourse(courseId)}>
          <RefreshCw size={18} color={primaryColor} />
          <Text className="text-indigo-600 dark:text-indigo-300 font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { course } = currentCourse;

  const difficultyClass = course.difficulty === 'beginner'
    ? 'bg-emerald-100 text-emerald-700'
    : course.difficulty === 'intermediate'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-rose-100 text-rose-700';

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}
      >
        <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 mb-4">
          {(syncState.isOffline || syncState.usingCachedCourseDetail) && (
            <View className="flex-row items-start gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 mb-4">
              <CloudOff size={16} color="#b45309" />
              <Text className="flex-1 text-amber-800 dark:text-amber-200 text-xs">
                Showing saved course detail while offline. Progress updates will sync when you reconnect.
              </Text>
            </View>
          )}

          <Text className="text-slate-900 dark:text-white text-2xl font-bold mb-2">{course.title}</Text>
          <Text className="text-slate-500 dark:text-slate-400 mb-4">{course.description}</Text>

          <View className="flex-row flex-wrap items-center gap-3 mb-4">
            <View className="flex-row items-center gap-1">
              <BookOpen size={16} color={mutedColor} />
              <Text className="text-slate-500 dark:text-slate-400 text-sm">{course.modules.length} modules</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Clock size={16} color={mutedColor} />
              <Text className="text-slate-500 dark:text-slate-400 text-sm">{course.estimatedDuration} min</Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${difficultyClass}`}>
              <Text className="text-xs font-semibold capitalize">{course.difficulty}</Text>
            </View>
          </View>

          <View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-700 dark:text-slate-200 text-sm font-semibold">Progress</Text>
              <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">{course.progress.percentage}%</Text>
            </View>
            <View className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <View className="h-2 bg-indigo-600 dark:bg-indigo-500" style={{ width: `${course.progress.percentage}%` }} />
            </View>
            <Text className="text-slate-500 dark:text-slate-400 text-xs mt-2">
              {course.progress.completedMicroTopics} of {course.progress.totalMicroTopics} lessons completed
            </Text>
          </View>

          {generationStatus && <GenerationProgress courseId={courseId} showLessonDetails={true} />}
        </View>

        <View className="px-4">
          <Text className="text-slate-900 dark:text-white text-lg font-semibold mb-4">Course Content</Text>

          {course.modules.map((module) => (
            <View key={module._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mb-3 overflow-hidden">
              <TouchableOpacity className="flex-row items-center justify-between p-4" onPress={() => toggleModule(module._id)}>
                <View className="flex-row items-center flex-1">
                  {expandedModules.has(module._id) ? (
                    <ChevronUp size={22} color={primaryColor} />
                  ) : (
                    <ChevronDown size={22} color={primaryColor} />
                  )}
                  <View className="ml-3 flex-1">
                    <Text className="text-slate-900 dark:text-white text-base font-semibold">{module.title}</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1">{module.microTopics.length} lessons</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {getModuleLessons(module).length > 0 && (
                <View className="px-4 pb-3">
                  <ModuleProgress moduleName={module.title} lessons={getModuleLessons(module)} />
                </View>
              )}

              {expandedModules.has(module._id) && (
                <View className="border-t border-slate-200 dark:border-slate-800 py-2">
                  {module.microTopics.map((microTopic) => (
                    <TouchableOpacity
                      key={microTopic._id}
                      className="flex-row items-center gap-3 px-4 py-3"
                      onPress={() => handleLessonPress(module._id, microTopic)}
                    >
                      <TouchableOpacity onPress={() => handleToggleComplete(module._id, microTopic)}>
                        {microTopic.isCompleted ? (
                          <CheckCircle2 size={20} color={successColor} />
                        ) : (
                          <Circle size={20} color={mutedColor} />
                        )}
                      </TouchableOpacity>

                      <View className="flex-1">
                        <Text className={`text-sm ${microTopic.isCompleted ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                          {microTopic.title}
                        </Text>
                        {renderLessonStatus(microTopic)}
                        {getLessonStatus(microTopic._id)?.error && (
                          <Text className="text-rose-500 text-xs mt-1">{getLessonStatus(microTopic._id)?.error}</Text>
                        )}
                      </View>

                      <PlayCircle size={22} color={microTopic.content && microTopic.videos.length > 0 ? primaryColor : '#cbd5f5'} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        <View className="px-4 mt-4">
          <TouchableOpacity className="flex-row items-center justify-center gap-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 rounded-xl py-3" onPress={handleDeleteCourse}>
            <Trash2 size={18} color={dangerColor} />
            <Text className="text-rose-600 dark:text-rose-300 font-semibold">Delete Course</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal transparent visible={showOptions} animationType="fade" onRequestClose={() => setShowOptions(false)}>
        <View className="flex-1">
          <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View className="absolute inset-0 bg-black/30" />
          <Pressable className="flex-1 items-center justify-center px-6" onPress={() => setShowOptions(false)}>
            <Pressable className="w-full bg-white dark:bg-slate-900 rounded-2xl px-5 pt-5 pb-6 border border-slate-200 dark:border-slate-800">
              <Text className="text-slate-900 dark:text-white text-lg font-semibold mb-4">Course Options</Text>
              <TouchableOpacity
                className="py-3"
                onPress={async () => {
                  setShowOptions(false);
                  await handleToggleVisibility();
                }}
              >
                <Text className="text-indigo-600 dark:text-indigo-400 text-base font-semibold">
                  {course.isPublic ? 'Make Private' : 'Make Public'}
                </Text>
              </TouchableOpacity>
              <View className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
              <TouchableOpacity className="py-3" onPress={handleDeleteCourse}>
                <Text className="text-rose-600 dark:text-rose-300 text-base font-semibold">Delete Course</Text>
              </TouchableOpacity>
              <TouchableOpacity className="mt-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 items-center" onPress={() => setShowOptions(false)}>
                <Text className="text-slate-700 dark:text-slate-200 font-semibold">Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </View>
      </Modal>

      <Modal transparent visible={showDeleteConfirm} animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
        <View className="flex-1">
          <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View className="absolute inset-0 bg-black/40" />
          <Pressable className="flex-1 items-center justify-center px-6" onPress={() => setShowDeleteConfirm(false)}>
            <Pressable className="w-full bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <Text className="text-slate-900 dark:text-white text-lg font-semibold mb-2">Delete course?</Text>
            <Text className="text-slate-500 dark:text-slate-400 text-sm mb-5">
              This action cannot be undone. Your progress will be lost.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 items-center" onPress={() => setShowDeleteConfirm(false)}>
                <Text className="text-slate-700 dark:text-slate-200 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 py-3 rounded-xl bg-rose-600 items-center" onPress={handleConfirmDelete}>
                <Text className="text-white font-semibold">Delete</Text>
              </TouchableOpacity>
            </View>
            </Pressable>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CourseDetailScreen;
