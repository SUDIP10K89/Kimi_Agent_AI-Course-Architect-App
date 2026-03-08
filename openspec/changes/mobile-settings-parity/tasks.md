## 1. Settings API and state

- [x] 1.1 Add a mobile `settingsApi` module for loading, updating, and testing settings against `/users/settings` and `/users/settings/test`
- [x] 1.2 Define or align mobile settings types with the backend and web settings contract
- [x] 1.3 Add screen-level settings state for initial load, save-in-progress, test-in-progress, and success/error feedback

## 2. Theme infrastructure

- [x] 2.1 Introduce a shared mobile theme provider/context with persistent storage
- [x] 2.2 Wire the mobile app shell to consume the persisted theme so the setting affects actual app appearance
- [x] 2.3 Replace the local-only settings theme toggle with the shared persisted theme control

## 3. Mobile settings screen parity

- [x] 3.1 Replace placeholder settings rows with production-backed account, theme, AI provider, and logout sections
- [x] 3.2 Implement loading of persisted AI provider settings when the settings screen opens
- [x] 3.3 Implement editing and saving of custom provider toggle, API key, model, and base URL
- [x] 3.4 Implement connection testing with clear success and error states
- [x] 3.5 Ensure saved API key behavior is masked and does not reveal previously stored secret values after save

## 4. Validation and verification

- [x] 4.1 Verify unsupported placeholder controls are removed from the mobile settings screen
- [ ] 4.2 Verify theme preference persists across app restarts
- [ ] 4.3 Verify settings load, save, and test flows against the existing backend using an authenticated mobile session
