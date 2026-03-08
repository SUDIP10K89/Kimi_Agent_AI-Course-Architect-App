## 1. Type Definitions

- [x] 1.1 Add LessonGenerationStatus interface to mobile/src/types/index.ts
- [x] 1.2 Extend GenerationStatus interface with lessons array and lastGeneratedLessonId
- [x] 1.3 Update CourseWithStatus type if needed

## 2. API Integration

- [x] 2.1 Add retryCourse function to courseApi.ts
- [x] 2.2 Add resumeCourse function to courseApi.ts
- [x] 2.3 Update types in courseApi.ts to match new API responses

## 3. CourseContext Enhancements

- [x] 3.1 Add generation state for lessons in CourseContext
- [x] 3.2 Add retryGeneration action to CourseContext
- [x] 3.3 Add resumeGeneration action to CourseContext
- [x] 3.4 Update pollGenerationStatus to handle lesson-level data

## 4. UI Components

- [x] 4.1 Create GenerationProgress component in mobile/src/components/
- [x] 4.2 Add LessonStatusIndicator component for individual lesson status
- [x] 4.3 Add ModuleProgress component for module-level aggregation
- [x] 4.4 Add RetryResumeButtons component for failed state UI

## 5. Screen Updates

- [x] 5.1 Update HomeScreen to use new GenerationProgress component
- [x] 5.2 Update CourseDetailScreen to show lesson-level status
- [x] 5.3 Integrate retry/resume buttons in failure state
- [x] 5.4 Update lesson list to show individual lesson status

## 6. Testing

- [x] 6.1 Test progress display during generation
- [x] 6.2 Test retry functionality after failure
- [x] 6.3 Test resume functionality from partial generation
- [x] 6.4 Test status persistence across navigation
- [x] 6.5 Test graceful degradation if lesson details unavailable
