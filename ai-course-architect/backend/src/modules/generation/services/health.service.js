/**
 * Service Health Check Utility
 *
 * Centralized health checks for all external services and internal components.
 * Used for startup validation and runtime monitoring.
 */

import { checkOpenAIHealth } from '../../providers/ai/openai.service.js';
import { geminiAiProvider } from '../../providers/ai/gemini.service.js';
import { checkHealth as checkYouTubeHealth } from './youtube.adapter.js';
import { logError, logWarn, logInfo } from '../../../shared/utils/logger.js';

/**
 * Health status for a service
 */
class HealthStatus {
  constructor(name, healthy, details = {}) {
    this.name = name;
    this.healthy = healthy;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      healthy: this.healthy,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Check OpenAI service health
 */
const checkOpenAiHealth = async () => {
  try {
    const healthy = await checkOpenAIHealth();
    return new HealthStatus('OpenAI', healthy, {
      status: healthy ? 'operational' : 'degraded',
      message: healthy ? 'API is accessible' : 'API health check failed',
    });
  } catch (error) {
    logError('OpenAI health check failed', { error: error.message });
    return new HealthStatus('OpenAI', false, {
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Check Gemini service health
 */
const checkGeminiHealth = async () => {
  try {
    const healthy = await geminiAiProvider.checkHealth();
    return new HealthStatus('Gemini', healthy, {
      status: healthy ? 'operational' : 'degraded',
      message: healthy ? 'API is accessible' : 'API health check failed',
    });
  } catch (error) {
    logError('Gemini health check failed', { error: error.message });
    return new HealthStatus('Gemini', false, {
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Check YouTube service health
 */
const checkYoutubeHealth = async () => {
  try {
    const healthy = await checkYouTubeHealth();
    return new HealthStatus('YouTube', healthy, {
      status: healthy ? 'operational' : 'degraded',
      message: healthy ? 'API is accessible' : 'API health check failed',
    });
  } catch (error) {
    logError('YouTube health check failed', { error: error.message });
    return new HealthStatus('YouTube', false, {
      status: 'error',
      message: error.message,
    });
  }
};

/**
 * Check cache service health
 * Note: Cache is no longer used - videos are fetched fresh for each microtopic
 */
const checkCacheHealth = () => {
  // No longer using cache - videos fetched fresh via API
  return new HealthStatus('Cache', true, {
    status: 'operational',
    message: 'Using fresh API calls instead of cache',
  });
};

/**
 * Run all health checks
 * @param {Object} options
 * @param {boolean} options.includeCache - Include cache health check (default: true)
 * @returns {Promise<Object>} Overall health status
 */
export const checkAllServices = async (options = {}) => {
  const { includeCache = true } = options;

  const checks = await Promise.all([
    checkOpenAiHealth(),
    checkGeminiHealth(),
    checkYoutubeHealth(),
    ...(includeCache ? [checkCacheHealth()] : []),
  ]);

  const healthyCount = checks.filter((c) => c.healthy).length;
  const total = checks.length;

  return {
    overall: healthyCount === total ? 'healthy' : 'degraded',
    healthy: healthyCount === total,
    healthyCount,
    total,
    services: checks,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Run startup health checks
 * Critical services must be healthy for server to start
 */
export const runStartupChecks = async () => {
  logInfo('Running startup health checks...');

  const results = await checkAllServices({ includeCache: true });

  if (!results.healthy) {
    const unhealthy = results.services.filter((s) => !s.healthy);
    logWarn('Some services are unhealthy', {
      unhealthy: unhealthy.map((s) => s.name),
    });
  }

  // Log results
  results.services.forEach((service) => {
    const logFn = service.healthy ? logInfo : logError;
    logFn(`${service.name} health: ${service.status}`, service.details);
  });

  return results;
};

/**
 * Get quick health status (for health endpoint)
 */
export const getQuickHealth = async () => {
  const results = await checkAllServices({ includeCache: false });

  return {
    status: results.overall,
    healthy: results.healthy,
    timestamp: results.timestamp,
    services: results.services.map((s) => ({
      name: s.name,
      status: s.healthy ? 'operational' : 'degraded',
    })),
  };
};

export default {
  checkAllServices,
  runStartupChecks,
  getQuickHealth,
  checkOpenAiHealth,
  checkGeminiHealth,
  checkYoutubeHealth,
  checkCacheHealth,
};
