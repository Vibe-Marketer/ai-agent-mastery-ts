/**
 * LLM Routing (7.5)
 * Routes queries to specialized agents based on intent
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { createLLM } from '../utils/llm-factory.js';
import { logger } from '@ai-agent-mastery/shared';

interface RoutingState {
  messages: BaseMessage[];
  route?: string;
  next?: string;
}

const RouteSchema = z.object({
  route: z.enum(['general', 'technical', 'creative', 'data']),
  reasoning: z.string(),
});

/**
 * Router Agent - Determines which specialized agent to use
 */
async function routerAgent(state: RoutingState): Promise<Partial<RoutingState>> {
  logger.info('Router agent processing');

  const llm = createLLM({ temperature: 0 });

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', `You are a routing agent. Analyze the user's query and determine which specialized agent should handle it:

- general: General questions, greetings, small talk
- technical: Programming, technical support, debugging, system configuration
- creative: Writing, brainstorming, creative content, storytelling
- data: Data analysis, statistics, calculations, research

Respond with JSON: {"route": "<agent>", "reasoning": "<why>"}`],
    ['user', '{input}'],
  ]);

  const lastMessage = state.messages[state.messages.length - 1];
  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ input: lastMessage.content });

  // Parse JSON response
  let route = 'general';
  try {
    const content = response.content as string;
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const parsed = RouteSchema.parse(JSON.parse(jsonMatch[0]));
      route = parsed.route;
      logger.info('Routing decision', { route, reasoning: parsed.reasoning });
    }
  } catch (error) {
    logger.warn('Failed to parse routing decision, using general', { error });
  }

  return {
    route,
    next: route,
  };
}

/**
 * General Agent - Handles general queries
 */
async function generalAgent(state: RoutingState): Promise<Partial<RoutingState>> {
  logger.info('General agent processing');

  const llm = createLLM();

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a friendly general-purpose assistant. Provide helpful, conversational responses.'],
    ['placeholder', '{messages}'],
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ messages: state.messages });

  return {
    messages: [...state.messages, new AIMessage({ content: response.content, name: 'GeneralAgent' })],
    next: 'end',
  };
}

/**
 * Technical Agent - Handles technical queries
 */
async function technicalAgent(state: RoutingState): Promise<Partial<RoutingState>> {
  logger.info('Technical agent processing');

  const llm = createLLM();

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a technical expert specializing in programming, system architecture, and troubleshooting. Provide detailed, accurate technical guidance with code examples when relevant.'],
    ['placeholder', '{messages}'],
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ messages: state.messages });

  return {
    messages: [...state.messages, new AIMessage({ content: response.content, name: 'TechnicalAgent' })],
    next: 'end',
  };
}

/**
 * Creative Agent - Handles creative queries
 */
async function creativeAgent(state: RoutingState): Promise<Partial<RoutingState>> {
  logger.info('Creative agent processing');

  const llm = createLLM({ temperature: 0.9 });

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a creative writing assistant. Help with brainstorming, storytelling, and creative content. Be imaginative and engaging.'],
    ['placeholder', '{messages}'],
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ messages: state.messages });

  return {
    messages: [...state.messages, new AIMessage({ content: response.content, name: 'CreativeAgent' })],
    next: 'end',
  };
}

/**
 * Data Agent - Handles data analysis queries
 */
async function dataAgent(state: RoutingState): Promise<Partial<RoutingState>> {
  logger.info('Data agent processing');

  const llm = createLLM({ temperature: 0.1 });

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a data analysis expert. Help with statistics, data interpretation, calculations, and research. Be precise and show your work.'],
    ['placeholder', '{messages}'],
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ messages: state.messages });

  return {
    messages: [...state.messages, new AIMessage({ content: response.content, name: 'DataAgent' })],
    next: 'end',
  };
}

/**
 * Router function
 */
function router(state: RoutingState): string {
  return state.next || END;
}

/**
 * Create LLM routing workflow
 */
export function createLLMRoutingWorkflow() {
  const workflow = new StateGraph<RoutingState>({
    channels: {
      messages: {
        value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
        default: () => [],
      },
      route: {
        value: (x?: string, y?: string) => y ?? x,
        default: () => undefined,
      },
      next: {
        value: (x?: string, y?: string) => y ?? x,
        default: () => undefined,
      },
    },
  });

  // Add nodes
  workflow.addNode('router', routerAgent);
  workflow.addNode('general', generalAgent);
  workflow.addNode('technical', technicalAgent);
  workflow.addNode('creative', creativeAgent);
  workflow.addNode('data', dataAgent);

  // Add edges
  workflow.addEdge(START, 'router');

  workflow.addConditionalEdges('router', router, {
    general: 'general',
    technical: 'technical',
    creative: 'creative',
    data: 'data',
  });

  workflow.addConditionalEdges('general', router, { end: END });
  workflow.addConditionalEdges('technical', router, { end: END });
  workflow.addConditionalEdges('creative', router, { end: END });
  workflow.addConditionalEdges('data', router, { end: END });

  return workflow.compile();
}

/**
 * Run LLM routing workflow
 */
export async function runLLMRouting(input: string): Promise<string> {
  logger.info('Running LLM routing workflow', { input });

  const workflow = createLLMRoutingWorkflow();

  const result = await workflow.invoke({
    messages: [new HumanMessage(input)],
  });

  // Get final message
  const messages = result.messages;
  const lastMessage = messages[messages.length - 1];

  return lastMessage.content as string;
}
