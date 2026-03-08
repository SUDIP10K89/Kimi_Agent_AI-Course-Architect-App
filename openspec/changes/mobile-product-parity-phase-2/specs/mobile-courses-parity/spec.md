## ADDED Requirements

### Requirement: Mobile courses screen SHALL organize courses by learning progress
The mobile courses screen SHALL provide progress-based filtering aligned with the web app's learning model.

#### Scenario: User filters courses by progress state
- **WHEN** a user selects a progress filter
- **THEN** the course list updates to show only courses in the selected state
- **AND** the available states include `all`, `not-started`, `in-progress`, and `completed`

### Requirement: Mobile courses screen SHALL expose archive actions
The mobile courses experience SHALL allow users to archive courses using existing backend support.

#### Scenario: User archives a course
- **WHEN** a user chooses to archive a course from mobile
- **THEN** the app updates the course through the backend archive flow
- **AND** the course list reflects the archived state

### Requirement: Mobile courses screen SHALL show offline and sync cues
The mobile courses experience SHALL communicate when the user is offline and when cached data is being shown.

#### Scenario: User opens courses while offline
- **WHEN** the device is offline and cached course data exists
- **THEN** the courses screen shows cached course data
- **AND** the screen displays an explicit offline indicator or sync-needed message
