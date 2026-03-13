/**
 * Public Courses Screen
 *
 * Displays public courses that users can fork to their account.
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, BookOpen, Clock, Users, Plus } from 'lucide-react-native';
import { useCourse } from '@/contexts/CourseContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getPublicCourses, forkCourse } from '@/api/courseApi';
import type { CoursesStackParamList } from '@/navigation/types';
import type { Course } from '@/types';

type PublicCoursesNavigationProp = NativeStackNavigationProp<CoursesStackParamList, 'PublicCourses'>;

const PublicCoursesScreen: React.FC = () => {
  const navigation = useNavigation<PublicCoursesNavigationProp>();
  const { fetchCourses } = useCourse();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
        style={styles.courseCard}
        onPress={() => handleForkCourse(course)}
      >
        <View style={styles.courseContent}>
          <View style={styles.courseHeader}>
            <View style={styles.courseStatusBadge}>
              <Text style={styles.courseStatusText}>Public</Text>
            </View>
            <View style={styles.authorInfo}>
              <Users size={14} color={colors.textMuted} />
              <Text style={styles.authorText}>
                {(course as any).createdBy?.name || 'Unknown'}
              </Text>
            </View>
          </View>
          <Text style={styles.courseTitle} numberOfLines={2}>
            {course.title}
          </Text>
          <Text style={styles.courseDescription} numberOfLines={2}>
            {course.description}
          </Text>
          <View style={styles.courseMeta}>
            <View style={styles.metaItem}>
              <BookOpen size={16} color={colors.textMuted} />
              <Text style={styles.metaText}>{moduleCount} modules</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={16} color={colors.textMuted} />
              <Text style={styles.metaText}>{totalLessons} lessons</Text>
            </View>
          </View>
        </View>
        <View style={styles.forkButtonContainer}>
          <TouchableOpacity
            style={styles.forkButton}
            onPress={() => handleForkCourse(course)}
            disabled={forkingId === course._id}
          >
            {forkingId === course._id ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <>
                <Plus size={18} color={colors.textInverse} />
                <Text style={styles.forkButtonText}>Add</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <BookOpen size={64} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>No Public Courses</Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? 'No courses match your search'
          : 'Be the first to make your course public!'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading || page === 1) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search public courses..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      <FlatList
        data={courses}
        renderItem={renderCourseCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!isLoading ? renderEmptyList : null}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />

      {isLoading && page === 1 && (
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
    listContent: {
      padding: 16,
      paddingBottom: 32,
    },
    courseCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
    },
    courseContent: {
      flex: 1,
    },
    courseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    courseStatusBadge: {
      backgroundColor: colors.primarySoft,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    courseStatusText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    authorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    authorText: {
      color: colors.textMuted,
      fontSize: 12,
    },
    courseTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    courseDescription: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 12,
      lineHeight: 20,
    },
    courseMeta: {
      flexDirection: 'row',
      gap: 16,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      color: colors.textMuted,
      fontSize: 13,
    },
    forkButtonContainer: {
      justifyContent: 'center',
      marginLeft: 12,
    },
    forkButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    forkButtonText: {
      color: colors.textInverse,
      fontSize: 14,
      fontWeight: '600',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textMuted,
      textAlign: 'center',
      paddingHorizontal: 40,
    },
    loadingContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255,255,255,0.9)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingMore: {
      paddingVertical: 20,
      alignItems: 'center',
    },
  });

export default PublicCoursesScreen;
