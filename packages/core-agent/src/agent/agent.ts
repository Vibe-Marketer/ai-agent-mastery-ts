/**
 * Main Agent Implementation
 * Core agent using Mastra framework
 */

import { Mastra } from '@mastra/core';
import { createClient } from '@supabase/supabase-js';
import { getEnv, logger, AGENT_SYSTEM_PROMPT } from '@ai-agent-mastery/shared';
import type { AgentRunOptions, AgentOutput, MastraAgentConfig } from '../types/index.js';
import { createDefaultAgentConfig, validateAgentConfig, getModelConfig } from './config.js';
import { getTools } from '../tools/index.js';
import { searchMemories, formatMemories, extractAndStoreMemories } from '../memory/index.js';

/**
 * AI Agent class
 */
export class AIAgent {
  private config: MastraAgentConfig;
  private mastra: Mastra;
  private supabase: any;

  constructor(config?: Partial<MastraAgentConfig>) {
    // Merge with defaults
    this.config = { ...createDefaultAgentConfig(), ...config };

    // Validate configuration
    validateAgentConfig(this.config);

    // Initialize Supabase client
    const env = getEnv();
    this.supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Initialize Mastra
    this.mastra = new Mastra({
      name: this.config.name,
      instructions: this.config.instructions,
      model: this.config.model,
      apiKey: this.config.apiKey,
      tools: getTools(this.config.tools),
      temperature: this.config.temperature,
    });

    logger.info('Agent initialized', {
      name: this.config.name,
      model: this.config.model,
      toolCount: this.config.tools.length,
    });
  }

  /**
   * Run the agent with a message
   */
  async run(options: AgentRunOptions): Promise<AgentOutput> {
    const { message, context, history = [] } = options;

    logger.info('Agent run started', {
      userId: context.userId,
      conversationId: context.conversationId,
      message: message.substring(0, 100),
    });

    try {
      // Retrieve relevant memories if enabled
      let memories: string = '';
      if (this.config.enableMemory) {
        const memoryResults = await searchMemories({
          userId: context.userId,
          query: message,
          topK: 5,
          threshold: 0.7,
        });
        memories = formatMemories(memoryResults);
      }

      // Build messages array
      const messages = [
        {
          role: 'system',
          content: this.config.instructions + (memories ? `\n\n${memories}` : ''),
        },
        ...history,
        {
          role: 'user',
          content: message,
        },
      ];

      // Run agent
      const startTime = Date.now();
      const result = await this.mastra.run({
        messages,
        maxSteps: this.config.maxSteps,
      });

      const duration = Date.now() - startTime;

      // Extract tool calls if any
      const toolCalls = result.steps?.map(step => ({
        toolName: step.toolName,
        input: step.input,
        output: step.output,
        duration: step.duration,
      })) || [];

      // Store conversation in memory if enabled
      if (this.config.enableMemory) {
        await extractAndStoreMemories(
          context.userId,
          context.conversationId,
          [
            ...history,
            { role: 'user', content: message },
            { role: 'assistant', content: result.message },
          ]
        );
      }

      logger.info('Agent run completed', {
        userId: context.userId,
        duration,
        toolCallCount: toolCalls.length,
        responseLength: result.message.length,
      });

      return {
        message: result.message,
        toolCalls,
        usage: {
          promptTokens: result.usage?.promptTokens || 0,
          completionTokens: result.usage?.completionTokens || 0,
          totalTokens: result.usage?.totalTokens || 0,
        },
        metadata: {
          duration,
          model: this.config.model,
          steps: result.steps?.length || 0,
        },
      };
    } catch (error) {
      logger.error('Agent run failed', {
        error,
        userId: context.userId,
        message: message.substring(0, 100),
      });
      throw error;
    }
  }

  /**
   * Stream agent responses
   */
  async *stream(options: AgentRunOptions): AsyncGenerator<any> {
    const { message, context, history = [] } = options;

    logger.info('Agent stream started', {
      userId: context.userId,
      conversationId: context.conversationId,
    });

    try {
      // Retrieve memories
      let memories: string = '';
      if (this.config.enableMemory) {
        const memoryResults = await searchMemories({
          userId: context.userId,
          query: message,
        });
        memories = formatMemories(memoryResults);
      }

      // Build messages
      const messages = [
        {
          role: 'system',
          content: this.config.instructions + (memories ? `\n\n${memories}` : ''),
        },
        ...history,
        {
          role: 'user',
          content: message,
        },
      ];

      // Stream from Mastra
      const stream = await this.mastra.stream({
        messages,
        maxSteps: this.config.maxSteps,
      });

      for await (const chunk of stream) {
        yield chunk;
      }

      logger.info('Agent stream completed', {
        userId: context.userId,
      });
    } catch (error) {
      logger.error('Agent stream failed', {
        error,
        userId: context.userId,
      });
      throw error;
    }
  }

  /**
   * Get agent configuration
   */
  getConfig(): MastraAgentConfig {
    return { ...this.config };
  }

  /**
   * Update agent configuration
   */
  updateConfig(updates: Partial<MastraAgentConfig>): void {
    this.config = { ...this.config, ...updates };
    validateAgentConfig(this.config);

    logger.info('Agent configuration updated', {
      updates: Object.keys(updates),
    });
  }
}

/**
 * Create a new agent instance
 */
export function createAgent(config?: Partial<MastraAgentConfig>): AIAgent {
  return new AIAgent(config);
}
