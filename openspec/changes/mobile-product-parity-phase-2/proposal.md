## Why

The mobile app still lags behind the web experience in the learning flows users touch most often: dashboard visibility, course organization, generation progress, and offline behavior. These gaps make the mobile app feel incomplete even after the settings parity work, and they now block broader product adoption on mobile.

## What Changes

- Bring the mobile home experience closer to the web app by improving stats, recent courses behavior, generation feedback, and the missing "view all" navigation flow.
- Add mobile courses-page parity for progress-based filtering, archive actions, and explicit offline/sync cues.
- Improve course detail and lesson-generation UX with richer progress feedback, resume/continue controls, and more informative per-lesson generation state.
- Add mobile offline experience improvements, including cached course detail access, explicit offline messaging, and groundwork for sync/notification behavior.
- Preserve `mobile-settings-parity` as the source of truth for settings-specific work and avoid duplicating that change in this proposal.

## Capabilities

### New Capabilities
- `mobile-home-parity`: Home/dashboard parity for recent courses, stats presentation, and course generation feedback/navigation.
- `mobile-courses-parity`: Courses list parity for progress-based organization, archive actions, and offline-aware course management.
- `mobile-generation-parity`: Rich course-generation progress, resume/continue flows, and lesson-level generation status across mobile learning screens.
- `mobile-offline-experience`: Mobile offline behavior for course detail caching, offline indicators, and sync-related user feedback.

### Modified Capabilities

## Impact

- Affected code: `mobile/src/screens/HomeScreen.tsx`, `mobile/src/screens/CoursesListScreen.tsx`, `mobile/src/screens/CourseDetailScreen.tsx`, `mobile/src/contexts/CourseContext.tsx`, `mobile/src/api/courseApi.ts`, and supporting mobile components.
- APIs: existing course list/detail/status/archive/continue endpoints and any existing backend support for course caching/resume flows.
- Systems: mobile navigation flows, offline storage strategy, generation progress state, and archive/offline user experience.
