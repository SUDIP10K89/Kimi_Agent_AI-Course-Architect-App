## 1. Shared state and storage

- [x] 1.1 Extend shared mobile course state and types for remaining parity behaviors needed by home, courses, generation, and offline flows
- [x] 1.2 Add or update local storage helpers for caching course detail payloads in addition to cached course lists
- [x] 1.3 Add connectivity-aware state or utilities needed for offline indicators and sync-refresh behavior

## 2. Home parity

- [x] 2.1 Update the mobile home screen to show parity-relevant learning stats and recent course behavior
- [x] 2.2 Wire the home screen "view all" control to the full courses list flow
- [x] 2.3 Improve home generation feedback so active generation shows structured progress rather than a generic loading treatment

## 3. Courses parity

- [x] 3.1 Replace archive-first tab organization with progress-based filters aligned to the web app
- [x] 3.2 Add archive actions to the mobile courses experience using the existing backend archive flow
- [x] 3.3 Add explicit offline and cached-data cues to the mobile courses screen

## 4. Generation and course-detail parity

- [x] 4.1 Enrich course detail generation progress with lesson-level state and parity-relevant progress messaging
- [x] 4.2 Add continue, retry, or resume generation controls consistent with backend-supported recovery flows
- [x] 4.3 Update lesson rows so ready, pending, generating, and failed lesson states are clearly distinguished

## 5. Offline experience

- [x] 5.1 Load cached course detail when the user opens a previously viewed course offline
- [x] 5.2 Add explicit offline indicators to supported learning flows that use cached data
- [x] 5.3 Refresh cached data or surface sync-needed feedback when connectivity returns

## 6. Verification

- [ ] 6.1 Verify the home recent-courses and view-all flows work end to end
- [ ] 6.2 Verify progress-based filtering and archive actions on the mobile courses screen
- [ ] 6.3 Verify generation progress and continue/resume behavior on course detail
- [ ] 6.4 Verify cached course detail access and offline indicators during offline usage
