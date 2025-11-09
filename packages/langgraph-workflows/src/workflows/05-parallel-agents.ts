/**
 * Parallel Agents (7.6)
 * Multiple agents process different aspects simultaneously, then combine results
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createLLM } from '../utils/llm-factory.js';
import { logger } from '@ai-agent-mastery/shared';

interface ParallelState {
  messages: BaseMessage[];
  factsResult?: string;
  opinionResult?: string;
  dataResult?: string;
  synthesizedResult?: string;
  completedAgents: string[];
  next?: string;
}

/**
 * Facts Agent - Gathers factual information
 */
async function factsAgent(state: ParallelState): Promise<Partial<ParallelState>> {
  logger.info('Facts agent processing');

  const llm = createLLM({ temperature: 0.1 });

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a facts agent. Research and provide objective, verifiable facts about the topic. Focus on data, statistics, and established information.'],
    ['placeholder', '{messages}'],
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ messages: state.messages });

  return {
    factsResult: response.content as string,
    completedAgents: [...state.completedAgents, 'facts'],
  };
}

/**
 * Opinion Agent - Gathers perspectives and analysis
 */
async function opinionAgent(state: ParallelState): Promise<Partial<ParallelState>> {
  logger.info('Opinion agent processing');

  const llm = createLLM({ temperature: 0.7 });

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are an opinion agent. Provide balanced perspectives, expert opinions, and analytical insights about the topic. Present multiple viewpoints.'],
    ['placeholder', '{messages}'],
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ messages: state.messages });

  return {
    opinionResult: response.content as string,
    completedAgents: [...state.completedAgents, 'opinion'],
  };
}

/**
 * Data Agent - Performs calculations and analysis
 */
async function dataAgent(state: ParallelState): Promise<Partial<ParallelState>> {
  logger.info('Data agent processing');

  const llm = createLLM({ temperature: 0.1 });

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a data analysis agent. Perform relevant calculations, statistical analysis, and quantitative assessments related to the topic.'],
    ['placeholder', '{messages}'],
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ messages: state.messages });

  return {
    dataResult: response.content as string,
    completedAgents: [...state.completedAgents, 'data'],
  };
}

/**
 * Synthesis Agent - Combines all results
 */
async function synthesisAgent(state: ParallelState): Promise<Partial<ParallelState>> {
  logger.info('Synthesis agent processing');

  const llm = createLLM();

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', `You are a synthesis agent. Combine the findings from multiple agents into a comprehensive, well-structured response.

Facts findings:
{facts}

Perspectives and opinions:
{opinions}

Data analysis:
{data}

Create a cohesive response that integrates all these elements.`],
    ['user', 'Original request: {request}'],
  ]);

  const originalRequest = state.messages[0].content;
  const chain = prompt.pipe(llm);
  const response = await chain.invoke({
    facts: state.factsResult || 'N/A',
    opinions: state.opinionResult || 'N/A',
    data: state.dataResult || 'N/A',
    request: originalRequest,
  });

  return {
    synthesizedResult: response.content as string,
    messages: [...state.messages, new AIMessage({ content: response.content, name: 'SynthesisAgent' })],
    next: 'end',
  };
}

/**
 * Check if all parallel agents completed
 */
function checkParallelCompletion(state: ParallelState): string {
  const required = ['facts', 'opinion', 'data'];
  const allCompleted = required.every((agent) => state.completedAgents.includes(agent));

  if (allCompleted) {
    return 'synthesizer';
  }

  return 'wait';
}

/**
 * Router function
 */
function router(state: ParallelState): string {
  return state.next || END;
}

/**
 * Create parallel agents workflow
 */
export function createParallelWorkflow() {
  const workflow = new StateGraph<ParallelState>({
    channels: {
      messages: {
        value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
        default: () => [],
      },
      factsResult: {
        value: (x?: string, y?: string) => y ?? x,
        default: () => undefined,
      },
      opinionResult: {
        value: (x?: string, y?: string) => y ?? x,
        default: () => undefined,
      },
      dataResult: {
        value: (x?: string, y?: string) => y ?? x,
        default: () => undefined,
      },
      synthesizedResult: {
        value: (x?: string, y?: string) => y ?? x,
        default: () => undefined,
      },
      completedAgents: {
        value: (x: string[], y: string[]) => [...new Set([...x, ...y])],
        default: () => [],
      },
      next: {
        value: (x?: string, y?: string) => y ?? x,
        default: () => undefined,
      },
    },
  });

  // Add nodes
  workflow.addNode('facts', factsAgent);
  workflow.addNode('opinion', opinionAgent);
  workflow.addNode('data', dataAgent);
  workflow.addNode('synthesizer', synthesisAgent);

  // Start all three agents in parallel
  workflow.addEdge(START, 'facts');
  workflow.addEdge(START, 'opinion');
  workflow.addEdge(START, 'data');

  // All converge to synthesizer
  workflow.addEdge('facts', 'synthesizer');
  workflow.addEdge('opinion', 'synthesizer');
  workflow.addEdge('data', 'synthesizer');

  workflow.addConditionalEdges('synthesizer', router, {
    end: END,
  });

  return workflow.compile();
}

/**
 * Run parallel agents workflow
 */
export async function runParallelAgents(input: string): Promise<string> {
  logger.info('Running parallel agents workflow', { input });

  const workflow = createParallelWorkflow();

  const result = await workflow.invoke({
    messages: [new HumanMessage(input)],
    completedAgents: [],
  });

  // Return synthesized result
  return result.synthesizedResult || result.messages[result.messages.length - 1].content as string;
}
