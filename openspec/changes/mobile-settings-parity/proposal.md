## Why

The mobile app exposes a Settings screen, but most of it is placeholder UI and lacks the real configuration features already available on the web app. This creates a misleading product gap in a high-trust area and blocks mobile users from managing AI provider settings that affect core course generation behavior.

## What Changes

- Add real mobile settings behavior for account display, theme preference, and AI provider configuration to match the web app's supported functionality.
- Replace placeholder mobile settings rows and local-only toggles with settings backed by the existing backend settings endpoints.
- Add support for loading, editing, validating, and persisting custom AI provider settings on mobile, including API key, model, base URL, enable/disable toggle, and connection testing.
- Align mobile settings UX with the current web feature set while keeping mobile-native interaction patterns.

## Capabilities

### New Capabilities
- `mobile-settings`: Mobile settings management for theme preference and custom AI provider configuration, backed by the existing user settings API.

### Modified Capabilities

## Impact

- Affected code: `mobile/src/screens/SettingsScreen.tsx`, mobile settings/state infrastructure, navigation/app providers, and mobile API client layer.
- APIs: existing user settings endpoints under `/users/settings` and `/users/settings/test`.
- Systems: mobile theme persistence, authentication-aware settings loading, and mobile form validation/feedback flows.
