## ADDED Requirements

### Requirement: Retry failed generation
The system SHALL allow users to retry course generation when it fails, without requiring the user to re-enter the course topic.

#### Scenario: User retries failed generation
- **WHEN** generation has failed and user taps "Retry" button
- **THEN** the system initiates a new generation attempt for the same course

#### Scenario: Retry preserves user intent
- **WHEN** user retries a failed course
- **THEN** the original topic and parameters are preserved automatically

### Requirement: Resume interrupted generation
The system SHALL allow users to resume generation from the last successfully generated lesson, skipping already-completed lessons.

#### Scenario: User resumes partial generation
- **WHEN** generation failed but some lessons completed successfully
- **AND** user taps "Resume" button
- **THEN** the system continues generation starting from the first incomplete lesson

#### Scenario: Resume skips completed lessons
- **WHEN** user resumes a partially complete course
- **THEN** the already-generated lessons are preserved
- **AND** only remaining lessons are generated

### Requirement: Generation recovery state preservation
The system SHALL preserve the state of partially generated courses so users can return to them later.

#### Scenario: User leaves and returns to partial course
- **WHEN** user navigates away from a course that is partially generated
- **AND** returns to the course later
- **THEN** the current generation state is displayed
- **AND** options to resume are available

### Requirement: Clear recovery options UI
The system SHALL provide clear, accessible options for users to retry or resume generation when applicable.

#### Scenario: Recovery options displayed on failure
- **WHEN** generation has failed
- **THEN** the UI shows both "Retry" and "Resume" options
- **AND** the current progress status is clearly visible
