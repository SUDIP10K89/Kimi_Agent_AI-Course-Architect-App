## Context

The web app already supports a real settings workflow with account display, persisted theme preference, and backend-backed AI provider configuration. The mobile app currently renders a native Settings screen, but its theme and notification toggles are local-only placeholders and it does not load or persist AI provider settings.

This change crosses multiple mobile layers:

- settings screen UI and form state
- API integration for `/users/settings` and `/users/settings/test`
- app-level theme state and persistence
- authentication-aware loading and error handling

Because the mobile app already has a visible settings surface, the main design concern is replacing misleading placeholder behavior with production-backed behavior while keeping the UX native to mobile.

## Goals / Non-Goals

**Goals:**

- Provide mobile users the same settings capabilities the web app already offers for account display, theme preference, and custom AI provider configuration.
- Reuse the existing backend settings endpoints instead of introducing new server APIs.
- Add persistent theme state in mobile so the theme control reflects actual app behavior.
- Present clear save/test/loading/error states for settings actions on mobile.

**Non-Goals:**

- Editing account profile fields such as name or email.
- Adding new settings capabilities that do not already exist on the web app.
- Reworking the entire mobile visual system or introducing a full design system migration.
- Implementing push notification settings just because the current mobile screen shows a placeholder toggle.

## Decisions

### 1. Create a dedicated mobile settings API layer mirroring the web app

Mobile will add a `settingsApi` module equivalent to the web implementation and call the existing `/users/settings` and `/users/settings/test` endpoints.

Rationale:

- Keeps web and mobile behavior aligned at the API boundary.
- Avoids duplicating request logic inside screen components.
- Makes future parity changes easier because the contract matches the web app.

Alternative considered:

- Call the endpoints directly from `SettingsScreen`.
  Rejected because it would mix transport, form state, and rendering concerns in one component.

### 2. Replace placeholder settings rows with only supported parity features

The mobile settings screen will prioritize:

- account information display
- theme preference
- custom AI provider enable/disable
- API key entry with masked display
- model and base URL editing
- test connection
- save settings
- logout

Placeholder rows such as "Edit Profile", "Email Settings", and local notification toggles will be removed or deferred from the primary settings flow unless they are backed by real behavior.

Rationale:

- A smaller truthful settings surface is better than a larger fake one.
- It aligns the mobile screen with actual product capabilities.

Alternative considered:

- Keep placeholders for future roadmap discoverability.
  Rejected because users interpret visible settings rows as functional.

### 3. Introduce a mobile theme context/provider instead of screen-local state

Theme control on mobile will be lifted out of `SettingsScreen` into a shared provider persisted in storage, so the toggle changes actual app theme behavior and survives restarts.

Rationale:

- Screen-local state cannot deliver parity because it does not affect the app outside that view.
- Theme preference is cross-cutting and belongs in app-level state.

Alternative considered:

- Keep the setting local until a full theming redesign happens.
  Rejected because that would preserve the current misleading UX.

### 4. Load settings lazily on screen entry and preserve explicit action states

The mobile screen will fetch persisted settings on mount/focus and manage explicit states for:

- initial loading
- test in progress
- save in progress
- inline success/error feedback

Rationale:

- Matches the web behavior closely.
- Gives users immediate confirmation that settings are fetched from and saved to the backend.

Alternative considered:

- Preload settings globally at app startup.
  Rejected because settings are only needed in one screen and do not justify global boot-time coupling.

## Risks / Trade-offs

- [Theme parity is broader than one screen] → Start with persisted theme state and apply it to the existing mobile app shell, while deferring visual refinement beyond the current token set.
- [Secure handling of API keys on mobile is sensitive] → Reuse existing authenticated backend settings storage and avoid displaying stored secrets after initial save; only show masked/empty field behavior.
- [Mobile UX can drift from web UX] → Match capability and state transitions to web, but adapt layout and interaction patterns to native controls instead of copying the web page literally.
- [Placeholder removal may feel like feature loss] → Remove only nonfunctional rows and replace them with production-backed settings so overall user trust increases.

## Migration Plan

1. Add the mobile settings API client and shared types if missing.
2. Introduce theme provider/persistence in the mobile app shell.
3. Replace placeholder settings UI with backend-backed settings controls.
4. Verify settings load, save, and test flows against the existing backend.
5. Roll back by restoring the previous screen if major issues emerge; no backend migration is required because this change reuses existing endpoints.

## Open Questions

- Should mobile theme support only `light` and `dark`, or also a `system` mode later for parity with platform conventions?
- Should the saved API key field show a generic “already saved” hint only, or expose a stronger status treatment in the UI?
- Do we want to keep a separate notifications section hidden behind a future flag, or remove it completely until the feature exists?
