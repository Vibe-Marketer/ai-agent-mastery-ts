/**
 * Multi-Agent Introduction (7.3)
 * Basic multi-agent pattern with two specialized agents
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createLLM } from '../utils/llm-factory.js';
import { logger } from '@ai-agent-mastery/shared';

interface AgentState {
  messages: BaseMessage[];
  next?: string;
}

/**
 * Research Agent - Gathers information
 */
async function researchAgent(state: AgentState): Promise<Partial<AgentState>> {
  logger.info('Research agent processing');

  const llm = createLLM();

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a research agent. Your job is to gather relevant information about the topic. Be thorough and factual.'],
    ['placeholder', '{messages}'],
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ messages: state.messages });

  return {
    messages: [...state.messages, new AIMessage({ content: response.content, name: 'ResearchAgent' })],
    next: 'writer',
  };
}

/**
 * Writer Agent - Composes responses
 */
async function writerAgent(state: AgentState): Promise<Partial<AgentState>> {
  logger.info('Writer agent processing');

  const llm = createLLM();

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a writer agent. Your job is to take research findings and compose a clear, engaging response. Be concise and well-structured.'],
    ['placeholder', '{messages}'],
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ messages: state.messages });

  return {
    messages: [...state.messages, new AIMessage({ content: response.content, name: 'WriterAgent' })],
    next: 'end',
  };
}

/**
 * Router function - Determines next agent
 */
function router(state: AgentState): string {
  return state.next || END;
}

/**
 * Create multi-agent intro workflow
 */
export function createMultiAgentIntroWorkflow() {
  const workflow = new StateGraph<AgentState>({
    channels: {
      messages: {
        value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
        default: () => [],
      },
      next: {
        value: (x?: string, y?: string) => y ?? x,
        default: () => undefined,
      },
    },
  });

  // Add nodes
  workflow.addNode('researcher', researchAgent);
  workflow.addNode('writer', writerAgent);

  // Add edges
  workflow.addEdge(START, 'researcher');
  workflow.addConditionalEdges('researcher', router, {
    writer: 'writer',
    end: END,
  });
  workflow.addConditionalEdges('writer', router, {
    end: END,
  });

  return workflow.compile();
}

/**
 * Run multi-agent intro workflow
 */
export async function runMultiAgentIntro(input: string): Promise<string> {
  logger.info('Running multi-agent intro workflow', { input });

  const workflow = createMultiAgentIntroWorkflow();

  const result = await workflow.invoke({
    messages: [new HumanMessage(input)],
  });

  // Get final message
  const messages = result.messages;
  const lastMessage = messages[messages.length - 1];

  return lastMessage.content as string;
}
