/**
 * Zod schemas for RAG types
 */

import { z } from 'zod';

export const documentStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);

export const documentSourceSchema = z.enum(['local_file', 'google_drive', 'upload', 'url']);

export const documentSchema = z.object({
  id: z.string().uuid(),
  filename: z.string().min(1),
  filepath: z.string().min(1),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  userId: z.string().uuid(),
  uploadedAt: z.date(),
  processedAt: z.date().optional(),
  status: documentStatusSchema,
  metadata: z.record(z.unknown()).optional(),
  source: documentSourceSchema,
  chunksCount: z.number().int().nonnegative().optional(),
});

export const chunkingStrategySchema = z.object({
  strategy: z.enum(['fixed_size', 'semantic', 'recursive']),
  chunkSize: z.number().int().positive(),
  chunkOverlap: z.number().int().nonnegative(),
  separators: z.array(z.string()).optional(),
});

export const vectorSearchFilterSchema = z.object({
  documentIds: z.array(z.string().uuid()).optional(),
  userId: z.string().uuid().optional(),
  source: documentSourceSchema.optional(),
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const vectorSearchQuerySchema = z.object({
  embedding: z.array(z.number()),
  topK: z.number().int().positive().optional().default(5),
  similarityThreshold: z.number().min(0).max(1).optional().default(0.7),
  filter: vectorSearchFilterSchema.optional(),
});

export const vectorSearchResultSchema = z.object({
  chunkId: z.string().uuid(),
  documentId: z.string().uuid(),
  content: z.string(),
  similarity: z.number().min(0).max(1),
  metadata: z.record(z.unknown()).optional(),
  document: z.object({
    filename: z.string(),
    source: documentSourceSchema,
  }).optional(),
});

export const ragContextSchema = z.object({
  query: z.string(),
  results: z.array(vectorSearchResultSchema),
  topK: z.number().int().positive(),
  threshold: z.number().min(0).max(1),
  retrievedAt: z.date(),
});

export const googleDriveConfigSchema = z.object({
  folderId: z.string().min(1),
  credentials: z.object({
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    redirectUri: z.string().url(),
  }),
  refreshToken: z.string().optional(),
});
