/**
 * Generate Course Screen
 *
 * Dedicated page for generating new AI courses.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Sparkles,
  BookOpen,
  Clock,
  Play,
  CheckCircle,
  ArrowRight,
} from 'lucide-react-native';
import { useCourse } from '@/contexts/CourseContext';
import { GenerationProgress } from '@/components';

const SUGGESTED_TOPICS = ['Machine Learning', 'React Development', 'Design Thinking', 'Startup Strategy'];

const GenerateCourseScreen: React.FC = () => {
  const { generateCourse, pollGenerationStatus, generationStatus, stopPolling } = useCourse();

  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return () => {
        stopPolling();
      };
    }, [stopPolling])
  );

  const onRefresh = async () => {
    setRefreshing(true);
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
    } catch (error) {
      console.error('Error generating course:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestedTopic = (suggestedTopic: string) => {
    setTopic(suggestedTopic);
  };

  const isGeneratingActive = generationStatus && !generationStatus.isComplete && !generationStatus.failed;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView
        contentContainerClassName="px-5 pb-10"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
      >
        <View className="mt-3 mb-6">
          <Text className="text-slate-500 dark:text-slate-300 text-sm">Create something new</Text>
          <Text className="text-slate-900 dark:text-white text-3xl font-bold mt-1">Generate a course</Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Tell us what you want to learn. We’ll craft the outline and lessons for you.
          </Text>
        </View>

        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-6">
          <Text className="text-slate-900 dark:text-white text-lg font-semibold mb-4">What you get</Text>

          <View className="flex-row items-start gap-3 mb-4">
            <View className="h-10 w-10 rounded-full bg-indigo-500/15 items-center justify-center">
              <BookOpen size={18} color="#818cf8" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 dark:text-white text-sm font-semibold">Comprehensive outline</Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                Well-structured modules and lessons tailored to your topic.
              </Text>
            </View>
          </View>

          <View className="flex-row items-start gap-3 mb-4">
            <View className="h-10 w-10 rounded-full bg-indigo-500/15 items-center justify-center">
              <Clock size={18} color="#818cf8" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 dark:text-white text-sm font-semibold">Bite-sized content</Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                Micro-lessons designed for effective learning.
              </Text>
            </View>
          </View>

          <View className="flex-row items-start gap-3 mb-4">
            <View className="h-10 w-10 rounded-full bg-indigo-500/15 items-center justify-center">
              <Play size={18} color="#818cf8" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 dark:text-white text-sm font-semibold">AI-powered videos</Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                Relevant YouTube videos to enhance your learning.
              </Text>
            </View>
          </View>

          <View className="flex-row items-start gap-3">
            <View className="h-10 w-10 rounded-full bg-indigo-500/15 items-center justify-center">
              <CheckCircle size={18} color="#818cf8" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 dark:text-white text-sm font-semibold">Progress tracking</Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                Track your learning progress across all courses.
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6">
          <Text className="text-slate-500 dark:text-slate-300 text-xs uppercase tracking-wider">Topic</Text>
          <TextInput
            className="mt-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-4 text-slate-900 dark:text-white text-base"
            placeholder="What do you want to learn?"
            placeholderTextColor="#94a3b8"
            value={topic}
            onChangeText={setTopic}
            autoCapitalize="sentences"
            autoCorrect
            multiline={false}
          />

          <TouchableOpacity
            className={`mt-4 rounded-xl py-3.5 flex-row items-center justify-center gap-2 ${
              !topic.trim() || isGenerating ? 'bg-indigo-500' : 'bg-indigo-600 dark:bg-indigo-500'
            }`}
            onPress={handleGenerateCourse}
            disabled={!topic.trim() || isGenerating}
          >
            <Sparkles size={18} color="#ffffff" />
            <Text className="text-white font-semibold">
              {isGenerating ? 'Creating...' : 'Generate Course'}
            </Text>
          </TouchableOpacity>

          {isGeneratingActive && (
            <View className="mt-5">
              <GenerationProgress showLessonDetails={false} />
            </View>
          )}
        </View>

        <View className="mb-6">
          <Text className="text-slate-600 dark:text-slate-300 text-sm font-semibold mb-3">Suggested topics</Text>
          <View className="flex-row flex-wrap gap-2">
            {SUGGESTED_TOPICS.map((suggestedTopic) => {
              const isActive = topic === suggestedTopic;
              return (
                <TouchableOpacity
                  key={suggestedTopic}
                  className={`px-4 py-2 rounded-full border ${
                    isActive
                      ? 'bg-indigo-500/15 border-indigo-500/50'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                  onPress={() => handleSuggestedTopic(suggestedTopic)}
                >
                  <Text className={`${isActive ? 'text-indigo-600 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-200'} text-sm font-medium`}>
                    {suggestedTopic}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        
      </ScrollView>
    </SafeAreaView>
  );
};

export default GenerateCourseScreen;
