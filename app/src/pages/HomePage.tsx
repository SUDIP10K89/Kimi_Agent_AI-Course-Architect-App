/**
 * Home Page
 * 
 * Landing page with course generator and recent courses.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import CourseGenerator from '@/components/CourseGenerator';
import Header from '@/components/Layout/Header';
import * as courseApi from '@/api/courseApi';
import type { Course, StatsResponse } from '@/types';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [_isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [recentResponse, statsResponse] = await Promise.all([
        courseApi.getRecentCourses(3),
        courseApi.getCourseStats(),
      ]);

      if (recentResponse.success) {
        setRecentCourses(recentResponse.data.courses);
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered',
      description: 'Advanced AI generates comprehensive courses tailored to your topic',
    },
    {
      icon: BookOpen,
      title: 'Structured Learning',
      description: 'Logical progression from basics to advanced concepts',
    },
    {
      icon: TrendingUp,
      title: 'Track Progress',
      description: 'Monitor your learning journey with detailed progress tracking',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-12 md:py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Learn Anything with{' '}
                <span className="text-primary">AI-Generated Courses</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Enter any topic and our AI will create a complete learning experience
                with lessons, examples, and curated videos.
              </p>
            </div>

            {/* Course Generator */}
            <CourseGenerator />
          </div>
        </section>

        <Separator />

        {/* Stats Section */}
        {stats && (
          <section className="py-12 px-4 bg-muted/50">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                <div className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-primary">
                    {stats.overview.totalCourses}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Courses Created</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-primary">
                    {stats.overview.totalModules}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Modules</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-primary">
                    {stats.overview.totalMicroTopics}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Lessons</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-primary">
                    {Math.round(stats.overview.avgProgress)}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Avg. Progress</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Recent Courses */}
        {recentCourses.length > 0 && (
          <section className="py-12 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Recent Courses</h2>
                <Button variant="ghost" onClick={() => navigate('/courses')}>
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentCourses.map((course) => (
                  <Card
                    key={course._id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/courses/${course._id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary">
                          {course.progress.percentage === 0
                            ? 'Not Started'
                            : course.progress.percentage === 100
                              ? 'Completed'
                              : 'In Progress'}
                        </Badge>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold mb-2 line-clamp-2">{course.title}</h3>
                      <Progress value={course.progress.percentage} className="h-2 mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {course.progress.completedMicroTopics} / {course.progress.totalMicroTopics} lessons completed
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className="py-12 px-4 bg-muted/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>AI Course Architect - Learn anything, anytime</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
