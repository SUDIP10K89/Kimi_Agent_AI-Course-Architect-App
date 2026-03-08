/**
 * Home Screen
 *
 * Main dashboard with features, stats, recent courses, and course generator.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Sparkles, BookOpen, Video, Clock, TrendingUp, Loader2, Play, Layers3, ArrowRight, CloudOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useCourse } from '@/contexts/CourseContext';
import { GenerationProgress } from '@/components';
import type { HomeStackParamList } from '@/navigation/types';
import type { Course } from '@/types';

type HomeNavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-Powered Content',
    description: 'Our AI crafts structured lessons with real-world examples.',
    gradient: '#6366f1',
  },
  {
    icon: BookOpen,
    title: 'Structured Learning',
    description: 'Organized into modules and micro-topics for mastery.',
    gradient: '#8b5cf6',
  },
  {
    icon: Video,
    title: 'Curated Videos',
    description: 'Automatically finds the best YouTube videos for each lesson.',
    gradient: '#ec4899',
  },
];

const SUGGESTED_TOPICS = ['Machine Learning', 'React Development', 'Design Thinking', 'Startup Strategy'];

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  const { user } = useAuth();
  const { stats, fetchStats, generateCourse, pollGenerationStatus, generationStatus, syncState } = useCourse();

  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const handleGenerateCourse = async () => {
    if (!topic.trim()) {
      return;
    }

    setIsGenerating(true);
    try {
      const courseId = await generateCourse(topic.trim());
      pollGenerationStatus(courseId);
      setTopic('');
    } catch (error) {
      console.error('Error generating course:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCoursePress = (course: Course) => {
    navigation.navigate('CourseDetail', { courseId: course._id });
  };

  const handleViewAll = () => {
    navigation.getParent()?.navigate('CoursesTab', {
      screen: 'CoursesList',
    } as never);
  };

  const currentGeneratingLesson = useMemo(() => {
    if (!generationStatus?.lessons?.length) {
      return null;
    }

    return (
      generationStatus.lessons.find((lesson) => lesson.status === 'generating') ||
      generationStatus.lessons.find((lesson) => lesson.status === 'failed') ||
      null
    );
  }, [generationStatus]);

  const homeStats = stats
    ? [
        { label: 'Courses', value: stats.overview.totalCourses, icon: BookOpen, color: '#6366f1' },
        { label: 'Modules', value: stats.overview.totalModules, icon: Layers3, color: '#8b5cf6' },
        { label: 'Lessons', value: stats.overview.totalMicroTopics, icon: Clock, color: '#f59e0b' },
        { label: 'Avg. Progress', value: `${Math.round(stats.overview.avgProgress)}%`, icon: TrendingUp, color: '#10b981' },
      ]
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Learner'}!</Text>
        </View>

        {syncState.isOffline && (
          <View style={styles.offlineBanner}>
            <CloudOff size={16} color="#b45309" />
            <Text style={styles.offlineBannerText}>
              Showing saved data while offline. Recent changes will sync when you reconnect.
            </Text>
          </View>
        )}

        {stats && (
          <View style={styles.statsSection}>
            {homeStats.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <stat.icon size={22} color={stat.color} />
                <Text style={styles.statNumber}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.generatorSection}>
          <Text style={styles.sectionTitle}>Generate New Course</Text>
          <View style={styles.generatorCard}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.generatorInput}
                placeholder="What do you want to learn?"
                placeholderTextColor="#9ca3af"
                value={topic}
                onChangeText={setTopic}
              />
              <TouchableOpacity
                style={[styles.generateButton, (!topic.trim() || isGenerating) && styles.generateButtonDisabled]}
                onPress={handleGenerateCourse}
                disabled={!topic.trim() || isGenerating}
              >
                {isGenerating ? (
                  <Loader2 size={20} color="#fff" />
                ) : (
                  <>
                    <Sparkles size={20} color="#fff" />
                    <Text style={styles.generateButtonText}>Generate</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {generationStatus && (
              <View style={styles.generationPanel}>
                <View style={styles.generationSummaryRow}>
                  <View>
                    <Text style={styles.generationTitle}>Generation activity</Text>
                    <Text style={styles.generationSubtitle}>
                      {generationStatus.generatedCount || 0} of {generationStatus.totalCount || 0} lessons ready
                    </Text>
                  </View>
                  {!generationStatus.isComplete && (
                    <Text style={styles.generationPercent}>{generationStatus.percentage || 0}%</Text>
                  )}
                </View>

                {currentGeneratingLesson && (
                  <View style={styles.currentLessonCard}>
                    <Text style={styles.currentLessonLabel}>
                      {currentGeneratingLesson.status === 'failed' ? 'Needs attention' : 'Now generating'}
                    </Text>
                    <Text style={styles.currentLessonTitle}>{currentGeneratingLesson.lessonTitle}</Text>
                    <Text style={styles.currentLessonMeta}>{currentGeneratingLesson.moduleName}</Text>
                  </View>
                )}

                <GenerationProgress showLessonDetails={false} />
              </View>
            )}

            <Text style={styles.suggestedLabel}>Suggested topics:</Text>
            <View style={styles.suggestedRow}>
              {SUGGESTED_TOPICS.map((suggestedTopic) => (
                <TouchableOpacity
                  key={suggestedTopic}
                  style={styles.suggestedChip}
                  onPress={() => setTopic(suggestedTopic)}
                >
                  <Text style={styles.suggestedChipText}>{suggestedTopic}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Why AI Course Architect?</Text>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: `${feature.gradient}20` }]}>
                <feature.icon size={24} color={feature.gradient} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {stats?.recentCourses && stats.recentCourses.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Courses</Text>
              <TouchableOpacity style={styles.seeAllButton} onPress={handleViewAll}>
                <Text style={styles.seeAllText}>See All</Text>
                <ArrowRight size={16} color="#6366f1" />
              </TouchableOpacity>
            </View>
            {stats.recentCourses.map((course) => {
              const moduleCount = Array.isArray(course.modules) ? course.modules.length : 0;
              const progress = course.progress?.percentage ?? 0;
              const statusLabel = progress === 0 ? 'Not Started' : progress === 100 ? 'Completed' : 'In Progress';

              return (
                <TouchableOpacity
                  key={course._id}
                  style={styles.courseCard}
                  onPress={() => handleCoursePress(course)}
                >
                  <View style={styles.courseContent}>
                    <View style={styles.recentCourseHeader}>
                      <View style={[
                        styles.courseStatusBadge,
                        progress === 100
                          ? styles.courseStatusBadgeCompleted
                          : progress > 0
                            ? styles.courseStatusBadgeActive
                            : styles.courseStatusBadgeNew,
                      ]}>
                        <Text style={[
                          styles.courseStatusText,
                          progress === 100
                            ? styles.courseStatusTextCompleted
                            : progress > 0
                              ? styles.courseStatusTextActive
                              : styles.courseStatusTextNew,
                        ]}>
                          {statusLabel}
                        </Text>
                      </View>
                      <Clock size={16} color="#9ca3af" />
                    </View>
                    <Text style={styles.courseTitle} numberOfLines={2}>
                      {course.title}
                    </Text>
                    <Text style={styles.courseMeta}>
                      {moduleCount} modules | {course.difficulty}
                    </Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{progress}% complete</Text>
                  </View>
                  <Play size={24} color="#6366f1" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
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
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  statsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#92400e',
    fontSize: 13,
    lineHeight: 18,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  generatorSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  generatorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  generatorInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  generateButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  generationPanel: {
    marginTop: 16,
  },
  generationSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  generationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  generationSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  generationPercent: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366f1',
  },
  currentLessonCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 12,
  },
  currentLessonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentLessonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  currentLessonMeta: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
  },
  suggestedLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  suggestedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestedChip: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  suggestedChipText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  featuresSection: {
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  recentSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seeAllText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  courseContent: {
    flex: 1,
  },
  recentCourseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  courseStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  courseStatusBadgeNew: {
    backgroundColor: '#f3f4f6',
  },
  courseStatusBadgeActive: {
    backgroundColor: '#eef2ff',
  },
  courseStatusBadgeCompleted: {
    backgroundColor: '#dcfce7',
  },
  courseStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  courseStatusTextNew: {
    color: '#6b7280',
  },
  courseStatusTextActive: {
    color: '#4f46e5',
  },
  courseStatusTextCompleted: {
    color: '#15803d',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  courseMeta: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
});

export default HomeScreen;
