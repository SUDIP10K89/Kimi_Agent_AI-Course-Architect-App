/**
 * Course Detail Screen
 *
 * Displays course content with modules and lessons.
 */

import React, { useEffect, useState, useMemo, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useCourse } from '@/contexts/CourseContext';
import { useTheme } from '@/contexts/ThemeContext';
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
  Globe,
  Lock,
} from 'lucide-react-native';
import type { HomeStackParamList, CoursesStackParamList } from '@/navigation/types';
import type { MicroTopic, LessonGenerationStatus, Module } from '@/types';

type CourseDetailRouteProp = RouteProp<HomeStackParamList | CoursesStackParamList, 'CourseDetail'>;
type CourseDetailNavigationProp = NativeStackNavigationProp<HomeStackParamList | CoursesStackParamList, 'CourseDetail'>;

const CourseDetailScreen: React.FC = () => {
  const navigation = useNavigation<CourseDetailNavigationProp>();
  const route = useRoute<CourseDetailRouteProp>();
  const { courseId } = route.params;

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
  const pollingStartedRef = useRef(false);

  // Header menu
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => {
            const course = currentCourse?.course;
            const isPublic = course?.isPublic || false;
            Alert.alert(
              'Course Options',
              'Choose an action',
              [
                {
                  text: isPublic ? 'Make Private' : 'Make Public',
                  onPress: handleToggleVisibility,
                },
                {
                  text: 'Delete Course',
                  style: 'destructive',
                  onPress: handleDeleteCourse,
                },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }}
          style={{ padding: 8 }}
        >
          <MoreVertical size={24} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors, currentCourse]);

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
        <View style={styles.microTopicIcons}>
          {microTopic.content.keyTakeaways.length > 0 && <BookOpen size={14} color={colors.textMuted} />}
          {microTopic.videos.length > 0 && <PlayCircle size={14} color="#ec4899" />}
        </View>
      );
    }

    return (
      <View style={styles.generatingBadge}>
        <RefreshCw size={12} color={colors.primary} />
        <Text style={styles.generatingText}>Generating...</Text>
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
    Alert.alert('Delete Course', 'Are you sure you want to delete this course? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCourse(courseId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (isLoading && !currentCourse) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading course...</Text>
      </View>
    );
  }

  if (!currentCourse?.course) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Course not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchCourse(courseId)}>
          <RefreshCw size={20} color={colors.primary} />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { course } = currentCourse;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          {(syncState.isOffline || syncState.usingCachedCourseDetail) && (
            <View style={styles.offlineBanner}>
              <CloudOff size={16} color="#b45309" />
              <Text style={styles.offlineBannerText}>
                Showing saved course detail while offline. Progress updates will sync when you reconnect.
              </Text>
            </View>
          )}

          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.courseDescription}>{course.description}</Text>

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <BookOpen size={16} color={colors.textMuted} />
              <Text style={styles.metaText}>{course.modules.length} modules</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={16} color={colors.textMuted} />
              <Text style={styles.metaText}>{course.estimatedDuration} min</Text>
            </View>
            <View style={[styles.difficultyBadge, styles[`difficulty_${course.difficulty}`]]}>
              <Text style={[styles.difficultyText, styles[`difficultyText_${course.difficulty}`]]}>{course.difficulty}</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressPercentage}>{course.progress.percentage}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${course.progress.percentage}%` }]} />
            </View>
            <Text style={styles.progressDetail}>
              {course.progress.completedMicroTopics} of {course.progress.totalMicroTopics} lessons completed
            </Text>
          </View>

          {generationStatus && <GenerationProgress courseId={courseId} showLessonDetails={true} />}
        </View>

        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>Course Content</Text>

          {course.modules.map((module) => (
            <View key={module._id} style={styles.moduleCard}>
              <TouchableOpacity style={styles.moduleHeader} onPress={() => toggleModule(module._id)}>
                <View style={styles.moduleInfo}>
                  {expandedModules.has(module._id) ? (
                    <ChevronUp size={24} color={colors.primary} />
                  ) : (
                    <ChevronDown size={24} color={colors.primary} />
                  )}
                  <View style={styles.moduleText}>
                    <Text style={styles.moduleTitle}>{module.title}</Text>
                    <Text style={styles.moduleMeta}>{module.microTopics.length} lessons</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {getModuleLessons(module).length > 0 && (
                <View style={styles.moduleProgressWrapper}>
                  <ModuleProgress moduleName={module.title} lessons={getModuleLessons(module)} />
                </View>
              )}

              {expandedModules.has(module._id) && (
                <View style={styles.microTopicsContainer}>
                  {module.microTopics.map((microTopic) => (
                    <TouchableOpacity
                      key={microTopic._id}
                      style={styles.microTopicItem}
                      onPress={() => handleLessonPress(module._id, microTopic)}
                    >
                      <TouchableOpacity onPress={() => handleToggleComplete(module._id, microTopic)} style={styles.checkbox}>
                        {microTopic.isCompleted ? (
                          <CheckCircle2 size={20} color={colors.success} />
                        ) : (
                          <Circle size={20} color={colors.textMuted} />
                        )}
                      </TouchableOpacity>

                      <View style={styles.microTopicContent}>
                        <Text style={[styles.microTopicTitle, microTopic.isCompleted && styles.completedTitle]}>
                          {microTopic.title}
                        </Text>

                        {renderLessonStatus(microTopic)}
                        {getLessonStatus(microTopic._id)?.error && (
                          <Text style={styles.lessonErrorText}>{getLessonStatus(microTopic._id)?.error}</Text>
                        )}
                      </View>

                      <PlayCircle
                        size={24}
                        color={microTopic.content && microTopic.videos.length > 0 ? colors.primary : colors.border}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteCourse}>
            <Trash2 size={20} color={colors.danger} />
            <Text style={styles.deleteButtonText}>Delete Course</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: 24,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textMuted,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    errorText: {
      fontSize: 16,
      color: colors.danger,
      marginBottom: 16,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      backgroundColor: colors.primarySoft,
      borderRadius: 12,
    },
    retryButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '500',
    },
    header: {
      backgroundColor: colors.surface,
      padding: 16,
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    offlineBanner: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      backgroundColor: '#fffbeb',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#fcd34d',
      padding: 12,
      marginBottom: 16,
    },
    offlineBannerText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: '#92400e',
    },
    courseTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    courseDescription: {
      fontSize: 16,
      color: colors.textMuted,
      marginBottom: 16,
    },
    metaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 16,
      flexWrap: 'wrap',
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 14,
      color: colors.textMuted,
    },
    difficultyBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    difficulty_beginner: {
      backgroundColor: '#d1fae5',
    },
    difficulty_intermediate: {
      backgroundColor: '#fef3c7',
    },
    difficulty_advanced: {
      backgroundColor: '#fee2e2',
    },
    difficultyText: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    difficultyText_beginner: {
      color: '#059669',
    },
    difficultyText_intermediate: {
      color: '#d97706',
    },
    difficultyText_advanced: {
      color: '#dc2626',
    },
    progressSection: {
      marginTop: 8,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    progressLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    progressPercentage: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      marginBottom: 8,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    progressDetail: {
      fontSize: 12,
      color: colors.textMuted,
    },
    modulesSection: {
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    moduleCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    moduleProgressWrapper: {
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    moduleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    moduleInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    moduleText: {
      marginLeft: 12,
      flex: 1,
    },
    moduleTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    moduleMeta: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 2,
    },
    microTopicsContainer: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: 8,
    },
    microTopicItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    checkbox: {
      padding: 2,
    },
    microTopicContent: {
      flex: 1,
    },
    microTopicTitle: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 4,
    },
    completedTitle: {
      color: colors.textMuted,
      textDecorationLine: 'line-through',
    },
    microTopicIcons: {
      flexDirection: 'row',
      gap: 8,
    },
    generatingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
    },
    generatingText: {
      fontSize: 12,
      color: colors.primary,
    },
    lessonErrorText: {
      marginTop: 4,
      fontSize: 12,
      color: colors.danger,
    },
    actionsSection: {
      padding: 16,
      marginTop: 16,
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 16,
      backgroundColor: colors.dangerSoft,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    deleteButtonText: {
      color: colors.danger,
      fontSize: 16,
      fontWeight: '500',
    },
  });

export default CourseDetailScreen;
