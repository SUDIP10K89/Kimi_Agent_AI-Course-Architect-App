/**
 * Public Courses Screen
 *
 * Displays public courses that users can fork to their account.
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, BookOpen, Clock, Users, Plus } from 'lucide-react-native';
import { useCourse } from '@/contexts/CourseContext';
import { getPublicCourses, forkCourse } from '@/api/courseApi';
import type { CoursesStackParamList } from '@/navigation/types';
import type { Course } from '@/types';

type PublicCoursesNavigationProp = NativeStackNavigationProp<CoursesStackParamList, 'PublicCourses'>;

const PublicCoursesScreen: React.FC = () => {
  const navigation = useNavigation<PublicCoursesNavigationProp>();
  const { fetchCourses } = useCourse();

  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forkingId, setForkingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPublicCourses = useCallback(async (pageNum: number = 1, search: string = '') => {
    try {
      if (pageNum === 1) {
        setIsLoading(true);
      }
      const response = await getPublicCourses(search, pageNum, 20);
      if (response.success) {
        if (pageNum === 1) {
          setCourses(response.data.courses);
        } else {
          setCourses(prev => [...prev, ...response.data.courses]);
        }
        setTotalPages(response.data.pagination.pages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching public courses:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicCourses(1, searchQuery);
  }, [fetchPublicCourses, searchQuery]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPublicCourses(1, searchQuery);
  };

  const loadMore = () => {
    if (page < totalPages && !isLoading) {
      fetchPublicCourses(page + 1, searchQuery);
    }
  };

  const handleForkCourse = async (course: Course) => {
    setForkingId(course._id);
    try {
      const response = await forkCourse(course._id);
      if (response.success) {
        Alert.alert(
          'Course Added!',
          `"${course.title}" has been added to your courses.`,
          [
            {
              text: 'View Course',
              onPress: () => {
                fetchCourses();
                navigation.navigate('CourseDetail', { courseId: response.data.courseId });
              },
            },
            { text: 'OK' },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to add course');
      }
    } catch (error) {
      console.error('Error forking course:', error);
      Alert.alert('Error', 'Failed to add course');
    } finally {
      setForkingId(null);
    }
  };

  const renderCourseCard = ({ item: course }: { item: Course }) => {
    const moduleCount = Array.isArray(course.modules) ? course.modules.length : 0;
    const totalLessons = Array.isArray(course.modules)
      ? course.modules.reduce((sum, mod) => sum + (Array.isArray(mod.microTopics) ? mod.microTopics.length : 0), 0)
      : 0;

    return (
      <TouchableOpacity
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-4 flex-row"
        onPress={() => handleForkCourse(course)}
      >
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-2">
            <View className="bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full">
              <Text className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">Public</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Users size={14} color="#94a3b8" />
              <Text className="text-slate-500 dark:text-slate-400 text-xs">
                {(course as any).createdBy?.name || 'Unknown'}
              </Text>
            </View>
          </View>
          <Text className="text-slate-900 dark:text-white text-base font-semibold" numberOfLines={2}>
            {course.title}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1" numberOfLines={2}>
            {course.description}
          </Text>
          <View className="flex-row gap-4 mt-3">
            <View className="flex-row items-center gap-1">
              <BookOpen size={16} color="#94a3b8" />
              <Text className="text-slate-500 dark:text-slate-400 text-xs">{moduleCount} modules</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Clock size={16} color="#94a3b8" />
              <Text className="text-slate-500 dark:text-slate-400 text-xs">{totalLessons} lessons</Text>
            </View>
          </View>
        </View>
        <View className="justify-center ml-3">
          <TouchableOpacity
            className="bg-indigo-600 dark:bg-indigo-500 rounded-xl px-4 py-2 flex-row items-center gap-2"
            onPress={() => handleForkCourse(course)}
            disabled={forkingId === course._id}
          >
            {forkingId === course._id ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Plus size={16} color="#ffffff" />
                <Text className="text-white text-sm font-semibold">Add</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View className="items-center justify-center py-16">
      <BookOpen size={64} color="#cbd5f5" />
      <Text className="text-slate-900 dark:text-white text-lg font-semibold mt-4">No Public Courses</Text>
      <Text className="text-slate-500 dark:text-slate-400 text-sm text-center mt-2 px-10">
        {searchQuery
          ? 'No courses match your search'
          : 'Be the first to make your course public!'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading || page === 1) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#6366f1" />
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-4">
          <Search size={18} color="#94a3b8" />
          <TextInput
            className="flex-1 py-3 text-slate-900 dark:text-white text-base ml-2"
            placeholder="Search public courses..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      <FlatList
        data={courses}
        renderItem={renderCourseCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListEmptyComponent={!isLoading ? renderEmptyList : null}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
      />

      {isLoading && page === 1 && (
        <View className="absolute inset-0 items-center justify-center bg-slate-900/10">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      )}
    </SafeAreaView>
  );
};

export default PublicCoursesScreen;
