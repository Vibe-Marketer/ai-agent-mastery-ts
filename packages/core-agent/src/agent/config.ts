/**
 * Agent Configuration Module
 * Handles agent setup and model configuration
 */

import { getEnv, logger, ConfigurationError, AGENT_SYSTEM_PROMPT } from '@ai-agent-mastery/shared';
import type { MastraAgentConfig, LLMProvider } from '../types/index.js';

/**
 * Get LLM model configuration based on provider
 */
export function getModelConfig(provider?: LLMProvider) {
  const env = getEnv();
  const llmProvider = provider || env.LLM_PROVIDER;

  const config = {
    provider: llmProvider,
    model: env.LLM_MODEL,
    apiKey: env.LLM_API_KEY,
    baseUrl: env.LLM_BASE_URL,
    temperature: 0.7,
  };

  logger.info('Model configuration loaded', {
    provider: config.provider,
    model: config.model,
    hasApiKey: !!config.apiKey,
  });

  return config;
}

/**
 * Get vision model configuration
 */
export function getVisionModelConfig() {
  const env = getEnv();

  const config = {
    provider: env.LLM_PROVIDER,
    model: env.VISION_LLM_MODEL,
    apiKey: env.LLM_API_KEY,
    baseUrl: env.LLM_BASE_URL,
  };

  logger.info('Vision model configuration loaded', {
    provider: config.provider,
    model: config.model,
  });

  return config;
}

/**
 * Get embedding model configuration
 */
export function getEmbeddingModelConfig() {
  const env = getEnv();

  const config = {
    provider: env.EMBEDDING_PROVIDER,
    model: env.EMBEDDING_MODEL,
    dimensions: env.EMBEDDING_DIMENSIONS,
    apiKey: env.EMBEDDING_API_KEY,
    baseUrl: env.EMBEDDING_BASE_URL,
  };

  logger.info('Embedding model configuration loaded', {
    provider: config.provider,
    model: config.model,
    dimensions: config.dimensions,
  });

  return config;
}

/**
 * Create default agent configuration
 */
export function createDefaultAgentConfig(): MastraAgentConfig {
  const modelConfig = getModelConfig();

  const config: MastraAgentConfig = {
    name: 'AI Assistant',
    description: 'Intelligent AI assistant with research and analysis capabilities',
    instructions: AGENT_SYSTEM_PROMPT,
    tools: [
      'web_search',
      'retrieve_relevant_documents',
      'list_documents',
      'get_document_content',
      'execute_sql_query',
      'image_analysis',
    ],
    model: modelConfig.model,
    apiKey: modelConfig.apiKey,
    baseUrl: modelConfig.baseUrl,
    temperature: modelConfig.temperature,
    maxSteps: 10,
    enableMemory: true,
    streaming: true,
    logLevel: getEnv().LOG_LEVEL,
  };

  return config;
}

/**
 * Validate agent configuration
 */
export function validateAgentConfig(config: MastraAgentConfig): void {
  if (!config.model) {
    throw new ConfigurationError('Agent model is required');
  }

  if (!config.apiKey) {
    throw new ConfigurationError('API key is required');
  }

  if (!config.tools || config.tools.length === 0) {
    throw new ConfigurationError('At least one tool must be enabled');
  }

  if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
    throw new ConfigurationError('Temperature must be between 0 and 2');
  }

  if (config.maxSteps !== undefined && config.maxSteps < 1) {
    throw new ConfigurationError('Max steps must be at least 1');
  }

  logger.debug('Agent configuration validated', {
    model: config.model,
    toolCount: config.tools.length,
    maxSteps: config.maxSteps,
  });
}

/**
 * Get Supabase client configuration
 */
export function getSupabaseConfig() {
  const env = getEnv();

  return {
    url: env.SUPABASE_URL,
    serviceKey: env.SUPABASE_SERVICE_KEY,
    anonKey: env.SUPABASE_ANON_KEY,
  };
}

/**
 * Check if a specific tool is enabled
 */
export function isToolEnabled(toolName: string, config: MastraAgentConfig): boolean {
  return config.tools.includes(toolName);
}

/**
 * Get enabled tools from configuration
 */
export function getEnabledTools(config: MastraAgentConfig): string[] {
  return config.tools;
}
