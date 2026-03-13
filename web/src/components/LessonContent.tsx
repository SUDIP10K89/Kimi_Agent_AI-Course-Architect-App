/**
 * Lesson Content Component
 * 
 * Displays the detailed content for a micro-topic including:
 * - Explanation
 * - Real-world example
 * - Analogy
 * - Key takeaways
 * - Practice questions
 * - Related videos
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Lightbulb, BookOpen, HelpCircle, PlayCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import type { MicroTopic } from '@/types';
import * as courseApi from '@/api/courseApi';
import { useCourse } from '@/contexts/CourseContext';

interface LessonContentProps {
  microTopic: MicroTopic;
  moduleTitle: string;
  courseTitle: string;
  courseId: string;
  moduleId: string;
}

const LessonContent: React.FC<LessonContentProps> = ({
  microTopic,
  moduleTitle,
  courseTitle: _courseTitle,
  courseId,
  moduleId,
}) => {
  const { loadCourse } = useCourse();
  const [isCompleting, setIsCompleting] = useState(false);
  const [isUncompleting, setIsUncompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(!!microTopic?.isCompleted);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  // Update isCompleted when microTopic changes
  useEffect(() => {
    setIsCompleted(!!microTopic?.isCompleted);
  }, [microTopic?.isCompleted]);

  const handleMarkComplete = async () => {
    if (isCompleted) return;

    setIsCompleting(true);
    try {
      await courseApi.completeMicroTopic(courseId, moduleId, microTopic._id);
      setIsCompleted(true);
      loadCourse(courseId);
    } catch (error) {
      console.error('Failed to mark as complete:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleUncomplete = async () => {
    if (!isCompleted) return;

    setIsUncompleting(true);
    try {
      await courseApi.uncompleteMicroTopic(courseId, moduleId, microTopic._id);
      setIsCompleted(false);
      loadCourse(courseId);
    } catch (error) {
      console.error('Failed to undo completion:', error);
    } finally {
      setIsUncompleting(false);
    }
  };

  const toggleQuestion = (index: number) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  // Content not yet generated
  if (!microTopic.content) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="secondary" className="mb-2 bg-accent text-accent-foreground">{moduleTitle}</Badge>
            <h1 className="text-2xl md:text-3xl font-bold">{microTopic.title}</h1>
          </div>
        </div>

        <Card className="border-dashed border-border/50">
          <CardContent className="p-8 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
              <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
              <div className="h-4 bg-muted rounded w-2/3 mx-auto" />
            </div>
            <p className="mt-4 text-muted-foreground">
              Content is being generated. Please check back in a moment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { content, videos } = microTopic;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <Badge variant="secondary" className="mb-2 bg-accent text-accent-foreground">{moduleTitle}</Badge>
          <h1 className="text-2xl md:text-3xl font-bold">{microTopic.title}</h1>
        </div>
        <Button
          onClick={isCompleted ? handleUncomplete : handleMarkComplete}
          disabled={isCompleting || isUncompleting}
          variant={isCompleted ? 'outline' : 'default'}
          className={`self-start ${isCompleted
            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900'
            : 'bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90'
            }`}
        >
          {isCompleting || isUncompleting ? (
            <>
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {isCompleting ? 'Saving...' : 'Undoing...'}
            </>
          ) : isCompleted ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Completed (Click to Undo)
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Complete
            </>
          )}
        </Button>
      </div>

      {/* Explanation */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Explanation</h2>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="prose dark:prose-invert max-w-none">
              {content.explanation.split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-4 last:mb-0 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Real-World Example */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold">Real-World Example</h2>
        </div>
        <Card className="border-l-4 border-l-amber-400 dark:border-l-amber-600 border-border/50">
          <CardContent className="p-6">
            <p className="leading-relaxed">{content.example}</p>
          </CardContent>
        </Card>
      </section>

      {/* Analogy */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">i</span>
          </div>
          <h2 className="text-xl font-semibold">Simple Analogy</h2>
        </div>
        <Card className="border-l-4 border-l-blue-400 dark:border-l-blue-600 border-border/50">
          <CardContent className="p-6">
            <p className="leading-relaxed italic">{content.analogy}</p>
          </CardContent>
        </Card>
      </section>

      {/* Key Takeaways */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Key Takeaways</h2>
        </div>
        <div className="grid gap-3">
          {content.keyTakeaways.map((takeaway, index) => (
            <Card key={index} className="border-l-4 border-l-primary border-border/50">
              <CardContent className="p-4 flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-500 text-white text-sm font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <p className="leading-relaxed">{takeaway}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Practice Questions */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <HelpCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold">Practice Questions</h2>
        </div>
        <div className="space-y-3">
          {content.practiceQuestions.map((qa, index) => (
            <Card key={index} className="overflow-hidden border-border/50">
              <button
                onClick={() => toggleQuestion(index)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3 pr-4">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium flex items-center justify-center">
                    Q{index + 1}
                  </span>
                  <span className="font-medium">{qa.question}</span>
                </div>
                {expandedQuestion === index ? (
                  <ChevronUp className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                )}
              </button>
              {expandedQuestion === index && (
                <>
                  <Separator />
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border-l-4 border-l-emerald-400">
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-1">Answer:</p>
                    <p className="leading-relaxed">{qa.answer}</p>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* Videos */}
      {videos && videos.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <PlayCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold">Related Videos</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <Card key={video.videoId} className="overflow-hidden group border-border/50 card-hover">
                <a
                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block cursor-pointer"
                >
                  <div className="relative aspect-video bg-muted">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlayCircle className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {video.duration && (
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <PlayCircle className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {video.channelTitle}
                    </p>
                  </CardContent>
                </a>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Completion Button (Bottom) */}
      <div className="pt-8 pb-4">
        <Button
          onClick={isCompleted ? handleUncomplete : handleMarkComplete}
          disabled={isCompleting || isUncompleting}
          variant={isCompleted ? 'outline' : 'default'}
          size="lg"
          className={`w-full ${isCompleted
            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900'
            : 'bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-sm hover:shadow-glow transition-all duration-300'
            }`}
        >
          {isCompleting || isUncompleting ? (
            <>
              <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {isCompleting ? 'Saving Progress...' : 'Undoing...'}
            </>
          ) : isCompleted ? (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Completed (Click to Undo)
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Mark Lesson as Complete
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default LessonContent;
