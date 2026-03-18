/**
 * Home Screen
 *
 * Main dashboard with stats, course generator, and recent courses.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  BookOpen,
  Clock,
  TrendingUp,
  Play,
  Layers3,
  ArrowRight,
  CloudOff,
  Sparkles,
  Flame,
  Trophy,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useCourse } from '@/contexts/CourseContext';
import type { HomeStackParamList } from '@/navigation/types';
import type { Course } from '@/types';

type HomeNavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  const { user, refreshUser } = useAuth();
  const { stats, fetchStats, syncState } = useCourse();

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
      refreshUser();
    }, [fetchStats, refreshUser])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    await refreshUser();
    setRefreshing(false);
  };

  const handleGenerateCourse = () => {
    navigation.navigate('GenerateCourse');
  };

  const handleCoursePress = (course: Course) => {
    navigation.navigate('CourseDetail', { courseId: course._id });
  };

  const handleViewAll = () => {
    navigation.getParent()?.navigate('CoursesTab', {
      screen: 'CoursesList',
    } as never);
  };

  const baseStats = stats
    ? [
        { label: 'Courses', value: stats.overview.totalCourses, icon: BookOpen, color: '#6366f1' },
        { label: 'Modules', value: stats.overview.totalModules, icon: Layers3, color: '#8b5cf6' },
        { label: 'Lessons', value: stats.overview.totalMicroTopics, icon: Clock, color: '#f59e0b' },
        { label: 'Avg. Progress', value: `${Math.round(stats.overview.avgProgress)}%`, icon: TrendingUp, color: '#10b981' },
      ]
    : [];

  const recentCourses = stats?.recentCourses?.slice(0, 3) ?? [];
  const currentStreak = user?.streak?.current ?? 0;
  const longestStreak = user?.streak?.longest ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        contentContainerClassName="px-5 pb-10"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
      >
        <View className="mt-4 mb-6">
          <Text className="text-slate-500 dark:text-slate-300 text-sm">Welcome back,</Text>
          <Text className="text-slate-900 dark:text-white text-3xl font-bold">{user?.name || 'Learner'}!</Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Keep your learning momentum going today.
          </Text>
        </View>


        {syncState.isOffline && (
          <View className="flex-row items-start gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 mb-6">
            <CloudOff size={16} color="#b45309" />
            <Text className="flex-1 text-amber-800 dark:text-amber-200 text-xs leading-4">
              Showing saved data while offline. Recent changes will sync when you reconnect.
            </Text>
          </View>
        )}

        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6">
          <Text className="text-slate-500 dark:text-slate-300 text-sm mb-3">Streak</Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Flame size={18} color="#fb923c" />
                <Text className="text-slate-900 dark:text-white text-lg font-semibold">{currentStreak} days</Text>
              </View>
              <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">Current streak</Text>
            </View>
            <View className="h-10 w-px bg-slate-200 dark:bg-slate-800" />
            <View className="flex-1 items-end">
              <View className="flex-row items-center gap-2">
                <Trophy size={18} color="#facc15" />
                <Text className="text-slate-900 dark:text-white text-lg font-semibold">{longestStreak} days</Text>
              </View>
              <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">Longest streak</Text>
            </View>
          </View>
        </View>

        {baseStats.length > 0 && (
          <View className="mb-6">
            <Text className="text-slate-900 dark:text-white text-lg font-semibold mb-4">Your Progress</Text>
            <View className="flex-row flex-wrap gap-3">
              {baseStats.map((stat) => (
                <View
                  key={stat.label}
                  className="w-[48%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4"
                >
                  <stat.icon size={20} color={stat.color} />
                  <Text className="text-slate-900 dark:text-white text-2xl font-bold mt-3">{stat.value}</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {recentCourses.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-slate-900 dark:text-white text-lg font-semibold">Recent Courses</Text>
              <TouchableOpacity className="flex-row items-center gap-2" onPress={handleViewAll}>
                <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">See All</Text>
                <ArrowRight size={16} color="#818cf8" />
              </TouchableOpacity>
            </View>
            {recentCourses.map((course) => {
              const moduleCount = Array.isArray(course.modules) ? course.modules.length : 0;
              const progress = course.progress?.percentage ?? 0;
              const statusLabel = progress === 0 ? 'Not Started' : progress === 100 ? 'Completed' : 'In Progress';

              return (
                <TouchableOpacity
                  key={course._id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-3"
                  onPress={() => handleCoursePress(course)}
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View
                      className={`px-3 py-1 rounded-full border ${
                        progress === 100
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : progress > 0
                            ? 'bg-indigo-500/10 border-indigo-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          progress === 100
                            ? 'text-emerald-600 dark:text-emerald-300'
                            : progress > 0
                              ? 'text-indigo-600 dark:text-indigo-300'
                              : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {statusLabel}
                      </Text>
                    </View>
                    <Clock size={16} color="#94a3b8" />
                  </View>
                  <Text className="text-slate-900 dark:text-white text-base font-semibold" numberOfLines={2}>
                    {course.title}
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1 capitalize">
                    {moduleCount} modules · {course.difficulty}
                  </Text>
                  <View className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                    <View className="h-2 bg-indigo-600 dark:bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
                  </View>
                  <Text className="text-slate-500 dark:text-slate-400 text-xs mt-2">{progress}% complete</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6">
          <View className="flex-row items-center gap-4">
            <View className="h-14 w-14 rounded-2xl bg-indigo-500/15 dark:bg-indigo-500/15 items-center justify-center">
              <Sparkles size={26} color="#818cf8" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 dark:text-white text-base font-semibold">Generate New Course</Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                Create AI-powered courses tailored to your learning goals.
              </Text>
            </View>
            <ArrowRight size={20} color="#818cf8" />
          </View>
          <TouchableOpacity
            className="mt-4 border border-indigo-500/40 rounded-xl py-2.5 items-center"
            onPress={handleGenerateCourse}
          >
            <Text className="text-indigo-600 dark:text-indigo-200 font-semibold">Start Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
