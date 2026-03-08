## Context

The mobile app now has a separate active change for settings parity, but it still lags behind the web product across the core learning journey:

- home dashboard visibility and navigation
- progress-based course management
- rich generation progress and recovery
- offline course access and sync feedback

These gaps span multiple screens, shared context state, API integrations, and local caching behavior. A single-screen implementation would produce inconsistent UX, so this change needs a coordinated design across home, courses, course detail, and storage layers.

## Goals / Non-Goals

**Goals:**

- Bring the mobile home, courses, and course-detail flows closer to the current web experience.
- Add progress-based filtering and archive flows that match the web app's mental model.
- Improve lesson-generation visibility and recovery on mobile with richer status and continue/resume behavior.
- Expand offline support from list caching only to course-detail access and explicit offline/sync messaging.

**Non-Goals:**

- Re-implementing settings parity already tracked in `mobile-settings-parity`.
- Introducing a full push-notification system if the backend and platform flow are not already in place.
- Redesigning the entire mobile UI or replacing current navigation architecture.
- Adding backend APIs unless an existing parity gap cannot be solved with current endpoints.

## Decisions

### 1. Treat parity as capability alignment, not pixel matching

Mobile will match the web app's behaviors and flows, but the layouts will remain native to mobile. The design target is capability parity, not literal UI duplication.

Rationale:

- Mobile constraints differ from desktop/web.
- The important gap is missing product behavior, not visual divergence.

Alternative considered:

- Recreate the web page structure directly in React Native.
  Rejected because it adds complexity without improving mobile usability.

### 2. Keep generation state centralized in `CourseContext`

Home, courses, and course-detail generation feedback will continue to use shared course/generation state from `CourseContext`, extended as needed for lesson-level progress and recovery controls.

Rationale:

- Generation can be surfaced in multiple screens at once.
- Shared state reduces inconsistent polling and duplicate recovery logic.

Alternative considered:

- Keep screen-local generation logic per screen.
  Rejected because parity features would diverge quickly and make recovery flows fragile.

### 3. Add layered offline support instead of all-or-nothing offline mode

Offline support will be expanded in layers:

- cached course lists
- cached course detail payloads
- explicit offline indicators and sync-needed messaging
- safe read access to cached content while offline

Rationale:

- This is the highest-value offline improvement without requiring a full offline mutation engine.
- It makes course consumption resilient even if write actions still require connectivity.

Alternative considered:

- Full offline-first architecture with queued mutations and background sync for all course actions.
  Rejected for this phase because it is broader than the parity gaps identified.

### 4. Archive and filtering behavior will align to learning progress first

The mobile courses list will prioritize web-style progress states (`all`, `not-started`, `in-progress`, `completed`) while still exposing archive behavior as a management action rather than as the primary tab model.

Rationale:

- This matches the web app's learning-oriented organization.
- Archive is still useful, but it is secondary to progress-based continuation.

Alternative considered:

- Keep `all/active/archived` as the main mobile model.
  Rejected because it preserves the current parity gap.

## Risks / Trade-offs

- [More shared state may increase coupling] → Keep parity logic concentrated in `CourseContext` and use focused presentational components for UI.
- [Offline cache can become stale] → Show explicit offline/sync messaging and refresh cached data when connectivity returns.
- [Resume/continue UX depends on backend consistency] → Reuse existing generation status endpoints and only surface controls supported by the current API.
- [Scope can sprawl across too many small gaps] → Group work by capability and keep settings out of this change to avoid overlap.

## Migration Plan

1. Extend shared mobile types/state for remaining parity behaviors.
2. Update home and courses flows first because they shape navigation and entry points.
3. Add richer generation UI and recovery controls in course detail.
4. Expand caching and offline indicators once the primary flows are stable.
5. Validate archive/filter/offline flows against existing backend endpoints before marking the change complete.

## Open Questions

- Should archive actions live only in the courses list, or also in course detail for mobile convenience?
- Should offline sync cues be passive banners only, or should the UI also show a pending action count?
- If notifications are still desired later, should they be tracked as a separate follow-up change rather than folded into offline parity?
