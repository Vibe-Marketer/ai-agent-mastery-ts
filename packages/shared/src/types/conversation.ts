/**
 * Conversation and Chat Types
 */

import type { Message } from './llm.js';
import type { ToolCallResult, FileAttachment } from './agent.js';

export interface ChatSession {
  id: string;
  userId: string;
  conversationId: string;
  startedAt: Date;
  endedAt?: Date;
  isActive: boolean;
}

export interface ChatMessage extends Message {
  id: string;
  conversationId: string;
  messageIndex: number;
  parentMessageId?: string; // For branching conversations
  isEdited: boolean;
  editedAt?: Date;
}

export interface ChatRequest {
  message: string;
  conversationId?: string; // If not provided, creates new conversation
  attachments?: FileAttachment[];
  metadata?: ChatRequestMetadata;
}

export interface ChatRequestMetadata {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  enableRAG?: boolean;
  enableMemory?: boolean;
  [key: string]: unknown;
}

export interface ChatResponse {
  conversationId: string;
  messageId: string;
  message: string;
  role: 'assistant';
  toolCalls?: ToolCallResult[];
  metadata?: ChatResponseMetadata;
  ragContext?: RAGContextInfo;
}

export interface ChatResponseMetadata {
  model: string;
  temperature: number;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  duration: number; // milliseconds
  finishReason: string;
  cached?: boolean;
}

export interface RAGContextInfo {
  documentsRetrieved: number;
  topChunks: Array<{
    documentId: string;
    filename: string;
    similarity: number;
    snippet: string;
  }>;
}

export interface StreamingChatChunk {
  type: 'content' | 'tool_call' | 'metadata' | 'error' | 'done';
  conversationId?: string;
  messageId?: string;
  content?: string;
  toolCall?: {
    name: string;
    input: Record<string, unknown>;
    output?: unknown;
  };
  metadata?: Partial<ChatResponseMetadata>;
  error?: string;
  timestamp: Date;
}

export interface ConversationSummary {
  id: string;
  userId: string;
  title: string;
  messageCount: number;
  lastMessageAt: Date;
  preview: string; // First few messages or summary
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationListParams {
  userId: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'lastMessageAt';
  sortDirection?: 'asc' | 'desc';
  isArchived?: boolean;
  search?: string;
}

export interface MessageHistoryParams {
  conversationId: string;
  limit?: number;
  beforeMessageId?: string; // For pagination
  afterMessageId?: string;
}

export interface ConversationBranch {
  id: string;
  conversationId: string;
  branchFromMessageId: string;
  title?: string;
  createdAt: Date;
}

export interface RegenerateMessageParams {
  conversationId: string;
  messageId: string;
  newPrompt?: string; // Optional different prompt
  temperature?: number;
}

export interface EditMessageParams {
  conversationId: string;
  messageId: string;
  newContent: string;
  createBranch?: boolean; // Whether to branch or edit in place
}

export interface ConversationExport {
  conversation: {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
  };
  messages: Array<{
    role: string;
    content: string;
    createdAt: Date;
    attachments?: string[];
    toolCalls?: Array<{
      tool: string;
      input: unknown;
      output: unknown;
    }>;
  }>;
  metadata: {
    messageCount: number;
    totalTokens: number;
    exportedAt: Date;
  };
}

export type ConversationExportFormat = 'json' | 'markdown' | 'txt' | 'csv';
