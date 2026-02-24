/**
 * Course Generator Component
 * 
 * Input form for generating new courses from a topic.
 * Shows loading state and error handling.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, BookOpen, Lightbulb, Code, Brain, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import * as courseApi from '@/api/courseApi';

const SUGGESTED_TOPICS = [
  { icon: Brain, label: 'Machine Learning', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  { icon: Code, label: 'React Development', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { icon: Lightbulb, label: 'Design Thinking', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { icon: Rocket, label: 'Startup Strategy', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
];

const CourseGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await courseApi.generateCourse(topic.trim());
      
      if (response.success) {
        // Navigate to the new course
        navigate(`/courses/${response.data.courseId}`);
      } else {
        setError(response.error || 'Failed to generate course');
      }
    } catch (err: unknown) {
      const apiError = err as { error?: string; message?: string };
      if (apiError.error === 'A course for this topic already exists') {
        setError('A course for this topic already exists. Check your courses list.');
      } else {
        setError(apiError.error || apiError.message || 'Failed to generate course. Please try again.');
      }
    } finally {
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

          {/* Generation Info */}
          {isGenerating && (
            <div className="text-center space-y-2 p-4 bg-muted rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              <p className="text-sm font-medium">Creating your course...</p>
              <p className="text-xs text-muted-foreground">
                This may take a minute. We're generating the outline, lessons, and finding relevant videos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseGenerator;
