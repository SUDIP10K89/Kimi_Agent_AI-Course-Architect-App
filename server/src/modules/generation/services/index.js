/**
 * Generation Services
 *
 * Main export for all generation services.
 */

// Core generation services
export * from './contentGenerator.service.js';
export * from './outlineGenerator.service.js';
export * from './health.service.js';

// Query builder
export * from './queryBuilder.js';

// YouTube adapter
export * from './youtube.adapter.js';

// Video services (re-export from video subfolder)
export { getVideos } from './video/index.js';

// Backward compatibility - re-export from nested locations
export {
  buildQuery,
} from './utils/index.js';

export {
  searchVideos,
  fetchVideoDetails,
  isQuotaExceeded,
  checkHealth,
} from './adapters/index.js';
