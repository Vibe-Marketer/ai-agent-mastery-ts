/**
 * Agent and Tool Types
 */

import type { Message } from './llm.js';

export interface AgentConfig {
  name: string;
  description: string;
  instructions: string;
  tools: string[]; // Tool names
  model: string;
  temperature?: number;
  maxSteps?: number;
  enableMemory?: boolean;
}

export interface AgentContext {
  userId: string;
  conversationId: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentInput {
  message: string;
  context: AgentContext;
  history?: Message[];
  attachments?: FileAttachment[];
}

export interface AgentOutput {
  message: string;
  toolCalls?: ToolCallResult[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, unknown>;
}

export interface AgentStep {
  stepNumber: number;
  type: 'tool_call' | 'response';
  toolCalls?: ToolCallResult[];
  response?: string;
  timestamp: Date;
}

export interface FileAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
  content?: string | Buffer;
}

export interface ToolCallResult {
  toolName: string;
  input: Record<string, unknown>;
  output: unknown;
  error?: string;
  duration?: number;
}

export interface Tool<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>; // Zod schema converted to JSON Schema
  execute: (input: TInput, context: AgentContext) => Promise<TOutput>;
}

export type ToolExecutionContext = {
  userId: string;
  conversationId: string;
  metadata?: Record<string, unknown>;
};
