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

import React, { useState } from 'react';
import { CheckCircle2, Lightbulb, BookOpen, HelpCircle, PlayCircle, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import type { MicroTopic } from '@/types';
import * as courseApi from '@/api/courseApi';

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
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(microTopic.isCompleted);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const handleMarkComplete = async () => {
    if (isCompleted) return;

    setIsCompleting(true);
    try {
      await courseApi.completeMicroTopic(courseId, moduleId, microTopic._id);
      setIsCompleted(true);
    } catch (error) {
      console.error('Failed to mark as complete:', error);
    } finally {
      setIsCompleting(false);
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
            <Badge variant="secondary" className="mb-2">{moduleTitle}</Badge>
            <h1 className="text-2xl md:text-3xl font-bold">{microTopic.title}</h1>
          </div>
        </div>

        <Card className="border-dashed">
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
          <Badge variant="secondary" className="mb-2">{moduleTitle}</Badge>
          <h1 className="text-2xl md:text-3xl font-bold">{microTopic.title}</h1>
        </div>
        <Button
          onClick={handleMarkComplete}
          disabled={isCompleted || isCompleting}
          variant={isCompleted ? 'outline' : 'default'}
          className="self-start"
        >
          {isCompleted ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Completed
            </>
          ) : isCompleting ? (
            <>
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving...
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
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Explanation</h2>
        </div>
        <Card>
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
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h2 className="text-xl font-semibold">Real-World Example</h2>
        </div>
        <Card className="bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-6">
            <p className="leading-relaxed">{content.example}</p>
          </CardContent>
        </Card>
      </section>

      {/* Analogy */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 text-xs font-bold">
            i
          </div>
          <h2 className="text-xl font-semibold">Simple Analogy</h2>
        </div>
        <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <p className="leading-relaxed italic">{content.analogy}</p>
          </CardContent>
        </Card>
      </section>

      {/* Key Takeaways */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Key Takeaways</h2>
        <div className="grid gap-3">
          {content.keyTakeaways.map((takeaway, index) => (
            <Card key={index} className="border-l-4 border-l-primary">
              <CardContent className="p-4 flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
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
          <HelpCircle className="h-5 w-5 text-green-500" />
          <h2 className="text-xl font-semibold">Practice Questions</h2>
        </div>
        <div className="space-y-3">
          {content.practiceQuestions.map((qa, index) => (
            <Card key={index} className="overflow-hidden">
              <button
                onClick={() => toggleQuestion(index)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3 pr-4">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm font-medium flex items-center justify-center">
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
                  <div className="p-4 bg-green-50/50 dark:bg-green-900/10">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Answer:</p>
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
            <PlayCircle className="h-5 w-5 text-red-500" />
            <h2 className="text-xl font-semibold">Related Videos</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <Card key={video.videoId} className="overflow-hidden group">
                <a
                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
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
          onClick={handleMarkComplete}
          disabled={isCompleted || isCompleting}
          variant={isCompleted ? 'outline' : 'default'}
          size="lg"
          className="w-full"
        >
          {isCompleted ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              Lesson Completed
            </>
          ) : isCompleting ? (
            <>
              <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving Progress...
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
