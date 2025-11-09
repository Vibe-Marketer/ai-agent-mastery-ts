/**
 * Zod schemas for LLM types
 */

import { z } from 'zod';

export const llmProviderSchema = z.enum(['openai', 'anthropic', 'groq', 'mistral', 'cohere', 'ollama']);

export const embeddingProviderSchema = z.enum(['openai', 'ollama']);

export const llmConfigSchema = z.object({
  provider: llmProviderSchema,
  model: z.string().min(1),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().min(1),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
});

export const embeddingConfigSchema = z.object({
  provider: embeddingProviderSchema,
  model: z.string().min(1),
  dimensions: z.number().int().positive(),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().min(1),
});

export const messageRoleSchema = z.enum(['system', 'user', 'assistant', 'tool']);

export const toolCallSchema = z.object({
  id: z.string(),
  type: z.literal('function'),
  function: z.object({
    name: z.string(),
    arguments: z.string(), // JSON string
  }),
});

export const messageSchema = z.object({
  role: messageRoleSchema,
  content: z.string(),
  name: z.string().optional(),
  tool_call_id: z.string().optional(),
  tool_calls: z.array(toolCallSchema).optional(),
});

export const llmResponseSchema = z.object({
  content: z.string(),
  tool_calls: z.array(toolCallSchema).optional(),
  usage: z.object({
    promptTokens: z.number().int().nonnegative(),
    completionTokens: z.number().int().nonnegative(),
    totalTokens: z.number().int().nonnegative(),
  }).optional(),
  finishReason: z.enum(['stop', 'length', 'tool_calls', 'content_filter']).optional(),
});
