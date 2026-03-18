/**
 * Courses List Screen
 *
 * Displays all courses with search and filter options.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useCourse } from '@/contexts/CourseContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, BookOpen, Clock, ChevronRight, Archive, CloudOff, RefreshCw, Globe } from 'lucide-react-native';
import type { CoursesStackParamList } from '@/navigation/types';
import type { Course, CourseListFilter } from '@/types';

type CoursesNavigationProp = NativeStackNavigationProp<CoursesStackParamList, 'CoursesList'>;

const CoursesListScreen: React.FC = () => {
  const navigation = useNavigation<CoursesNavigationProp>();
  const { courses, fetchCourses, archiveCourse, isLoading, syncState } = useCourse();

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

  const renderCourseCard = ({ item }: { item: Course }) => {
    const statusLabel = item.progress.percentage === 100 ? 'Completed' : item.progress.percentage > 0 ? 'In Progress' : 'Not Started';

    const statusClass = item.progress.percentage === 100
      ? 'bg-emerald-500/10 border-emerald-500/30'
      : item.progress.percentage > 0
        ? 'bg-indigo-500/10 border-indigo-500/30'
        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';

    const statusTextClass = item.progress.percentage === 100
      ? 'text-emerald-600 dark:text-emerald-300'
      : item.progress.percentage > 0
        ? 'text-indigo-600 dark:text-indigo-300'
        : 'text-slate-600 dark:text-slate-300';

    const difficultyClass = item.difficulty === 'beginner'
      ? 'bg-emerald-100 text-emerald-700'
      : item.difficulty === 'intermediate'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-rose-100 text-rose-700';

    return (
      <TouchableOpacity className="flex-row bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-3" onPress={() => handleCoursePress(item)}>
        <View className="h-12 w-12 rounded-xl bg-indigo-500/10 items-center justify-center mr-3">
          <BookOpen size={22} color="#6366f1" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center flex-wrap gap-2 mb-2">
            <View className={`px-3 py-1 rounded-full border ${statusClass}`}>
              <Text className={`text-xs font-semibold ${statusTextClass}`}>{statusLabel}</Text>
            </View>
            {item.isArchived && (
              <View className="flex-row items-center gap-1 bg-amber-100 dark:bg-amber-500/20 rounded-full px-2 py-1">
                <Archive size={12} color="#92400e" />
                <Text className="text-[11px] font-semibold text-amber-800 dark:text-amber-200">Archived</Text>
              </View>
            )}
          </View>
          <Text className="text-slate-900 dark:text-white text-base font-semibold" numberOfLines={2}>
            {item.title}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1" numberOfLines={2}>
            {item.description}
          </Text>
          <View className="flex-row items-center gap-3 mt-2">
            <View className="flex-row items-center gap-1">
              <Clock size={14} color="#94a3b8" />
              <Text className="text-slate-500 dark:text-slate-400 text-xs">{item.estimatedDuration} min</Text>
            </View>
            <View className={`px-2 py-0.5 rounded-full ${difficultyClass}`}>
              <Text className="text-xs font-semibold capitalize">{item.difficulty}</Text>
            </View>
          </View>
          <View className="mt-3">
            <View className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <View className="h-2 bg-indigo-600 dark:bg-indigo-500 rounded-full" style={{ width: `${item.progress.percentage}%` }} />
            </View>
            <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              {item.progress.completedMicroTopics}/{item.progress.totalMicroTopics} lessons
            </Text>
          </View>
          {!item.isArchived && (
            <TouchableOpacity className="mt-3 flex-row items-center gap-2" onPress={() => handleArchiveCourse(item)}>
              <Archive size={14} color="#64748b" />
              <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Archive</Text>
            </TouchableOpacity>
          )}
        </View>
        <ChevronRight size={18} color="#94a3b8" />
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View className="items-center justify-center pt-20">
      <BookOpen size={64} color="#e2e8f0" />
      <Text className="text-slate-900 dark:text-white text-lg font-semibold mt-4">No courses yet</Text>
      <Text className="text-slate-500 dark:text-slate-400 text-sm text-center mt-2 px-10">
        {activeTab === 'all'
          ? 'Start learning by generating your first AI-powered course!'
          : 'No courses match this learning state yet.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-row items-center gap-3">
        <View className="flex-row items-center flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-4">
          <Search size={18} color="#94a3b8" />
          <TextInput
            className="flex-1 py-3 text-slate-900 dark:text-white text-base ml-2"
            placeholder="Search courses..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity className="h-11 w-11 rounded-xl bg-indigo-600 dark:bg-indigo-500 items-center justify-center" onPress={() => navigation.navigate('PublicCourses')}>
          <Globe size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {(syncState.isOffline || syncState.usingCachedCourses || syncState.hasPendingSync) && (
        <View className="flex-row items-start gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 mx-4 mt-3">
          <CloudOff size={16} color="#b45309" />
          <View className="flex-1">
            <Text className="text-amber-800 dark:text-amber-200 text-xs font-semibold">
              {syncState.isOffline ? 'Offline mode' : 'Showing cached courses'}
            </Text>
            <Text className="text-amber-700 dark:text-amber-200 text-xs mt-1">
              {syncState.isOffline
                ? 'You are viewing saved courses. Reconnect to refresh progress and archive changes.'
                : 'Recent changes may still need to sync.'}
            </Text>
          </View>
          {syncState.hasPendingSync && <RefreshCw size={16} color="#b45309" />}
        </View>
      )}

      <View className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-row flex-wrap gap-2">
        {([
          ['all', 'All'],
          ['not-started', 'New'],
          ['in-progress', 'Active'],
          ['completed', 'Done'],
        ] as Array<[CourseListFilter, string]>).map(([value, label]) => (
          <TouchableOpacity
            key={value}
            className={`px-4 py-2 rounded-full ${activeTab === value ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-100 dark:bg-slate-800'}`}
            onPress={() => setActiveTab(value)}
          >
            <Text className={`text-xs font-semibold ${activeTab === value ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
              {label} ({getCourseCount(value)})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredCourses}
        renderItem={renderCourseCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
        ListEmptyComponent={!isLoading ? renderEmptyList : null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
      />

      {isLoading && (
        <View className="absolute inset-0 items-center justify-center bg-slate-900/10">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      )}
    </SafeAreaView>
  );
};

export default CoursesListScreen;
