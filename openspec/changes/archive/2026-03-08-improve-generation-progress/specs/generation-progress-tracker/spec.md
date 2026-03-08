## ADDED Requirements

### Requirement: Display rich generation progress
The system SHALL display detailed progress information during course generation, including current operation, progress percentage, and context about what is being generated.

#### Scenario: Progress shows during active generation
- **WHEN** user initiates course generation
- **THEN** the UI displays a progress indicator with percentage and current status message

#### Scenario: Progress updates in real-time
- **WHEN** the generation status poll returns new progress data
- **THEN** the UI updates immediately to reflect current generation state

#### Scenario: Progress shows current lesson context
- **WHEN** a lesson is actively being generated
- **THEN** the progress indicator displays the name of the current lesson and module

### Requirement: Progress percentage accuracy
The system SHALL calculate and display an accurate percentage based on completed lessons versus total lessons.

#### Scenario: Percentage reflects actual progress
- **WHEN** generation is 5 lessons complete out of 10 total
- **THEN** the progress indicator displays 50%

#### Scenario: Percentage updates as lessons complete
- **WHEN** generation completes lesson 6 of 10
- **THEN** the progress updates from 50% to 60%

### Requirement: Generation complete notification
The system SHALL clearly indicate when generation is complete and the course is ready.

#### Scenario: Generation completes successfully
- **WHEN** all lessons have been generated
- **THEN** the progress indicator shows 100% and displays "Complete" message
- **AND** the course becomes accessible for viewing

### Requirement: Generation failure notification
The system SHALL clearly indicate when generation has failed and provide error information.

#### Scenario: Generation fails
- **WHEN** generation encounters an error
- **THEN** the UI displays a failure message with the reason
- **AND** provides options to retry or resume generation
