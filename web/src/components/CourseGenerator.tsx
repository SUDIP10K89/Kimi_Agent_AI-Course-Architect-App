import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, Loader2, BookOpen, Brain, Code, Lightbulb, Rocket, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import * as courseApi from '@/api/courseApi';

const SUGGESTED_TOPICS = [
  { icon: Brain, label: 'Machine Learning', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800' },
  { icon: Code, label: 'React Development', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800' },
  { icon: Lightbulb, label: 'Design Thinking', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800' },
  { icon: Rocket, label: 'Startup Strategy', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' },
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

  useEffect(() => () => cleanupRef.current?.(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return navigate('/login');
    if (!topic.trim()) return setError('Please enter a topic');

    setIsGenerating(true);
    setError(null);
    setProgress(0);
    setProgressMessage('Starting course generation...');
    setGeneratedCourseId(null);

    try {
      const response = await courseApi.generateCourse(topic.trim());
      if (response.success) {
        const courseId = response.data.courseId;
        setGeneratedCourseId(courseId);
        setProgressMessage('Course created! Generating content...');

        cleanupRef.current = courseApi.connectToCourseProgress(
          courseId,
          (data) => { setProgress(data.progress); setProgressMessage(data.message); },
          (_data) => {
            setProgress(100); setProgressMessage('Course generation complete!');
            setTimeout(() => navigate(`/courses/${courseId}`), 1500);
          },
          (data) => {
            setError(data.error);
            setIsGenerating(false);
            toast.error(data.error, { description: 'Course generation stopped' });
          },
          (data) => {
            toast.warning(data.message, { description: 'Generation will continue' });
          }
        );

      } else {
        setError(response.error || 'Failed to generate course');
        setIsGenerating(false);
      }
    } catch (err: unknown) {
      setError('Failed to generate course. Please try again.');
      setIsGenerating(false);
    }
  };

  const handleSuggestedTopic = (label: string) => { setTopic(label); setError(null); };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="relative overflow-hidden border-border/50 shadow-lg">
        {/* Gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

        <CardHeader className="text-center pb-4 pt-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center mb-4 shadow-glow">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Generate a New Course</CardTitle>
          <CardDescription className="mt-2">
            Enter a topic and our AI will create lessons, examples, and videos.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g., Reinforcement Learning, React Hooks..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="pl-10 h-12 border-border/50 focus:border-primary/50"
                  disabled={isGenerating}
                />
              </div>
              <Button
                type="submit"
                disabled={isGenerating || !topic.trim()}
                className="h-12 px-6 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-sm hover:shadow-glow transition-all duration-300"
              >
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" />Generate</>
                )}
              </Button>
            </div>
          </form>

          {!isGenerating && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-medium mb-3">Popular Topics:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_TOPICS.map(({ icon: Icon, label, color }) => (
                  <button
                    key={label}
                    className={`cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-full ${color} hover:scale-[1.03] active:scale-[0.98] transition-transform duration-150`}
                    onClick={() => handleSuggestedTopic(label)}
                  >
                    <Icon className="h-3.5 w-3.5" />{label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="space-y-4 p-6 bg-accent/50 rounded-xl border border-primary/10">
              <div className="flex items-center justify-center gap-3">
                <div className="relative h-6 w-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
                <p className="text-sm font-medium">Creating your course...</p>
              </div>
              <div className="relative">
                <Progress value={progress} className="h-2" />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progressMessage}</span>
                <span className="font-semibold text-primary">{progress}%</span>
              </div>
              {generatedCourseId && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />Course created! Generating content...
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