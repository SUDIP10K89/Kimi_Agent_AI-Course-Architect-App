/**
 * Courses List Screen
 *
 * Displays all courses with search and filter options.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useCourse } from '@/contexts/CourseContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, BookOpen, Clock, ChevronRight, Archive, CloudOff, RefreshCw, Globe } from 'lucide-react-native';
import type { CoursesStackParamList } from '@/navigation/types';
import type { Course, CourseListFilter } from '@/types';

type CoursesNavigationProp = NativeStackNavigationProp<CoursesStackParamList, 'CoursesList'>;

const CoursesListScreen: React.FC = () => {
  const navigation = useNavigation<CoursesNavigationProp>();
  const { courses, fetchCourses, archiveCourse, isLoading, syncState } = useCourse();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<CourseListFilter>('all');

  useFocusEffect(
    useCallback(() => {
      fetchCourses(1, searchQuery);
    }, [fetchCourses, searchQuery])
  );

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCourses(1, searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [fetchCourses, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCourses(1, searchQuery);
    setRefreshing(false);
  };

  const handleCoursePress = (course: Course) => {
    navigation.navigate('CourseDetail', { courseId: course._id });
  };

  const handleArchiveCourse = (course: Course) => {
    if (syncState.isOffline) {
      Alert.alert('Offline', 'Reconnect to archive this course and sync the change.');
      return;
    }

    Alert.alert('Archive Course', `Archive "${course.title}" from your active learning list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        onPress: async () => {
          await archiveCourse(course._id);
        },
      },
    ]);
  };

  const filterCourses = useCallback(
    (status: CourseListFilter) => {
      const visibleCourses = status === 'all' ? courses : courses.filter((course) => !course.isArchived);

      if (status === 'not-started') {
        return visibleCourses.filter((course) => course.progress.percentage === 0);
      }

      if (status === 'in-progress') {
        return visibleCourses.filter((course) => course.progress.percentage > 0 && course.progress.percentage < 100);
      }

      if (status === 'completed') {
        return visibleCourses.filter((course) => course.progress.percentage === 100);
      }

      return visibleCourses;
    },
    [courses]
  );

  const getCourseCount = useCallback((status: CourseListFilter) => filterCourses(status).length, [filterCourses]);
  const filteredCourses = filterCourses(activeTab);

  const renderCourseCard = ({ item }: { item: Course }) => (
    <TouchableOpacity style={styles.courseCard} onPress={() => handleCoursePress(item)}>
      <View style={styles.courseIcon}>
        <BookOpen size={24} color={colors.primary} />
      </View>
      <View style={styles.courseContent}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.statusBadge,
              item.progress.percentage === 100
                ? styles.statusBadgeDone
                : item.progress.percentage > 0
                  ? styles.statusBadgeActive
                  : styles.statusBadgeNew,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                item.progress.percentage === 100
                  ? styles.statusBadgeTextDone
                  : item.progress.percentage > 0
                    ? styles.statusBadgeTextActive
                    : styles.statusBadgeTextNew,
              ]}
            >
              {item.progress.percentage === 100 ? 'Completed' : item.progress.percentage > 0 ? 'In Progress' : 'Not Started'}
            </Text>
          </View>
          {item.isArchived && (
            <View style={styles.archivedBadge}>
              <Archive size={12} color="#92400e" />
              <Text style={styles.archivedBadgeText}>Archived</Text>
            </View>
          )}
        </View>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.courseDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.courseMeta}>
          <View style={styles.metaItem}>
            <Clock size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{item.estimatedDuration} min</Text>
          </View>
          <View style={[styles.difficultyBadge, styles[`difficulty_${item.difficulty}`]]}>
            <Text style={[styles.difficultyText, styles[`difficultyText_${item.difficulty}`]]}>{item.difficulty}</Text>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${item.progress.percentage}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {item.progress.completedMicroTopics}/{item.progress.totalMicroTopics} lessons
          </Text>
        </View>
        {!item.isArchived && (
          <TouchableOpacity style={styles.archiveAction} onPress={() => handleArchiveCourse(item)}>
            <Archive size={14} color={colors.textMuted} />
            <Text style={styles.archiveActionText}>Archive</Text>
          </TouchableOpacity>
        )}
      </View>
      <ChevronRight size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <BookOpen size={64} color={colors.border} />
      <Text style={styles.emptyTitle}>No courses yet</Text>
      <Text style={styles.emptyDescription}>
        {activeTab === 'all'
          ? 'Start learning by generating your first AI-powered course!'
          : 'No courses match this learning state yet.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={[styles.exploreButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('PublicCourses')}
        >
          <Globe size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {(syncState.isOffline || syncState.usingCachedCourses || syncState.hasPendingSync) && (
        <View style={styles.offlineBanner}>
          <CloudOff size={16} color="#b45309" />
          <View style={styles.offlineBannerContent}>
            <Text style={styles.offlineBannerTitle}>{syncState.isOffline ? 'Offline mode' : 'Showing cached courses'}</Text>
            <Text style={styles.offlineBannerText}>
              {syncState.isOffline
                ? 'You are viewing saved courses. Reconnect to refresh progress and archive changes.'
                : 'Recent changes may still need to sync.'}
            </Text>
          </View>
          {syncState.hasPendingSync && <RefreshCw size={16} color="#b45309" />}
        </View>
      )}

      <View style={styles.tabsContainer}>
        {[
          ['all', 'All'],
          ['not-started', 'New'],
          ['in-progress', 'Active'],
          ['completed', 'Done'],
        ].map(([value, label]) => (
          <TouchableOpacity
            key={value}
            style={[styles.tab, activeTab === value && styles.activeTab]}
            onPress={() => setActiveTab(value as CourseListFilter)}
          >
            <Text style={[styles.tabText, activeTab === value && styles.activeTabText]}>
              {label} ({getCourseCount(value as CourseListFilter)})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredCourses}
        renderItem={renderCourseCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!isLoading ? renderEmptyList : null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchContainer: {
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: 12,
      paddingHorizontal: 16,
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    exploreButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    offlineBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginHorizontal: 16,
      marginTop: 12,
      padding: 12,
      backgroundColor: '#fffbeb',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#fcd34d',
    },
    offlineBannerContent: {
      flex: 1,
    },
    offlineBannerTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: '#92400e',
    },
    offlineBannerText: {
      fontSize: 12,
      color: '#92400e',
      marginTop: 2,
      lineHeight: 17,
    },
    tabsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      marginRight: 8,
      backgroundColor: colors.surfaceMuted,
      marginBottom: 8,
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textMuted,
    },
    activeTabText: {
      color: colors.textInverse,
    },
    listContent: {
      padding: 16,
      paddingBottom: 36,
    },
    courseCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    courseIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    courseContent: {
      flex: 1,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    statusBadgeNew: {
      backgroundColor: colors.surfaceMuted,
    },
    statusBadgeActive: {
      backgroundColor: colors.primarySoft,
    },
    statusBadgeDone: {
      backgroundColor: colors.successSoft,
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: '600',
    },
    statusBadgeTextNew: {
      color: colors.textMuted,
    },
    statusBadgeTextActive: {
      color: colors.primary,
    },
    statusBadgeTextDone: {
      color: colors.success,
    },
    archivedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#fef3c7',
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    archivedBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#92400e',
    },
    courseTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    courseDescription: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 8,
    },
    courseMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      color: colors.textMuted,
    },
    difficultyBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
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
      fontWeight: '500',
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
    progressContainer: {
      marginTop: 4,
    },
    progressBar: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      marginBottom: 4,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    progressText: {
      fontSize: 12,
      color: colors.textMuted,
    },
    archiveAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      marginTop: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.surfaceMuted,
    },
    archiveActionText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 80,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
    },
    emptyDescription: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 8,
      paddingHorizontal: 40,
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(17,24,39,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default CoursesListScreen;
