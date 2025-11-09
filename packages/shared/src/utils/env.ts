/**
 * Environment variable utilities
 */

import { validateEnv, type Env } from '../schemas/env.js';

let cachedEnv: Env | null = null;

/**
 * Get validated environment variables (cached)
 */
export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

/**
 * Get a specific environment variable
 */
export function getEnvVar<K extends keyof Env>(key: K): Env[K] {
  return getEnv()[key];
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvVar('NODE_ENV') === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnvVar('NODE_ENV') === 'development';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return getEnvVar('NODE_ENV') === 'test';
}

/**
 * Check if debug mode is enabled
 */
export function isDebug(): boolean {
  return getEnvVar('DEBUG') === true;
}

/**
 * Get LLM configuration from environment
 */
export function getLLMConfig() {
  const env = getEnv();
  return {
    provider: env.LLM_PROVIDER,
    model: env.LLM_MODEL,
    baseUrl: env.LLM_BASE_URL,
    apiKey: env.LLM_API_KEY,
  };
}

/**
 * Get embedding configuration from environment
 */
export function getEmbeddingConfig() {
  const env = getEnv();
  return {
    provider: env.EMBEDDING_PROVIDER,
    model: env.EMBEDDING_MODEL,
    dimensions: env.EMBEDDING_DIMENSIONS,
    baseUrl: env.EMBEDDING_BASE_URL,
    apiKey: env.EMBEDDING_API_KEY,
  };
}

/**
 * Get Supabase configuration from environment
 */
export function getSupabaseConfig() {
  const env = getEnv();
  return {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceKey: env.SUPABASE_SERVICE_KEY,
  };
}

/**
 * Get database URL from environment
 */
export function getDatabaseURL(): string {
  return getEnvVar('DATABASE_URL');
}

/**
 * Reset cached environment (useful for testing)
 */
export function resetEnvCache(): void {
  cachedEnv = null;
}
