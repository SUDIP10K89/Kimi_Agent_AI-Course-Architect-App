/**
 * Course Detail Screen
 * 
 * Displays course content with modules and lessons.
 */

import React, { useEffect, useState } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
} from 'lucide-react-native';
import type { HomeStackParamList, CoursesStackParamList } from '@/navigation/types';
import type { MicroTopic } from '@/types';

type CourseDetailRouteProp = RouteProp<HomeStackParamList | CoursesStackParamList, 'CourseDetail'>;
type CourseDetailNavigationProp = NativeStackNavigationProp<HomeStackParamList | CoursesStackParamList, 'CourseDetail'>;

const CourseDetailScreen: React.FC = () => {
  const navigation = useNavigation<CourseDetailNavigationProp>();
  const route = useRoute<CourseDetailRouteProp>();
  const { courseId } = route.params;
  
  const { 
    currentCourse, 
    fetchCourse, 
    isLoading, 
    deleteCourse, 
    updateProgress,
    generationStatus,
    pollGenerationStatus,
    stopPolling,
  } = useCourse();
  
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCourse(courseId);
    
    // Start polling if generation is in progress
    if (generationStatus && !generationStatus.isComplete) {
      pollGenerationStatus(courseId);
    }
    
    return () => {
      stopPolling();
    };
  }, [courseId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCourse(courseId);
    setRefreshing(false);
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const handleLessonPress = (moduleId: string, microTopic: MicroTopic) => {
    // Check if content is ready
    if (!microTopic.content || microTopic.videos.length === 0) {
      Alert.alert('Not Ready', 'This lesson is still being generated. Please wait.');
      return;
    }
    
    navigation.navigate('Lesson', { 
      courseId, 
      moduleId, 
      microTopicId: microTopic._id 
    });
  };

  const handleToggleComplete = async (moduleId: string, microTopic: MicroTopic) => {
    await updateProgress(courseId, moduleId, microTopic._id, !microTopic.isCompleted);
  };

  const handleDeleteCourse = () => {
    Alert.alert(
      'Delete Course',
      'Are you sure you want to delete this course? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteCourse(courseId);
            navigation.goBack();
          }
        },
      ]
    );
  };

  if (isLoading && !currentCourse) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading course...</Text>
      </View>
    );
  }

  if (!currentCourse?.course) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Course not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchCourse(courseId)}>
          <RefreshCw size={20} color="#6366f1" />
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Course Header */}
        <View style={styles.header}>
          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.courseDescription}>{course.description}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <BookOpen size={16} color="#6b7280" />
              <Text style={styles.metaText}>{course.modules.length} modules</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={16} color="#6b7280" />
              <Text style={styles.metaText}>{course.estimatedDuration} min</Text>
            </View>
            <View style={[styles.difficultyBadge, styles[`difficulty_${course.difficulty}`]]}>
              <Text style={[styles.difficultyText, styles[`difficultyText_${course.difficulty}`]]}>
                {course.difficulty}
              </Text>
            </View>
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressPercentage}>{course.progress.percentage}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${course.progress.percentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressDetail}>
              {course.progress.completedMicroTopics} of {course.progress.totalMicroTopics} lessons completed
            </Text>
          </View>

          {/* Generation Status */}
          {generationStatus && !generationStatus.isComplete && (
            <View style={styles.generationStatus}>
              <ActivityIndicator size="small" color="#6366f1" />
              <Text style={styles.generationText}>
                {generationStatus.currentMessage || 'Generating course content...'}
              </Text>
            </View>
          )}
        </View>

        {/* Modules */}
        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>Course Content</Text>
          
          {course.modules.map((module) => (
            <View key={module._id} style={styles.moduleCard}>
              <TouchableOpacity
                style={styles.moduleHeader}
                onPress={() => toggleModule(module._id)}
              >
                <View style={styles.moduleInfo}>
                  {expandedModules.has(module._id) ? (
                    <ChevronUp size={24} color="#6366f1" />
                  ) : (
                    <ChevronDown size={24} color="#6366f1" />
                  )}
                  <View style={styles.moduleText}>
                    <Text style={styles.moduleTitle}>{module.title}</Text>
                    <Text style={styles.moduleMeta}>
                      {module.microTopics.length} lessons
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {expandedModules.has(module._id) && (
                <View style={styles.microTopicsContainer}>
                  {module.microTopics.map((microTopic) => (
                    <TouchableOpacity
                      key={microTopic._id}
                      style={styles.microTopicItem}
                      onPress={() => handleLessonPress(module._id, microTopic)}
                    >
                      <TouchableOpacity
                        onPress={() => handleToggleComplete(module._id, microTopic)}
                        style={styles.checkbox}
                      >
                        {microTopic.isCompleted ? (
                          <CheckCircle2 size={20} color="#10b981" />
                        ) : (
                          <Circle size={20} color="#9ca3af" />
                        )}
                      </TouchableOpacity>
                      
                      <View style={styles.microTopicContent}>
                        <Text style={[
                          styles.microTopicTitle,
                          microTopic.isCompleted && styles.completedTitle
                        ]}>
                          {microTopic.title}
                        </Text>
                        
                        {microTopic.content ? (
                          <View style={styles.microTopicIcons}>
                            {microTopic.content.keyTakeaways.length > 0 && (
                              <BookOpen size={14} color="#6b7280" />
                            )}
                            {microTopic.videos.length > 0 && (
                              <PlayCircle size={14} color="#ec4899" />
                            )}
                          </View>
                        ) : (
                          <View style={styles.generatingBadge}>
                            <RefreshCw size={12} color="#6366f1" />
                            <Text style={styles.generatingText}>Generating...</Text>
                          </View>
                        )}
                      </View>
                      
                      <PlayCircle size={24} color="#6366f1" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteCourse}>
            <Trash2 size={20} color="#dc2626" />
            <Text style={styles.deleteButtonText}>Delete Course</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#eef2ff',
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#111827',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressDetail: {
    fontSize: 12,
    color: '#6b7280',
  },
  generationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
  },
  generationText: {
    fontSize: 14,
    color: '#6366f1',
  },
  modulesSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  moduleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#111827',
  },
  moduleMeta: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  microTopicsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
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
    color: '#111827',
    marginBottom: 4,
  },
  completedTitle: {
    color: '#9ca3af',
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
  },
  generatingText: {
    fontSize: 12,
    color: '#6366f1',
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
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CourseDetailScreen;
