## ADDED Requirements

### Requirement: Track individual lesson generation status
The system SHALL track the generation state of each individual lesson within a course, allowing users to see which lessons are pending, generating, completed, or failed.

#### Scenario: Lessons show individual status
- **WHEN** user views a course during generation
- **THEN** each lesson displays its own status (pending/generating/completed/failed)

#### Scenario: Pending lessons clearly distinguished
- **WHEN** a lesson has not yet been generated
- **THEN** it displays as "Pending" with appropriate visual styling

#### Scenario: Generating lesson highlighted
- **WHEN** a lesson is currently being generated
- **THEN** it displays as "Generating" with a loading indicator

#### Scenario: Completed lessons indicated
- **WHEN** a lesson has been successfully generated
- **THEN** it displays as "Completed" with a checkmark or success indicator

#### Scenario: Failed lessons indicated
- **WHEN** a lesson generation has failed
- **THEN** it displays as "Failed" with an error indicator and reason

### Requirement: Module-level generation status
The system SHALL aggregate lesson status to show module-level progress.

#### Scenario: Module shows aggregate progress
- **WHEN** user views a module during generation
- **THEN** the module displays overall progress based on its lessons

#### Scenario: Module completes when all lessons complete
- **WHEN** all lessons in a module are generated
- **THEN** the module is marked as complete

### Requirement: Lesson status persistence
The system SHALL persist lesson generation status so it survives app restarts and navigation.

#### Scenario: Status persists across navigation
- **WHEN** user navigates away from course detail during generation
- **AND** returns later
- **THEN** the current status of all lessons is preserved

#### Scenario: Status persists across app restart
- **WHEN** user closes and reopens the app
- **AND** returns to a partially generated course
- **THEN** the current status of all lessons is preserved
