## ADDED Requirements

### Requirement: Mobile course detail SHALL provide rich generation progress
The mobile course detail screen SHALL provide richer generation progress comparable to the web app, including progress metrics and lesson-level generation state.

#### Scenario: User views course detail during generation
- **WHEN** a course is still being generated
- **THEN** the course detail screen shows structured generation progress
- **AND** the screen surfaces lesson-level generation state when that data is available

### Requirement: Mobile generation flows SHALL support continue or resume actions
The mobile app SHALL expose generation recovery actions supported by the backend when generation is incomplete or interrupted.

#### Scenario: User resumes interrupted generation
- **WHEN** generation is incomplete or recoverable
- **THEN** the mobile UI presents a continue, retry, or resume action consistent with the current backend state
- **AND** selecting that action restarts or resumes generation feedback

### Requirement: Mobile lesson rows SHALL communicate generation readiness
The mobile app SHALL distinguish between ready lessons and lessons still generating so users can safely continue learning from available content.

#### Scenario: User sees mixed ready and generating lessons
- **WHEN** some lessons are complete and others are still generating
- **THEN** the lesson list shows which lessons are ready
- **AND** the lesson list shows which lessons are pending, generating, or failed
