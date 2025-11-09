/**
 * Core Agent Types
 * Extends shared types with agent-specific types
 */

import type { AgentConfig, AgentContext, AgentInput, AgentOutput } from '@ai-agent-mastery/shared';

export * from '@ai-agent-mastery/shared';

/**
 * Extended agent configuration with Mastra-specific options
 */
export interface MastraAgentConfig extends AgentConfig {
  apiKey: string;
  baseUrl?: string;
  streaming?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Agent run options
 */
export interface AgentRunOptions {
  message: string;
  context: AgentContext;
  history?: Array<{ role: string; content: string }>;
  attachments?: Array<{
    id: string;
    filename: string;
    mimeType: string;
    url: string;
  }>;
  stream?: boolean;
}

/**
 * Agent streaming chunk
 */
export interface AgentStreamChunk {
  type: 'start' | 'content' | 'tool_call' | 'tool_result' | 'end' | 'error';
  content?: string;
  toolCall?: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  };
  toolResult?: {
    id: string;
    output: unknown;
    error?: string;
  };
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Tool execution context (internal)
 */
export interface ToolContext {
  userId: string;
  conversationId: string;
  supabase: any; // Supabase client
  httpClient: any; // HTTP client for API calls
  env: Record<string, string | undefined>;
}
