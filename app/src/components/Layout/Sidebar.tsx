/**
 * Sidebar Component
 * 
 * Navigation sidebar showing course modules and micro-topics.
 * Collapsible on mobile devices.
 */

import React from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Circle, PlayCircle, BookOpen } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Course, Module, MicroTopic } from '@/types';

interface SidebarProps {
  course: Course | null;
  currentModuleId?: string;
  currentMicroTopicId?: string;
  onSelectMicroTopic: (moduleId: string, microTopicId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  course,
  currentModuleId,
  currentMicroTopicId,
  onSelectMicroTopic,
  isOpen,
  onClose,
}) => {
  const [expandedModules, setExpandedModules] = React.useState<Set<string>>(new Set());

  // Auto-expand current module
  React.useEffect(() => {
    if (currentModuleId) {
      setExpandedModules((prev) => new Set([...prev, currentModuleId]));
    }
  }, [currentModuleId]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const handleMicroTopicClick = (moduleId: string, microTopicId: string) => {
    onSelectMicroTopic(moduleId, microTopicId);
    onClose();
  };

  if (!course) {
    return (
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 bg-background border-r transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No course selected</p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 bg-background border-r transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Course Header */}
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm line-clamp-2" title={course.title}>
            {course.title}
          </h2>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${course.progress.percentage}%` }}
                />
              </div>
            </div>
            <span>{course.progress.percentage}%</span>
          </div>
        </div>

        {/* Module List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {course.modules.map((module: Module, moduleIndex: number) => (
              <div key={module._id} className="mb-2">
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(module._id)}
                  className={cn(
                    'w-full flex items-center gap-2 p-2 rounded-md text-sm font-medium transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    currentModuleId === module._id && 'bg-accent'
                  )}
                >
                  {expandedModules.has(module._id) ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="text-left flex-1 line-clamp-1">
                    {moduleIndex + 1}. {module.title}
                  </span>
                </button>

                {/* Micro-Topics */}
                {expandedModules.has(module._id) && (
                  <div className="ml-6 mt-1 space-y-1">
                    {module.microTopics.map((topic: MicroTopic) => (
                      <button
                        key={topic._id}
                        onClick={() => handleMicroTopicClick(module._id, topic._id)}
                        className={cn(
                          'w-full flex items-center gap-2 p-2 rounded-md text-xs transition-colors text-left',
                          'hover:bg-accent hover:text-accent-foreground',
                          currentMicroTopicId === topic._id
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'text-muted-foreground'
                        )}
                      >
                        {topic.isCompleted ? (
                          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                        ) : topic.content ? (
                          <PlayCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 flex-shrink-0" />
                        )}
                        <span className="line-clamp-2 flex-1">{topic.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>
    </>
  );
};

export default Sidebar;
