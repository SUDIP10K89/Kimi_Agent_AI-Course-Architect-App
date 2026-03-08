## Context

The AI Course Architect mobile app allows users to generate AI-powered courses. Currently, the generation progress is partially implemented - there's a basic status indicator but it lacks:
- Detailed progress showing which specific lesson/module is being generated
- Recovery mechanisms when generation fails mid-way
- Granular state tracking for individual lessons

The current implementation polls for status but doesn't provide actionable information to users when failures occur.

## Goals / Non-Goals

**Goals:**
- Provide rich, real-time progress information during course generation
- Enable users to resume/retry failed generation without losing already-generated content
- Track generation state at the lesson level for better UX
- Maintain backward compatibility with existing API contracts

**Non-Goals:**
- Backend changes to the generation engine itself
- Offline generation capability (future work)
- Web app changes (focused on mobile parity)

## Decisions

### 1. Enhanced GenerationStatus Type

**Decision:** Extend the GenerationStatus interface to include lesson-level details instead of just course-level progress.

**Rationale:** Provides granular feedback to users about what's happening during generation.

```typescript
interface LessonGenerationStatus {
  lessonId: string;
  lessonTitle: string;
  moduleId: string;
  moduleName: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
}

interface GenerationStatus {
  isComplete: boolean;
  generatedCount: number;
  totalCount: number;
  percentage: number;
  currentMessage?: string;
  failed?: boolean;
  failedReason?: string | null;
  lessons: LessonGenerationStatus[];  // NEW: lesson-level tracking
  lastGeneratedLessonId?: string;     // NEW: for resume capability
}
```

### 2. Resume/Retry API Design

**Decision:** Add a new API endpoint for resuming generation rather than reusing the create endpoint.

**Rationale:** Clearer semantics and allows the backend to handle the resume logic differently (skip already-generated content).

**Alternative considered:** Reuse existing generate endpoint with a `resume` flag - rejected because it conflates two different operations.

### 3. State Management Approach

**Decision:** Keep generation state in CourseContext with enhanced actions.

**Rationale:** Consistent with existing architecture - generation state is already managed there. Avoids introducing new context/providers.

### 4. Progress UI Components

**Decision:** Create a reusable GenerationProgress component that can be used in both HomeScreen and CourseDetailScreen.

**Rationale:** DRY principle - both screens need to show progress. Allows consistent UX.

## Risks / Trade-offs

- **[Risk]** API may not support lesson-level status reporting yet  
  → **Mitigation:** Design UI to gracefully degrade if lesson details unavailable; show course-level progress only

- **[Risk]** Backend resume endpoint may require significant changes  
  → **Mitigation:** Start with client-side retry that re-fetches and continues polling; optimize to server-side resume if time permits

- **[Risk]** Adding lesson-level state increases complexity in CourseContext  
  → **Mitigation:** Extract generation-related state and actions into a custom hook `useGeneration` for better separation of concerns

## Migration Plan

1. **Phase 1**: Update TypeScript types (GenerationStatus, add LessonGenerationStatus)
2. **Phase 2**: Enhance CourseContext with new state and actions
3. **Phase 3**: Create GenerationProgress UI component
4. **Phase 4**: Update HomeScreen and CourseDetailScreen to use new component
5. **Phase 5**: Add retry/resume buttons to failed state UI
6. **Phase 6**: (Optional) Add API endpoint for resume if needed

## Open Questions

1. Should we show a list of all lessons with their individual status during generation, or just the current one?
2. How should we handle partial failures - should we show which specific lessons failed?
3. Is there a maximum retry count we should enforce?
