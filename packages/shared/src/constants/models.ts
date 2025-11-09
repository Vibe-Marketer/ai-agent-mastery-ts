/**
 * LLM Model configurations and metadata
 */

import type { LLMProvider, EmbeddingProvider } from '../types/llm.js';

export interface ModelInfo {
  id: string;
  provider: LLMProvider;
  displayName: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsTools: boolean;
  supportsVision: boolean;
  costPer1MInput: number; // USD
  costPer1MOutput: number; // USD
}

export interface EmbeddingModelInfo {
  id: string;
  provider: EmbeddingProvider;
  displayName: string;
  dimensions: number;
  maxInputTokens: number;
  costPer1M: number; // USD
}

/**
 * Available LLM models
 */
export const MODELS: Record<string, ModelInfo> = {
  // OpenAI Models
  'gpt-4o': {
    id: 'gpt-4o',
    provider: 'openai',
    displayName: 'GPT-4 Omni',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsTools: true,
    supportsVision: true,
    costPer1MInput: 2.50,
    costPer1MOutput: 10.00,
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    provider: 'openai',
    displayName: 'GPT-4 Omni Mini',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    supportsTools: true,
    supportsVision: true,
    costPer1MInput: 0.15,
    costPer1MOutput: 0.60,
  },
  'gpt-4-turbo': {
    id: 'gpt-4-turbo',
    provider: 'openai',
    displayName: 'GPT-4 Turbo',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsTools: true,
    supportsVision: true,
    costPer1MInput: 10.00,
    costPer1MOutput: 30.00,
  },

  // Anthropic Models
  'claude-3-5-sonnet-20250219': {
    id: 'claude-3-5-sonnet-20250219',
    provider: 'anthropic',
    displayName: 'Claude 3.5 Sonnet',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsTools: true,
    supportsVision: true,
    costPer1MInput: 3.00,
    costPer1MOutput: 15.00,
  },
  'claude-3-7-sonnet-20250219': {
    id: 'claude-3-7-sonnet-20250219',
    provider: 'anthropic',
    displayName: 'Claude 3.7 Sonnet',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsTools: true,
    supportsVision: true,
    costPer1MInput: 3.00,
    costPer1MOutput: 15.00,
  },

  // Groq Models
  'llama-3.3-70b-versatile': {
    id: 'llama-3.3-70b-versatile',
    provider: 'groq',
    displayName: 'Llama 3.3 70B',
    contextWindow: 32768,
    maxOutputTokens: 8192,
    supportsTools: true,
    supportsVision: false,
    costPer1MInput: 0.59,
    costPer1MOutput: 0.79,
  },
  'mixtral-8x7b-32768': {
    id: 'mixtral-8x7b-32768',
    provider: 'groq',
    displayName: 'Mixtral 8x7B',
    contextWindow: 32768,
    maxOutputTokens: 32768,
    supportsTools: true,
    supportsVision: false,
    costPer1MInput: 0.24,
    costPer1MOutput: 0.24,
  },

  // Ollama (local models - no cost)
  'qwen2.5:14b-instruct': {
    id: 'qwen2.5:14b-instruct',
    provider: 'ollama',
    displayName: 'Qwen 2.5 14B Instruct',
    contextWindow: 32768,
    maxOutputTokens: 8192,
    supportsTools: true,
    supportsVision: false,
    costPer1MInput: 0,
    costPer1MOutput: 0,
  },
  'llava:7b': {
    id: 'llava:7b',
    provider: 'ollama',
    displayName: 'LLaVA 7B',
    contextWindow: 4096,
    maxOutputTokens: 2048,
    supportsTools: false,
    supportsVision: true,
    costPer1MInput: 0,
    costPer1MOutput: 0,
  },
};

/**
 * Available embedding models
 */
export const EMBEDDING_MODELS: Record<string, EmbeddingModelInfo> = {
  // OpenAI
  'text-embedding-3-small': {
    id: 'text-embedding-3-small',
    provider: 'openai',
    displayName: 'Text Embedding 3 Small',
    dimensions: 1536,
    maxInputTokens: 8191,
    costPer1M: 0.02,
  },
  'text-embedding-3-large': {
    id: 'text-embedding-3-large',
    provider: 'openai',
    displayName: 'Text Embedding 3 Large',
    dimensions: 3072,
    maxInputTokens: 8191,
    costPer1M: 0.13,
  },

  // Ollama
  'nomic-embed-text': {
    id: 'nomic-embed-text',
    provider: 'ollama',
    displayName: 'Nomic Embed Text',
    dimensions: 768,
    maxInputTokens: 8192,
    costPer1M: 0,
  },
  'mxbai-embed-large': {
    id: 'mxbai-embed-large',
    provider: 'ollama',
    displayName: 'Mxbai Embed Large',
    dimensions: 1024,
    maxInputTokens: 512,
    costPer1M: 0,
  },
};

/**
 * Get model info by ID
 */
export function getModelInfo(modelId: string): ModelInfo | undefined {
  return MODELS[modelId];
}

/**
 * Get embedding model info by ID
 */
export function getEmbeddingModelInfo(modelId: string): EmbeddingModelInfo | undefined {
  return EMBEDDING_MODELS[modelId];
}

/**
 * Get models by provider
 */
export function getModelsByProvider(provider: LLMProvider): ModelInfo[] {
  return Object.values(MODELS).filter((model) => model.provider === provider);
}

/**
 * Get models that support tools
 */
export function getToolSupportedModels(): ModelInfo[] {
  return Object.values(MODELS).filter((model) => model.supportsTools);
}

/**
 * Get models that support vision
 */
export function getVisionSupportedModels(): ModelInfo[] {
  return Object.values(MODELS).filter((model) => model.supportsVision);
}

/**
 * Calculate cost for token usage
 */
export function calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const model = getModelInfo(modelId);
  if (!model) return 0;

  const inputCost = (inputTokens / 1_000_000) * model.costPer1MInput;
  const outputCost = (outputTokens / 1_000_000) * model.costPer1MOutput;

  return inputCost + outputCost;
}
