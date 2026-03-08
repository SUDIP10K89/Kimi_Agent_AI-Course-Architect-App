## ADDED Requirements

### Requirement: Mobile app SHALL cache course detail for offline reading
The mobile app SHALL cache course detail payloads needed for offline access to previously opened course content.

#### Scenario: User opens a previously cached course while offline
- **WHEN** the device is offline and the user opens a course that was previously cached
- **THEN** the app loads the cached course detail
- **AND** the user can read available course content without a network connection

### Requirement: Mobile app SHALL provide explicit offline feedback in learning flows
The mobile app SHALL make offline state visible in the relevant screens instead of failing silently.

#### Scenario: User enters a learning screen while offline
- **WHEN** a user opens a supported screen while offline
- **THEN** the app displays an explicit offline indicator or message
- **AND** the message explains whether the user is seeing cached data

### Requirement: Mobile app SHALL surface sync-needed cues for stale or deferred state
The mobile app SHALL surface user-facing sync cues when the app is offline or when data may need refreshing after connectivity returns.

#### Scenario: Connectivity returns after offline usage
- **WHEN** the device reconnects after offline usage
- **THEN** the app refreshes relevant course data or prompts that sync is occurring
- **AND** the user is informed that cached data is being updated
