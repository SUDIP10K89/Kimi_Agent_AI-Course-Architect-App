## ADDED Requirements

### Requirement: Mobile settings screen SHALL load persisted settings
The mobile application SHALL load the authenticated user's persisted settings when the settings screen is opened. The loaded data SHALL include account display information and AI provider settings needed to render the mobile settings form.

#### Scenario: Settings screen loads persisted values
- **WHEN** an authenticated user opens the mobile settings screen
- **THEN** the app loads the user's current settings from the backend
- **AND** the screen displays the saved model, base URL, custom provider enabled state, and whether an API key already exists

#### Scenario: Settings load shows a recoverable error
- **WHEN** the settings request fails
- **THEN** the app shows an error state or message on the settings screen
- **AND** the user remains able to retry or leave the screen without corrupting existing settings

### Requirement: Mobile settings screen SHALL support custom AI provider configuration
The mobile application SHALL allow authenticated users to enable or disable custom AI provider usage and edit the associated provider configuration using the existing backend settings contract.

#### Scenario: User enables custom AI provider
- **WHEN** a user enables the custom AI provider option from mobile settings
- **THEN** the app persists the enabled state using the backend settings API
- **AND** the screen reflects that custom provider configuration is active

#### Scenario: User saves provider configuration
- **WHEN** a user enters a valid API key, model, and base URL and saves settings
- **THEN** the app persists the configuration through the backend settings API
- **AND** the screen shows a success state
- **AND** the API key input no longer reveals the previously entered secret value after save

#### Scenario: User keeps an existing saved API key
- **WHEN** a user already has a saved API key and submits settings without entering a new key
- **THEN** the app preserves the existing saved API key
- **AND** the screen indicates that a key remains stored

### Requirement: Mobile settings screen SHALL support connection testing
The mobile application SHALL allow users to test AI provider settings before saving and SHALL report whether the configuration can connect successfully.

#### Scenario: Connection test succeeds
- **WHEN** a user initiates a connection test with valid provider values
- **THEN** the app calls the backend test endpoint
- **AND** the screen shows a success message

#### Scenario: Connection test fails
- **WHEN** a user initiates a connection test with invalid or unreachable provider values
- **THEN** the app calls the backend test endpoint
- **AND** the screen shows an error message without saving the settings

### Requirement: Mobile theme preference SHALL be real and persistent
The mobile application SHALL provide a settings-controlled theme preference that changes actual application appearance behavior and persists across app restarts.

#### Scenario: User changes theme preference
- **WHEN** a user changes the theme setting on mobile
- **THEN** the app updates its active theme outside the settings screen
- **AND** the selected theme remains active while the app is in use

#### Scenario: Theme persists after restart
- **WHEN** a user reopens the mobile app after previously changing the theme
- **THEN** the app restores the saved theme preference from persistent storage

### Requirement: Mobile settings screen SHALL avoid placeholder controls for unsupported behavior
The mobile application SHALL not present settings controls as interactive product features unless they are backed by real behavior in the app or backend.

#### Scenario: Unsupported placeholder settings are removed
- **WHEN** a user views the mobile settings screen after this change
- **THEN** the screen does not show placeholder settings rows or toggles for unsupported profile, email, or notification features as if they are functional
