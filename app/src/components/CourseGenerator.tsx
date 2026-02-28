/**
 * Course Generator Component
 * 
 * Input form for generating new courses from a topic.
 * Shows loading state and error handling.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, Loader2, BookOpen, Lightbulb, Code, Brain, Rocket, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import * as courseApi from '@/api/courseApi';

const SUGGESTED_TOPICS = [
  { icon: Brain, label: 'Machine Learning', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  { icon: Code, label: 'React Development', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { icon: Lightbulb, label: 'Design Thinking', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { icon: Rocket, label: 'Startup Strategy', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
];

const CourseGenerator: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [generatedCourseId, setGeneratedCourseId] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Cleanup SSE connection on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);
    setProgressMessage('Starting course generation...');
    setGeneratedCourseId(null);

    try {
      const response = await courseApi.generateCourse(topic.trim());
      
      if (response.success) {
        // Store the course ID and connect to SSE for progress updates
        const courseId = response.data.courseId;
        setGeneratedCourseId(courseId);
        setProgressMessage('Course created! Connecting to progress updates...');
        
        // Connect to SSE for real-time progress
        cleanupRef.current = courseApi.connectToCourseProgress(
          courseId,
          // Progress handler
          (data) => {
            setProgress(data.progress);
            setProgressMessage(data.message);
          },
          // Complete handler
          (_data) => {
            setProgress(100);
            setProgressMessage('Course generation complete!');
            // Navigate to the course after a short delay
            setTimeout(() => {
              navigate(`/courses/${courseId}`);
            }, 1500);
          },
          // Error handler
          (data) => {
            console.error('Generation error:', data.error);
            setError(`Generation error: ${data.error}`);
          }
        );
        
        // Keep the connection open - user can navigate to course when ready
        // For now, just navigate after a reasonable time even if not complete
        setTimeout(() => {
          if (progress < 100) {
            navigate(`/courses/${courseId}`);
          }
        }, 5000); // Navigate after 5 seconds regardless
      } else {
        setError(response.error || 'Failed to generate course');
        setIsGenerating(false);
      }
    } catch (err: unknown) {
      const apiError = err as { error?: string; message?: string };
      if (apiError.error === 'A course for this topic already exists') {
        setError('A course for this topic already exists. Check your courses list.');
      } else {
        setError(apiError.error || apiError.message || 'Failed to generate course. Please try again.');
      }
      setIsGenerating(false);
    }
  };

  const handleSuggestedTopic = (suggestedTopic: string) => {
    setTopic(suggestedTopic);
    setError(null);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="border-2 border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Generate a New Course</CardTitle>
          <CardDescription>
            Enter any topic and our AI will create a comprehensive course with lessons, examples, and videos.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g., Reinforcement Learning, React Hooks, Digital Marketing..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="pl-10 h-12"
                  disabled={isGenerating}
                />
              </div>
              <Button 
                type="submit" 
                disabled={isGenerating || !topic.trim()}
                className="h-12 px-6"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Suggested Topics */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Or try one of these popular topics:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_TOPICS.map(({ icon: Icon, label, color }) => (
                <Badge
                  key={label}
                  variant="secondary"
                  className={`cursor-pointer hover:opacity-80 transition-opacity px-3 py-2 ${color}`}
                  onClick={() => handleSuggestedTopic(label)}
                >
                  <Icon className="h-3.5 w-3.5 mr-1.5" />
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Generation Info with Progress */}
          {isGenerating && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm font-medium">Creating your course...</p>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{progressMessage}</span>
                  <span>{progress}%</span>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                This may take a few minutes. We're generating the outline, lessons, and finding relevant videos.
              </p>
              
              {generatedCourseId && (
                <div className="text-xs text-center text-green-600 flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Course created! Content is being generated in the background.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseGenerator;
