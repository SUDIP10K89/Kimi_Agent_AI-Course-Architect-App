## Why

Course generation is the core differentiated flow of the AI Course Architect app. However, the mobile implementation lacks proper progress visibility and recovery mechanisms. Users cannot clearly monitor generation progress, recover from failures, or understand what lessons are being generated. This creates an unreliable product experience and blocks mobile users from the full value of AI-generated courses.

## What Changes

- **Rich Generation Progress UI**: Enhance the progress indicator to show detailed status including current lesson/module being generated, progress percentage, and estimated time remaining
- **Continue/Resume Generation**: Add ability to retry or continue failed generation without losing progress, allowing users to resume from the last successful lesson
- **Better Lesson-Generation State**: Improve state management to track which specific lessons have been generated, failed, or are pending, with clear visual indicators

## Capabilities

### New Capabilities

- `generation-progress-tracker`: Rich progress tracking with detailed status messages, current operation context, and visual progress indicators
- `generation-recovery`: Retry/resume capability for failed generation, preserving already-generated content and continuing from failure point
- `lesson-generation-state`: Granular state tracking for individual lessons within a course (pending, generating, completed, failed)

### Modified Capabilities

- None - these are new capabilities

## Impact

- **Mobile App**: CourseContext.tsx, HomeScreen.tsx, CourseDetailScreen.tsx
- **API**: May need additional endpoints for resume/retry functionality
- **State Management**: Enhanced GenerationStatus type with lesson-level details
