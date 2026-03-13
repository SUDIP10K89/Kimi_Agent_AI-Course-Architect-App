/**
 * Course Viewer Component
 * 
 * Displays the full course content with sidebar navigation.
 * Shows lesson content, videos, and progress tracking.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, RefreshCw, PlayCircle, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useCourse } from '@/contexts/CourseContext';
import Header from './Layout/Header';
import Sidebar from './Layout/Sidebar';
import LessonContent from './LessonContent';
import { cn } from '@/lib/utils';
import * as courseApi from '@/api/courseApi';

const CourseViewer: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const {
    currentCourse,
    loadCourse,
    isLoading,
    error,
    clearError,
    generationStatus,
    pollGenerationStatus,
    stopPolling,
  } = useCourse();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState<string>('');
  const [currentMicroTopicId, setCurrentMicroTopicId] = useState<string>('');
  const [isContinuing, setIsContinuing] = useState(false);
  const pollingStartedRef = useRef(false);

  // Find the first microtopic that doesn't have content (currently being generated)
  const currentGeneratingMicroTopic = React.useMemo(() => {
    if (!currentCourse?.course || generationStatus?.isComplete) return null;

    for (const module of currentCourse.course.modules) {
      for (const topic of module.microTopics) {
        if (!topic.content || topic.videos.length === 0) {
          return { title: topic.title, moduleTitle: module.title };
        }
      }
    }
    return null;
  }, [currentCourse, generationStatus?.isComplete]);

  // Load course on mount
  useEffect(() => {
    if (courseId) {
      loadCourse(courseId);
    }
  }, [courseId, loadCourse]);

  // Start polling for generation status only once when not complete and not failed
  useEffect(() => {
    if (courseId && generationStatus && !generationStatus.isComplete && !generationStatus.failed && !pollingStartedRef.current) {
      pollingStartedRef.current = true;
      pollGenerationStatus(courseId);
    }

    // Stop polling if generation has failed
    if (generationStatus?.failed) {
      stopPolling();
    }

    // Cleanup: stop polling when component unmounts
    return () => {
      stopPolling();
    };
  }, [courseId, generationStatus?.isComplete, generationStatus?.failed]);

  // Set initial micro-topic when course loads
  useEffect(() => {
    if (currentCourse?.course && !currentMicroTopicId) {
      const firstModule = currentCourse.course.modules[0];
      if (firstModule) {
        setCurrentModuleId(firstModule._id);
        const firstTopic = firstModule.microTopics[0];
        if (firstTopic) {
          setCurrentMicroTopicId(firstTopic._id);
        }
      }
    }
  }, [currentCourse, currentMicroTopicId]);

  const handleSelectMicroTopic = (moduleId: string, microTopicId: string) => {
    setCurrentModuleId(moduleId);
    setCurrentMicroTopicId(microTopicId);
  };

  const handleRetry = () => {
    if (courseId) {
      clearError();
      loadCourse(courseId);
    }
  };

  const handleContinueGeneration = async () => {
    if (!courseId) return;

    setIsContinuing(true);
    try {
      const response = await courseApi.continueCourseGeneration(courseId);

      if (response.success) {
        courseApi.connectToCourseProgress(
          courseId,
          (data) => {
            console.log('Continue progress:', data);
          },
          () => {
            loadCourse(courseId);
            setIsContinuing(false);
          },
          (data) => {
            console.error('Continue error:', data.error);
            setIsContinuing(false);
            stopPolling();
            toast.error(data.error, { description: 'Generation stopped' });
          },
          (data) => {
            toast.warning(data.message, { description: 'Generation will continue' });
          }
        );
      }
    } catch (error) {
      console.error('Failed to continue generation:', error);
      setIsContinuing(false);
    }
  };

  // Get current micro-topic
  const currentModule = currentCourse?.course.modules.find((m) => m._id === currentModuleId);
  const currentMicroTopic = currentModule?.microTopics.find((t) => t._id === currentMicroTopicId);

  // Loading state
  if (isLoading && !currentCourse) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-purple-500 items-center justify-center shadow-glow animate-pulse-soft">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <p className="text-lg font-medium">Loading course...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !currentCourse) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>{error}</p>
              <Button onClick={handleRetry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // No course found
  if (!currentCourse?.course) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Course Not Found</AlertTitle>
            <AlertDescription>
              The course you're looking for doesn't exist or has been removed.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const { course } = currentCourse;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} isMenuOpen={sidebarOpen} />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          course={course}
          currentModuleId={currentModuleId}
          currentMicroTopicId={currentMicroTopicId}
          onSelectMicroTopic={handleSelectMicroTopic}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-background">
          {/* Generation Progress Bar */}
          {generationStatus && !generationStatus.isComplete && (
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/50 p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Generating course content...</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground font-medium">
                      {generationStatus.generatedCount} / {generationStatus.totalCount}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleContinueGeneration}
                      disabled={isContinuing}
                      className="border-border/50"
                    >
                      {isContinuing ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <PlayCircle className="h-4 w-4 mr-1" />
                      )}
                      {isContinuing ? 'Continuing...' : 'Continue'}
                    </Button>
                  </div>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
                    style={{ width: `${generationStatus.percentage}%` }}
                  />
                </div>
                {currentGeneratingMicroTopic && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <span className="animate-pulse text-primary">●</span>
                    Currently generating: <span className="font-medium text-foreground">{currentGeneratingMicroTopic.title}</span>
                  </p>
                )}
                {!currentGeneratingMicroTopic && generationStatus?.failed && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                    ⚠️ Generation stopped due to error. Click "Continue" to resume.
                  </p>
                )}
                {!currentGeneratingMicroTopic && !generationStatus?.isComplete && !generationStatus?.failed && (
                  <p className="text-xs text-muted-foreground mt-2">
                    We're generating lessons and finding videos. You can start learning while we work!
                  </p>
                )}
                {!currentGeneratingMicroTopic && generationStatus?.isComplete && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                    ✓ Course generation complete. Start learning now!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Lesson Content */}
          <div className={cn(
            "p-4 md:p-8",
            generationStatus && !generationStatus.isComplete ? "pt-4" : "pt-8"
          )}>
            <div className="max-w-4xl mx-auto">
              {currentMicroTopic ? (
                <LessonContent
                  microTopic={currentMicroTopic}
                  moduleTitle={currentModule?.title || ''}
                  courseTitle={course.title}
                  courseId={course._id}
                  moduleId={currentModuleId}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex h-16 w-16 rounded-2xl bg-accent items-center justify-center mb-4">
                    <GraduationCap className="h-8 w-8 text-accent-foreground/50" />
                  </div>
                  <p className="text-muted-foreground">Select a topic from the sidebar to start learning</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CourseViewer;
