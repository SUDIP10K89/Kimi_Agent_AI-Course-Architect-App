## ADDED Requirements

### Requirement: Mobile home screen SHALL provide parity-relevant learning overview
The mobile home screen SHALL present a learning overview comparable to the web home experience, including summary stats and recent courses that help users quickly continue learning.

#### Scenario: Home screen shows parity-relevant stats
- **WHEN** an authenticated user opens the mobile home screen
- **THEN** the app shows current learning summary information derived from course stats
- **AND** the summary includes the primary progress indicators needed to continue learning

#### Scenario: Home screen shows recent courses
- **WHEN** recent courses are available
- **THEN** the home screen shows a recent courses section
- **AND** selecting a recent course opens that course in mobile

### Requirement: Mobile home screen SHALL support navigation to the full courses list
The mobile home screen SHALL provide a working entry point from recent courses to the full courses list.

#### Scenario: User selects view-all from home
- **WHEN** a user taps the home screen control for viewing all courses
- **THEN** the app navigates to the full courses list screen

### Requirement: Mobile home screen SHALL show generation feedback beyond a generic loading message
The mobile home screen SHALL show meaningful course-generation progress feedback while a course is being generated.

#### Scenario: Home screen shows active generation progress
- **WHEN** a course generation is in progress
- **THEN** the home screen shows structured generation feedback
- **AND** the feedback reflects current generation state rather than a generic spinner only
