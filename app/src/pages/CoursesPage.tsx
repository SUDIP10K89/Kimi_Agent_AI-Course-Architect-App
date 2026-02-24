/**
 * Courses Page
 * 
 * Displays all courses with search, filter, and management options.
 */

import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
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

  useEffect(() => {
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
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Courses</h1>
              <p className="text-muted-foreground mt-1">
                Manage and continue your learning journey
              </p>
            </div>
            <Button onClick={() => navigate('/')}>
              <Plus className="h-4 w-4 mr-2" />
              New Course
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="all">
                All ({getCourseCount('all')})
              </TabsTrigger>
              <TabsTrigger value="not-started">
                New ({getCourseCount('not-started')})
              </TabsTrigger>
              <TabsTrigger value="in-progress">
                Active ({getCourseCount('in-progress')})
              </TabsTrigger>
              <TabsTrigger value="completed">
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
