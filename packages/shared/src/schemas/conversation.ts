/**
 * Zod schemas for Conversation types
 */

import { z } from 'zod';
import { fileAttachmentSchema, toolCallResultSchema } from './agent.js';

export const chatRequestMetadataSchema = z.object({
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  enableRAG: z.boolean().optional(),
  enableMemory: z.boolean().optional(),
}).catchall(z.unknown());

export const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  conversationId: z.string().uuid().optional(),
  attachments: z.array(fileAttachmentSchema).optional(),
  metadata: chatRequestMetadataSchema.optional(),
});

export const chatResponseMetadataSchema = z.object({
  model: z.string(),
  temperature: z.number(),
  tokensUsed: z.object({
    prompt: z.number().int().nonnegative(),
    completion: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
  duration: z.number().nonnegative(),
  finishReason: z.string(),
  cached: z.boolean().optional(),
});

export const ragContextInfoSchema = z.object({
  documentsRetrieved: z.number().int().nonnegative(),
  topChunks: z.array(z.object({
    documentId: z.string().uuid(),
    filename: z.string(),
    similarity: z.number().min(0).max(1),
    snippet: z.string(),
  })),
});

export const chatResponseSchema = z.object({
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
  message: z.string(),
  role: z.literal('assistant'),
  toolCalls: z.array(toolCallResultSchema).optional(),
  metadata: chatResponseMetadataSchema.optional(),
  ragContext: ragContextInfoSchema.optional(),
});

export const streamingChatChunkTypeSchema = z.enum(['content', 'tool_call', 'metadata', 'error', 'done']);

export const streamingChatChunkSchema = z.object({
  type: streamingChatChunkTypeSchema,
  conversationId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
  content: z.string().optional(),
  toolCall: z.object({
    name: z.string(),
    input: z.record(z.unknown()),
    output: z.unknown().optional(),
  }).optional(),
  metadata: chatResponseMetadataSchema.partial().optional(),
  error: z.string().optional(),
  timestamp: z.date(),
});

export const conversationListParamsSchema = z.object({
  userId: z.string().uuid(),
  limit: z.number().int().positive().optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
  sortBy: z.enum(['createdAt', 'updatedAt', 'lastMessageAt']).optional().default('updatedAt'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
  isArchived: z.boolean().optional(),
  search: z.string().optional(),
});

export const messageHistoryParamsSchema = z.object({
  conversationId: z.string().uuid(),
  limit: z.number().int().positive().optional().default(50),
  beforeMessageId: z.string().uuid().optional(),
  afterMessageId: z.string().uuid().optional(),
});

export const regenerateMessageParamsSchema = z.object({
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
  newPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

export const editMessageParamsSchema = z.object({
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
  newContent: z.string().min(1),
  createBranch: z.boolean().optional().default(false),
});

export const conversationExportFormatSchema = z.enum(['json', 'markdown', 'txt', 'csv']);
