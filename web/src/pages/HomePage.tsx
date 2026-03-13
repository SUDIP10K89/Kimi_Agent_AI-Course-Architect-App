import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, ArrowRight, Sparkles, BookOpen, Video, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Layout/Header';
import CourseGenerator from '@/components/CourseGenerator';
import * as courseApi from '@/api/courseApi';
import type { Course, StatsResponse } from '@/types';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-Powered Content',
    description: 'Our AI crafts structured lessons with real-world examples and analogies.',
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    icon: BookOpen,
    title: 'Structured Learning',
    description: 'Organized into modules and micro-topics for progressive mastery.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Video,
    title: 'Curated Videos',
    description: 'Automatically finds the best YouTube videos for each lesson.',
    gradient: 'from-pink-500 to-rose-500',
  },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [_isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [recentResponse, statsResponse] = await Promise.all([
        courseApi.getRecentCourses(3),
        courseApi.getCourseStats(),
      ]);

      if (recentResponse.success) setRecentCourses(recentResponse.data.courses);
      if (statsResponse.success) setStats(statsResponse.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="hero-gradient relative py-24 md:py-32 px-4 text-center">
          {/* Decorative orbs */}
          <div className="orb orb-1" aria-hidden="true" />
          <div className="orb orb-2" aria-hidden="true" />

          <div className="relative z-10 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-accent text-accent-foreground text-sm font-medium border border-primary/10">
              <Zap className="h-3.5 w-3.5" />
              Powered by AI
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              Master Any Subject with{' '}
              <span className="gradient-text">AI-Generated Courses</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Enter any topic and our AI creates personalized courses with structured lessons,
              practical examples, and curated videos.
            </p>

            {isAuthenticated ? (
              <CourseGenerator />
            ) : (
              <div className="animate-fade-in">
                <Button
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="px-8 h-12 text-base flex items-center justify-center mx-auto bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg hover:shadow-glow transition-all duration-300"
                >
                  Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="mt-4 text-sm text-muted-foreground">
                  No credit card required · Start learning instantly
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Features Section (only for non-authenticated) */}
        {!isAuthenticated && (
          <section className="py-20 px-4 border-t border-border/50">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
                How it works
              </h2>
              <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
                Three simple steps to start your personalized learning journey
              </p>
              <div className="grid gap-6 md:grid-cols-3">
                {FEATURES.map((feature) => (
                  <Card
                    key={feature.title}
                    className="animate-stagger-in group relative overflow-hidden border-border/50 hover:border-primary/20 transition-all duration-300 card-hover cursor-default"
                  >
                    <CardContent className="p-6">
                      <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-br ${feature.gradient} items-center justify-center mb-4 shadow-sm`}>
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Stats Section */}
        {isAuthenticated && stats && (
          <section className="py-12 px-4 border-t border-border/50">
            <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Courses Created', value: stats.overview.totalCourses },
                { label: 'Modules', value: stats.overview.totalModules },
                { label: 'Lessons', value: stats.overview.totalMicroTopics },
                { label: 'Avg. Progress', value: `${Math.round(stats.overview.avgProgress)}%` },
              ].map((stat) => (
                <Card
                  key={stat.label}
                  className="gradient-border text-center hover:shadow-soft transition-shadow duration-300"
                >
                  <CardContent className="p-6">
                    <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Recent Courses */}
        {isAuthenticated && recentCourses.length > 0 && (
          <section className="py-12 px-4">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Recent Courses</h2>
                <Button variant="ghost" onClick={() => navigate('/courses')} className="shrink-0 flex items-center gap-2 text-primary hover:text-primary/80">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentCourses.map((course) => (
                  <Card
                    key={course._id}
                    onClick={() => navigate(`/courses/${course._id}`)}
                    className="cursor-pointer card-hover group relative overflow-hidden border-border/50 hover:border-primary/20 transition-all duration-300"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className={`px-2.5 py-1 rounded-full text-xs font-medium ${course.progress.percentage === 100
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : course.progress.percentage === 0
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-accent text-accent-foreground'
                          }`}>
                          {course.progress.percentage === 0
                            ? 'Not Started'
                            : course.progress.percentage === 100
                              ? 'Completed'
                              : 'In Progress'}
                        </p>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold mb-3 line-clamp-2 group-hover:text-primary transition-colors">{course.title}</h3>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-2">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
                          style={{ width: `${course.progress.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{course.progress.completedMicroTopics} / {course.progress.totalMicroTopics} lessons completed</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            CourseX
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CourseX. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;