/**
 * Course List Component
 * 
 * Displays a grid of courses with search, filter, and pagination.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Loader2,
  BookOpen,
  MoreVertical,
  Trash2,
  Archive,
  ExternalLink,
  GraduationCap,
  Clock,
  CloudOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Course } from '@/types';
import * as courseApi from '@/api/courseApi';

interface CourseListProps {
  courses: Course[];
  onRefresh: () => void;
  isLoading?: boolean;
}

const CourseList: React.FC<CourseListProps> = ({ courses, onRefresh, isLoading = false }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(courses);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    setIsOffline(!navigator.onLine);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Filter courses based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCourses(courses);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = courses.filter(
      (course) =>
        course.title.toLowerCase().includes(query) ||
        course.topic.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query)
    );
    setFilteredCourses(filtered);
  }, [searchQuery, courses]);

  const handleDelete = async () => {
    if (!courseToDelete) return;

    // Check if offline
    if (!navigator.onLine) {
      alert('Cannot delete course while offline. Please connect to the internet.');
      setCourseToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      await courseApi.deleteCourse(courseToDelete._id);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete course:', error);
    } finally {
      setIsDeleting(false);
      setCourseToDelete(null);
    }
  };

  const handleArchive = async (course: Course) => {
    // Check if offline
    if (!navigator.onLine) {
      alert('Cannot archive course while offline. Please connect to the internet.');
      return;
    }
    
    try {
      await courseApi.archiveCourse(course._id);
      onRefresh();
    } catch (error) {
      console.error('Failed to archive course:', error);
    }
  };

  const getStatusBadge = (progress: number) => {
    if (progress === 0) {
      return <Badge variant="secondary" className="bg-muted text-muted-foreground">Not Started</Badge>;
    } else if (progress === 100) {
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">Completed</Badge>;
    } else {
      return <Badge className="bg-accent text-accent-foreground border-0">In Progress</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex h-20 w-20 rounded-2xl bg-accent items-center justify-center mb-4">
          <BookOpen className="h-10 w-10 text-accent-foreground/50" />
        </div>
        <h3 className="text-lg font-medium mb-2">No courses yet</h3>
        <p className="text-muted-foreground mb-6">
          Generate your first course to start learning
        </p>
        {isOffline ? (
          <p className="text-amber-600 dark:text-amber-400">
            <CloudOff className="inline h-4 w-4 mr-1" />
            You're offline. Connect to internet to create new courses.
          </p>
        ) : (
          <Button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-border/50 focus:border-primary/50"
        />
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No courses match your search</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card
              key={course._id}
              className="group cursor-pointer card-hover relative overflow-hidden border-border/50 hover:border-primary/20 transition-all duration-300"
              onClick={() => navigate(`/courses/${course._id}`)}
            >
              {/* Gradient top border on hover */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    {getStatusBadge(course.progress.percentage)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/courses/${course._id}`);
                      }}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleArchive(course);
                      }}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCourseToDelete(course);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h3>

                {course.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {course.description}
                  </p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-primary">{course.progress.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
                      style={{ width: `${course.progress.percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{course.progress.totalMicroTopics} lessons</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatDate(course.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!courseToDelete} onOpenChange={() => setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{courseToDelete?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseList;
