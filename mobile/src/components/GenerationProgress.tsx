import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useCourse } from '@/contexts/CourseContext';
import type { GenerationStatus, LessonGenerationStatus } from '@/types';

interface GenerationProgressProps {
  courseId?: string;
  showLessonDetails?: boolean;
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({ 
  courseId,
  showLessonDetails = false 
}) => {
  const { generationStatus, retryGeneration, resumeGeneration, continueGeneration } = useCourse();

  if (!generationStatus) {
    return null;
  }

  const handleRetry = () => {
    if (courseId) {
      retryGeneration(courseId);
    }
  };

  const handleResume = () => {
    if (courseId) {
      resumeGeneration(courseId);
    }
  };

  const handleContinue = () => {
    if (courseId) {
      continueGeneration(courseId);
    }
  };

  const currentLesson =
    generationStatus.lessons?.find((lesson) => lesson.status === 'generating') ||
    generationStatus.lessons?.find((lesson) => lesson.status === 'failed') ||
    null;

  const renderProgressBar = () => {
    const percentage = generationStatus.percentage || 0;
    return (
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${percentage}%` }]} />
      </View>
    );
  };

  const renderFailedState = () => {
    if (!generationStatus.failed) {
      return null;
    }

    return (
      <View style={styles.failedContainer}>
        <Text style={styles.stateLabel}>Generation paused</Text>
        <Text style={styles.failedText}>
          {generationStatus.failedReason || 'Generation failed'}
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>
              Retry
            </Text>
          </TouchableOpacity>
          {generationStatus.lastGeneratedLessonId && (
            <TouchableOpacity style={styles.resumeButton} onPress={handleResume}>
              <Text style={styles.resumeButtonText}>
                Resume
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderActionRow = () => {
    if (generationStatus.isComplete || generationStatus.failed || !courseId) {
      return null;
    }

    return (
      <View style={styles.inlineActionsRow}>
        <TouchableOpacity style={styles.inlineActionButton} onPress={handleContinue}>
          <Text style={styles.inlineActionText}>Continue</Text>
        </TouchableOpacity>
        {generationStatus.lastGeneratedLessonId && (
          <TouchableOpacity style={styles.inlineSecondaryButton} onPress={handleResume}>
            <Text style={styles.inlineSecondaryText}>Resume From Last Lesson</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderCurrentLesson = () => {
    if (!currentLesson) {
      return null;
    }

    return (
      <View style={styles.currentLessonCard}>
        <Text style={styles.currentLessonLabel}>
          {currentLesson.status === 'failed' ? 'Stopped on' : 'Currently generating'}
        </Text>
        <Text style={styles.currentLessonTitle}>{currentLesson.lessonTitle}</Text>
        <Text style={styles.currentLessonMeta}>{currentLesson.moduleName}</Text>
        {currentLesson.error && (
          <Text style={styles.currentLessonError}>{currentLesson.error}</Text>
        )}
      </View>
    );
  };

  const renderModuleSummary = () => {
    if (!generationStatus.lessons?.length) {
      return null;
    }

    const moduleGroups = generationStatus.lessons.reduce<Record<string, LessonGenerationStatus[]>>((groups, lesson) => {
      const key = lesson.moduleId;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(lesson);
      return groups;
    }, {});

    return (
      <View style={styles.moduleSummary}>
        {Object.values(moduleGroups).map((lessons) => (
          <View key={lessons[0].moduleId} style={styles.moduleSummaryRow}>
            <Text style={styles.moduleSummaryTitle}>{lessons[0].moduleName}</Text>
            <Text style={styles.moduleSummaryText}>
              {lessons.filter((lesson) => lesson.status === 'completed').length}/{lessons.length} ready
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderLessonDetails = () => {
    if (!showLessonDetails || !generationStatus.lessons) {
      return null;
    }

    return (
      <View style={styles.lessonDetails}>
        {generationStatus.lessons.map((lesson: LessonGenerationStatus) => (
          <View key={lesson.lessonId} style={styles.lessonItem}>
            <View style={[
              styles.lessonStatusDot,
              lesson.status === 'completed' && styles.lessonStatusCompleted,
              lesson.status === 'generating' && styles.lessonStatusGenerating,
              lesson.status === 'failed' && styles.lessonStatusFailed,
              lesson.status === 'pending' && styles.lessonStatusPending,
            ]} />
            <View style={styles.lessonTextGroup}>
              <Text style={styles.lessonTitle} numberOfLines={1}>
                {lesson.lessonTitle}
              </Text>
              <Text style={styles.lessonModule} numberOfLines={1}>
                {lesson.moduleName}
              </Text>
            </View>
            <Text style={styles.lessonStatus}>
              {lesson.status}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderCompletedState = () => {
    if (!generationStatus.isComplete) {
      return null;
    }

    return (
      <View style={styles.completedContainer}>
        <Text style={styles.completedText}>
          Generation complete!
        </Text>
        <Text style={styles.completedSubtext}>
          All lessons and video recommendations are ready.
        </Text>
      </View>
    );
  };

  const renderActiveState = () => {
    if (generationStatus.isComplete || generationStatus.failed) {
      return null;
    }

    return (
      <View style={styles.activeContainer}>
        <View style={styles.progressHeader}>
          <View style={styles.progressHeading}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.headingText}>Generating course content</Text>
          </View>
          <Text style={styles.percentageText}>
            {generationStatus.percentage || 0}%
          </Text>
        </View>
        {renderProgressBar()}
        <Text style={styles.messageText}>
          {generationStatus.currentMessage || 'Generating...'}
        </Text>
        <Text style={styles.countText}>
          {generationStatus.generatedCount || 0} / {generationStatus.totalCount || 0} lessons ready
        </Text>
        {renderCurrentLesson()}
        {renderActionRow()}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderActiveState()}
      {renderFailedState()}
      {renderCompletedState()}
      {renderModuleSummary()}
      {renderLessonDetails()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    marginVertical: 8,
  },
  activeContainer: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  percentageText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#3C3C43',
    textAlign: 'center',
    marginBottom: 4,
  },
  countText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'left',
  },
  currentLessonCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  currentLessonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  currentLessonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  currentLessonMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  currentLessonError: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 6,
  },
  inlineActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  inlineActionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  inlineActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  inlineSecondaryButton: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  inlineSecondaryText: {
    color: '#0C4A6E',
    fontSize: 13,
    fontWeight: '600',
  },
  failedContainer: {
    alignItems: 'center',
  },
  stateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  failedText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resumeButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resumeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  completedContainer: {
    alignItems: 'center',
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
  },
  completedSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  moduleSummary: {
    marginTop: 14,
    gap: 8,
  },
  moduleSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  moduleSummaryTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  moduleSummaryText: {
    fontSize: 12,
    color: '#6b7280',
  },
  lessonDetails: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  lessonStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  lessonTextGroup: {
    flex: 1,
  },
  lessonStatusCompleted: {
    backgroundColor: '#34C759',
  },
  lessonStatusGenerating: {
    backgroundColor: '#007AFF',
  },
  lessonStatusFailed: {
    backgroundColor: '#FF3B30',
  },
  lessonStatusPending: {
    backgroundColor: '#C7C7CC',
  },
  lessonTitle: {
    fontSize: 14,
    color: '#3C3C43',
  },
  lessonModule: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  lessonStatus: {
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
});

export default GenerationProgress;
