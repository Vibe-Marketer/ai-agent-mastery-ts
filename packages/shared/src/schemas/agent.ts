/**
 * Zod schemas for Agent types
 */

import { z } from 'zod';
import { messageSchema } from './llm.js';

export const agentConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  instructions: z.string().min(1),
  tools: z.array(z.string()),
  model: z.string().min(1),
  temperature: z.number().min(0).max(2).optional(),
  maxSteps: z.number().int().positive().optional().default(10),
  enableMemory: z.boolean().optional().default(true),
});

export const agentContextSchema = z.object({
  userId: z.string().uuid(),
  conversationId: z.string().uuid(),
  sessionId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const fileAttachmentSchema = z.object({
  id: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  url: z.string().url().optional(),
  content: z.union([z.string(), z.instanceof(Buffer)]).optional(),
});

export const agentInputSchema = z.object({
  message: z.string().min(1),
  context: agentContextSchema,
  history: z.array(messageSchema).optional(),
  attachments: z.array(fileAttachmentSchema).optional(),
});

export const toolCallResultSchema = z.object({
  toolName: z.string(),
  input: z.record(z.unknown()),
  output: z.unknown(),
  error: z.string().optional(),
  duration: z.number().nonnegative().optional(),
});

export const agentOutputSchema = z.object({
  message: z.string(),
  toolCalls: z.array(toolCallResultSchema).optional(),
  usage: z.object({
    promptTokens: z.number().int().nonnegative(),
    completionTokens: z.number().int().nonnegative(),
    totalTokens: z.number().int().nonnegative(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const agentStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  type: z.enum(['tool_call', 'response']),
  toolCalls: z.array(toolCallResultSchema).optional(),
  response: z.string().optional(),
  timestamp: z.date(),
});
