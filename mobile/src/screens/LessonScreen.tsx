/**
 * Lesson Screen
 * 
 * Displays lesson content with explanation, examples, videos, and practice questions.
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
  Linking,
  Dimensions,
} from 'react-native';
import { useCourse } from '@/contexts/CourseContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  PlayCircle, 
  CheckCircle2, 
  Circle, 
  Lightbulb, 
  BookOpen, 
  Video,
  ArrowLeft,
} from 'lucide-react-native';
import type { HomeStackParamList, CoursesStackParamList } from '@/navigation/types';
import type { MicroTopic, LessonContent, Video as VideoType } from '@/types';

type LessonRouteProp = RouteProp<HomeStackParamList | CoursesStackParamList, 'Lesson'>;
type LessonNavigationProp = NativeStackNavigationProp<HomeStackParamList | CoursesStackParamList, 'Lesson'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LessonScreen: React.FC = () => {
  const navigation = useNavigation<LessonNavigationProp>();
  const route = useRoute<LessonRouteProp>();
  const { courseId, moduleId, microTopicId } = route.params;
  
  const { currentCourse, fetchCourse, updateProgress } = useCourse();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCourse = async () => {
      setIsLoading(true);
      await fetchCourse(courseId);
      setIsLoading(false);
    };
    
    loadCourse();
  }, [courseId]);

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

  const handleMarkComplete = async () => {
    if (!microTopic) return;
    await updateProgress(courseId, moduleId, microTopicId, !microTopic.isCompleted);
  };

  const openVideoInBrowser = (videoId: string) => {
    Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
  };

  if (isLoading || !microTopic || !content) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </View>
    );
  }

  const isCompleted = microTopic.isCompleted;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.lessonTitle} numberOfLines={2}>
            {microTopic.title}
          </Text>
        </View>

        {/* Mark Complete Button */}
        <TouchableOpacity
          style={[styles.completeButton, isCompleted && styles.completedButton]}
          onPress={handleMarkComplete}
        >
          {isCompleted ? (
            <>
              <CheckCircle2 size={20} color="#10b981" />
              <Text style={styles.completedButtonText}>Completed</Text>
            </>
          ) : (
            <>
              <Circle size={20} color="#6366f1" />
              <Text style={styles.completeButtonText}>Mark as Complete</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Videos Section */}
        {videos && videos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Video size={20} color="#ec4899" />
              <Text style={styles.sectionTitle}>Related Videos</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {videos.map((video) => (
                <TouchableOpacity
                  key={video.videoId}
                  style={styles.videoCard}
                  onPress={() => openVideoInBrowser(video.videoId)}
                >
                  <View style={styles.videoThumbnail}>
                    <PlayCircle size={40} color="#fff" />
                  </View>
                  <Text style={styles.videoTitle} numberOfLines={2}>
                    {video.title}
                  </Text>
                  <Text style={styles.videoChannel}>{video.channelTitle}</Text>
                  <Text style={styles.videoDuration}>{video.duration}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Explanation Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BookOpen size={20} color="#6366f1" />
            <Text style={styles.sectionTitle}>Explanation</Text>
          </View>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>{content.explanation}</Text>
          </View>
        </View>

        {/* Example Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lightbulb size={20} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Example</Text>
          </View>
          <View style={[styles.contentCard, styles.exampleCard]}>
            <Text style={styles.contentText}>{content.example}</Text>
          </View>
        </View>

        {/* Analogy Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lightbulb size={20} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>Analogy</Text>
          </View>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>{content.analogy}</Text>
          </View>
        </View>

        {/* Key Takeaways Section */}
        {content.keyTakeaways && content.keyTakeaways.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <CheckCircle2 size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>Key Takeaways</Text>
            </View>
            <View style={styles.takeawaysCard}>
              {content.keyTakeaways.map((takeaway, index) => (
                <View key={index} style={styles.takeawayItem}>
                  <View style={styles.takeawayBullet} />
                  <Text style={styles.takeawayText}>{takeaway}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Practice Questions Section */}
        {content.practiceQuestions && content.practiceQuestions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BookOpen size={20} color="#06b6d4" />
              <Text style={styles.sectionTitle}>Practice Questions</Text>
            </View>
            {content.practiceQuestions.map((pq, index) => (
              <View key={index} style={styles.questionCard}>
                <Text style={styles.questionNumber}>Q{index + 1}</Text>
                <Text style={styles.questionText}>{pq.question}</Text>
                <View style={styles.answerContainer}>
                  <Text style={styles.answerLabel}>Answer:</Text>
                  <Text style={styles.answerText}>{pq.answer}</Text>
                </View>
              </View>
            ))}
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
    paddingBottom: 40,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  lessonTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  completedButton: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  completedButtonText: {
    color: '#10b981',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exampleCard: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  contentText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  videoCard: {
    width: SCREEN_WIDTH * 0.7,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  videoThumbnail: {
    width: '100%',
    height: 120,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    padding: 12,
    paddingBottom: 4,
  },
  videoChannel: {
    fontSize: 12,
    color: '#6b7280',
    paddingHorizontal: 12,
  },
  videoDuration: {
    fontSize: 12,
    color: '#6b7280',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  takeawaysCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  takeawayItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  takeawayBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginTop: 6,
    marginRight: 12,
  },
  takeawayText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 12,
  },
  answerContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 15,
    color: '#374151',
  },
});

export default LessonScreen;
