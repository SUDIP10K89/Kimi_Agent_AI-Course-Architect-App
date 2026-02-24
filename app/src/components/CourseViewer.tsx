/**
 * Course Viewer Component
 * 
 * Displays the full course content with sidebar navigation.
 * Shows lesson content, videos, and progress tracking.
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useCourse } from '@/contexts/CourseContext';
import Header from './Layout/Header';
import Sidebar from './Layout/Sidebar';
import LessonContent from './LessonContent';
import { cn } from '@/lib/utils';

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
  } = useCourse();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState<string>('');
  const [currentMicroTopicId, setCurrentMicroTopicId] = useState<string>('');

  // Load course on mount
  useEffect(() => {
    if (courseId) {
      loadCourse(courseId);
    }
  }, [courseId, loadCourse]);

  // Start polling for generation status
  useEffect(() => {
    if (courseId && generationStatus && !generationStatus.isComplete) {
      pollGenerationStatus(courseId);
    }
  }, [courseId, generationStatus?.isComplete]);

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

  // Get current micro-topic
  const currentModule = currentCourse?.course.modules.find((m) => m._id === currentModuleId);
  const currentMicroTopic = currentModule?.microTopics.find((t) => t._id === currentMicroTopicId);

  // Loading state
  if (isLoading && !currentCourse) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-lg font-medium">Loading course...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !currentCourse) {
    return (
      <div className="min-h-screen flex flex-col">
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
      <div className="min-h-screen flex flex-col">
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
    <div className="min-h-screen flex flex-col">
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
            <div className="sticky top-0 z-30 bg-background border-b p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Generating course content...</span>
                  <span className="text-sm text-muted-foreground">
                    {generationStatus.generatedCount} / {generationStatus.totalCount}
                  </span>
                </div>
                <Progress value={generationStatus.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  We're generating lessons and finding videos. You can start learning while we work!
                </p>
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
