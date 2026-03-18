/**
 * Lesson Screen
 *
 * Displays lesson content with explanation, examples, videos, and practice questions.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
  useColorScheme,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useCourse } from '@/contexts/CourseContext';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import {
  PlayCircle,
  CheckCircle2,
  Circle,
  Lightbulb,
  BookOpen,
  Video,
  X,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList, CoursesStackParamList } from '@/navigation/types';
import type { MicroTopic, LessonContent, Video as VideoType } from '@/types';

type LessonRouteProp = RouteProp<HomeStackParamList | CoursesStackParamList, 'Lesson'>;

type LessonNavigationProp = NativeStackNavigationProp<HomeStackParamList | CoursesStackParamList, 'Lesson'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LessonScreen: React.FC = () => {
  const route = useRoute<LessonRouteProp>();
  const navigation = useNavigation<LessonNavigationProp>();
  const { courseId, moduleId, microTopicId } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { currentCourse, fetchCourse, updateProgress } = useCourse();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const textColor = isDark ? '#e2e8f0' : '#0f172a';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const primaryColor = '#6366f1';
  const successColor = '#10b981';

  useEffect(() => {
    const loadCourse = async () => {
      setIsLoading(true);
      await fetchCourse(courseId);
      setIsLoading(false);
    };

    loadCourse();
  }, [courseId, fetchCourse]);

  const getMicroTopic = (): MicroTopic | null => {
    if (!currentCourse?.course) return null;

    for (const module of currentCourse.course.modules) {
      for (const topic of module.microTopics) {
        if (topic._id === microTopicId) {
          return topic;
        }
      }
    }
    return null;
  };

  const microTopic = getMicroTopic();
  const content = microTopic?.content as LessonContent | null;
  const videos = microTopic?.videos as VideoType[] | null;

  // Don't auto-select video - only show player when user clicks
  const selectedVideo = videos?.find((video) => video.videoId === selectedVideoId) ?? null;

  const handleMarkComplete = async () => {
    if (!microTopic) return;
    await updateProgress(courseId, moduleId, microTopicId, !microTopic.isCompleted);
  };

  // Find next lesson
  const getNextLesson = () => {
    if (!currentCourse?.course?.modules) return null;
    
    let foundCurrent = false;
    for (const mod of currentCourse.course.modules) {
      for (const topic of mod.microTopics) {
        if (foundCurrent) {
          return { moduleId: mod._id, microTopicId: topic._id, title: topic.title };
        }
        if (topic._id === microTopicId) {
          foundCurrent = true;
        }
      }
    }
    return null;
  };

  // Find previous lesson
  const getPreviousLesson = () => {
    if (!currentCourse?.course?.modules) return null;
    
    let prevLesson: { moduleId: string; microTopicId: string; title: string } | null = null;
    for (const mod of currentCourse.course.modules) {
      for (const topic of mod.microTopics) {
        if (topic._id === microTopicId) {
          return prevLesson;
        }
        prevLesson = { moduleId: mod._id, microTopicId: topic._id, title: topic.title };
      }
    }
    return null;
  };

  const nextLesson = getNextLesson();
  const previousLesson = getPreviousLesson();

  const handleNextLesson = () => {
    if (nextLesson) {
      navigation.push('Lesson', {
        courseId,
        moduleId: nextLesson.moduleId,
        microTopicId: nextLesson.microTopicId,
      });
    }
  };

  const handlePreviousLesson = () => {
    if (previousLesson) {
      navigation.push('Lesson', {
        courseId,
        moduleId: previousLesson.moduleId,
        microTopicId: previousLesson.microTopicId,
      });
    }
  };

  if (isLoading || !microTopic || !content) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator size="large" color={primaryColor} />
        <Text className="mt-3 text-slate-500 dark:text-slate-400">Loading lesson...</Text>
      </View>
    );
  }

  const isCompleted = microTopic.isCompleted;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-4 pt-2 pb-3">
          <Text className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wide">Lesson</Text>
          <Text className="text-slate-900 dark:text-white text-2xl font-bold mt-2">{microTopic.title}</Text>
        </View>

        {videos && videos.length > 0 && (
          <View className="px-4 mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Video size={20} color="#ec4899" />
              <Text className="text-slate-900 dark:text-white text-lg font-semibold">Related Videos</Text>
            </View>

            {selectedVideo && (
              <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mb-4">
                <View className="relative">
                  <YoutubePlayer height={220} play={true} videoId={selectedVideo.videoId} />
                  <TouchableOpacity
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 items-center justify-center"
                    onPress={() => setSelectedVideoId(null)}
                  >
                    <X size={18} color="#ffffff" />
                  </TouchableOpacity>
                </View>
                <View className="p-4">
                  <Text className="text-slate-900 dark:text-white font-semibold">{selectedVideo.title}</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1">{selectedVideo.channelTitle}</Text>
                </View>
              </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {videos.map((video) => {
                const hasImageError = imageErrors[video.videoId];
                const isSelected = video.videoId === selectedVideo?.videoId;

                return (
                  <TouchableOpacity
                    key={video.videoId}
                    className={`mr-3 bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden ${
                      isSelected ? 'border-indigo-500' : 'border-slate-200 dark:border-slate-800'
                    }`}
                    onPress={() => setSelectedVideoId(video.videoId)}
                    style={{ width: SCREEN_WIDTH * 0.7 }}
                  >
                    <View className="relative h-36 bg-slate-200 dark:bg-slate-800">
                      {!hasImageError && video.thumbnailUrl ? (
                        <Image
                          source={{ uri: video.thumbnailUrl }}
                          className="h-full w-full"
                          resizeMode="cover"
                          onError={() =>
                            setImageErrors((prev) => ({
                              ...prev,
                              [video.videoId]: true,
                            }))
                          }
                        />
                      ) : (
                        <View className="flex-1 items-center justify-center bg-indigo-500">
                          <PlayCircle size={42} color="#ffffff" />
                        </View>
                      )}
                      <View className="absolute inset-0 items-center justify-center bg-slate-900/30">
                        <PlayCircle size={34} color="#ffffff" />
                      </View>
                    </View>
                    <Text className="text-slate-900 dark:text-white text-sm font-semibold px-3 pt-3" numberOfLines={2}>
                      {video.title}
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs px-3 mt-1">{video.channelTitle}</Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs px-3 pb-3">{video.duration}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View className="px-4 mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <BookOpen size={20} color={primaryColor} />
            <Text className="text-slate-900 dark:text-white text-lg font-semibold">Explanation</Text>
          </View>
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <Text className="text-slate-700 dark:text-slate-200 leading-6">{content.explanation}</Text>
          </View>
        </View>

        <View className="px-4 mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Lightbulb size={20} color="#f59e0b" />
            <Text className="text-slate-900 dark:text-white text-lg font-semibold">Example</Text>
          </View>
          <View className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
            <Text className="text-slate-700 dark:text-slate-200 leading-6">{content.example}</Text>
          </View>
        </View>

        <View className="px-4 mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Lightbulb size={20} color="#8b5cf6" />
            <Text className="text-slate-900 dark:text-white text-lg font-semibold">Analogy</Text>
          </View>
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <Text className="text-slate-700 dark:text-slate-200 leading-6">{content.analogy}</Text>
          </View>
        </View>

        {content.keyTakeaways && content.keyTakeaways.length > 0 && (
          <View className="px-4 mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <CheckCircle2 size={20} color={successColor} />
              <Text className="text-slate-900 dark:text-white text-lg font-semibold">Key Takeaways</Text>
            </View>
            <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              {content.keyTakeaways.map((takeaway, index) => (
                <View key={index} className="flex-row items-start mb-3">
                  <View className="h-2 w-2 rounded-full bg-emerald-500 mt-2 mr-3" />
                  <Text className="flex-1 text-slate-700 dark:text-slate-200 leading-6">{takeaway}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {content.practiceQuestions && content.practiceQuestions.length > 0 && (
          <View className="px-4 mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <BookOpen size={20} color="#06b6d4" />
              <Text className="text-slate-900 dark:text-white text-lg font-semibold">Practice Questions</Text>
            </View>
            {content.practiceQuestions.map((pq, index) => (
              <View key={index} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-3">
                <Text className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">Q{index + 1}</Text>
                <Text className="text-slate-900 dark:text-white font-semibold mb-3">{pq.question}</Text>
                <View className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3">
                  <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">Answer:</Text>
                  <Text className="text-slate-700 dark:text-slate-200">{pq.answer}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View className="px-4">
          <View className="flex-row gap-3">
            {previousLesson && (
              <TouchableOpacity className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 flex-row items-center justify-center gap-2" onPress={handlePreviousLesson}>
                <ArrowLeft size={18} color={primaryColor} />
                <Text className="text-slate-900 dark:text-white font-semibold">Previous</Text>
              </TouchableOpacity>
            )}

            {nextLesson && (
              <TouchableOpacity className="flex-1 bg-indigo-600 dark:bg-indigo-500 rounded-xl py-3 flex-row items-center justify-center gap-2" onPress={handleNextLesson}>
                <Text className="text-white font-semibold">Next</Text>
                <ArrowRight size={18} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            className={`mt-4 rounded-xl py-3 flex-row items-center justify-center gap-2 border ${
              isCompleted ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/40' : 'bg-white dark:bg-slate-900 border-indigo-500/60'
            }`}
            onPress={handleMarkComplete}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 size={18} color={successColor} />
                <Text className="text-emerald-600 dark:text-emerald-300 font-semibold">Completed</Text>
              </>
            ) : (
              <>
                <Circle size={18} color={primaryColor} />
                <Text className="text-indigo-600 dark:text-indigo-300 font-semibold">Mark as Complete</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LessonScreen;
