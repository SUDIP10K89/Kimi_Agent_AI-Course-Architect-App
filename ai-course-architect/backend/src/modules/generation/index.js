/**
 * Generation Module
 *
 * Main export for generation module.
 */

// Core generation service
export * from './generation.service.js';

// Generation services (flattened)
export * from './services/index.js';

// Events and constants
export { default as generationEvents } from './generation.events.js';
export * from './generation.constants.js';

// State management (re-export for backward compatibility)
export * from './state/generationState.js';
