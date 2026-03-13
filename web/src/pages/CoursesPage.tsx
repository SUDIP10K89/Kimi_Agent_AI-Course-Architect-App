/**
 * Courses Page
 * 
 * Displays all courses with search, filter, and management options.
 * Supports offline mode with cached courses.
 */

import React, { useEffect, useState } from 'react';
import { Plus, CloudOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CourseList from '@/components/CourseList';
import Header from '@/components/Layout/Header';
import { useCourse } from '@/contexts/CourseContext';

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { courses, refreshCourses, isLoading } = useCourse();
  const [activeTab, setActiveTab] = useState('all');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      refreshCourses(); // Refresh when back online
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshCourses]);

  useEffect(() => {
    // If offline, skip API call and let the context load cached data
    if (!navigator.onLine) {
      return;
    }
    refreshCourses();
  }, [refreshCourses]);

  const filterCourses = (status: string) => {
    if (status === 'all') return courses;
    if (status === 'not-started') return courses.filter((c) => c.progress.percentage === 0);
    if (status === 'in-progress') return courses.filter((c) => c.progress.percentage > 0 && c.progress.percentage < 100);
    if (status === 'completed') return courses.filter((c) => c.progress.percentage === 100);
    return courses;
  };

  const getCourseCount = (status: string) => {
    return filterCourses(status).length;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Offline Indicator */}
          {isOffline && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <CloudOff className="w-4 h-4" />
              <span className="text-sm">You're offline. Showing cached courses. Connect to internet to sync.</span>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">
                <span className="gradient-text">My Courses</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage and continue your learning journey
              </p>
            </div>
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-sm hover:shadow-glow transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Course
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-md bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="all" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                All ({getCourseCount('all')})
              </TabsTrigger>
              <TabsTrigger value="not-started" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                New ({getCourseCount('not-started')})
              </TabsTrigger>
              <TabsTrigger value="in-progress" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Active ({getCourseCount('in-progress')})
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Done ({getCourseCount('completed')})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <CourseList
                courses={courses}
                onRefresh={refreshCourses}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="not-started" className="mt-6">
              <CourseList
                courses={filterCourses('not-started')}
                onRefresh={refreshCourses}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="in-progress" className="mt-6">
              <CourseList
                courses={filterCourses('in-progress')}
                onRefresh={refreshCourses}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              <CourseList
                courses={filterCourses('completed')}
                onRefresh={refreshCourses}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default CoursesPage;
