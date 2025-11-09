/**
 * Database Models and Types
 * Matches the PostgreSQL schemas from the Python version
 */

export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface Profile {
  id: string;
  userId: string;
  fullName?: string;
  avatarUrl?: string;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
  };
  defaultModel?: string;
  [key: string]: unknown;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  metadata?: ConversationMetadata;
  isArchived: boolean;
  messageCount?: number;
}

export interface ConversationMetadata {
  model?: string;
  temperature?: number;
  tokensUsed?: number;
  tags?: string[];
  [key: string]: unknown;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  createdAt: Date;
  metadata?: MessageMetadata;
  attachments?: MessageAttachment[];
  toolCalls?: ToolCallRecord[];
  tokensUsed?: number;
}

export interface MessageMetadata {
  model?: string;
  temperature?: number;
  finishReason?: string;
  cached?: boolean;
  [key: string]: unknown;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  storageKey: string;
  createdAt: Date;
}

export interface ToolCallRecord {
  id: string;
  messageId: string;
  toolName: string;
  input: Record<string, unknown>;
  output: unknown;
  error?: string;
  duration?: number;
  createdAt: Date;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  filename: string;
  filepath: string;
  mimeType: string;
  size: number;
  source: 'local_file' | 'google_drive' | 'upload' | 'url';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploadedAt: Date;
  processedAt?: Date;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
}

export interface DocumentChunkRecord {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  startChar: number;
  endChar: number;
  embedding: number[]; // pgvector compatible
  embeddingModel: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface DocumentRowRecord {
  id: string;
  documentId: string;
  rowIndex: number;
  rowData: Record<string, unknown>;
  createdAt: Date;
}

export interface MemoryRecord {
  id: string;
  userId: string;
  conversationId?: string;
  memoryType: 'fact' | 'preference' | 'context' | 'summary';
  content: string;
  importance: number; // 0-1 score
  embedding?: number[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  expiresAt?: Date;
}

export interface RAGPipelineState {
  id: string;
  userId: string;
  source: 'local_file' | 'google_drive';
  lastSyncAt?: Date;
  lastError?: string;
  filesProcessed: number;
  filesTotal: number;
  status: 'idle' | 'syncing' | 'error';
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyHash: string; // Never store plain API keys
  lastUsedAt?: Date;
  expiresAt?: Date;
  scopes: string[];
  createdAt: Date;
  isRevoked: boolean;
}

export interface UsageLog {
  id: string;
  userId: string;
  conversationId?: string;
  messageId?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost?: number;
  createdAt: Date;
}

export interface RateLimitRecord {
  id: string;
  userId: string;
  endpoint: string;
  requestCount: number;
  windowStart: Date;
  windowEnd: Date;
}

// Database query helpers
export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: unknown;
}

// Database utility types
export type DatabaseInsert<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type DatabaseUpdate<T> = Partial<Omit<T, 'id' | 'createdAt'>>;
