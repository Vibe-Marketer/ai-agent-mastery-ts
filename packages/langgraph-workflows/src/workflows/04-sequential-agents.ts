/**
 * Sequential Agents (7.6)
 * Multiple agents process tasks in sequence, each building on the previous
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createLLM } from '../utils/llm-factory.js';
import { logger } from '@ai-agent-mastery/shared';

interface SequentialState {
  messages: BaseMessage[];
  outline?: string;
  draft?: string;
  finalContent?: string;
  next?: string;
}

/**
 * Planner Agent - Creates outline
 */
async function plannerAgent(state: SequentialState): Promise<Partial<SequentialState>> {
  logger.info('Planner agent processing');

  const llm = createLLM();

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a planning agent. Your job is to create a detailed outline for the requested content. Structure your outline with clear sections and key points.'],
    ['placeholder', '{messages}'],
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ messages: state.messages });

  return {
    outline: response.content as string,
    messages: [...state.messages, new AIMessage({ content: response.content, name: 'PlannerAgent' })],
    next: 'drafter',
  };
}

/**
 * Drafter Agent - Writes draft based on outline
 */
async function drafterAgent(state: SequentialState): Promise<Partial<SequentialState>> {
  logger.info('Drafter agent processing');

  const llm = createLLM();

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a drafting agent. Take the outline provided and write a complete first draft. Be comprehensive but don\'t worry about perfect polish yet.'],
    ['user', 'Outline:\n{outline}\n\nOriginal request:\n{request}'],
  ]);

  const originalRequest = state.messages[0].content;
  const chain = prompt.pipe(llm);
  const response = await chain.invoke({
    outline: state.outline,
    request: originalRequest,
  });

  return {
    draft: response.content as string,
    messages: [...state.messages, new AIMessage({ content: response.content, name: 'DrafterAgent' })],
    next: 'editor',
  };
}

/**
 * Editor Agent - Refines and polishes
 */
async function editorAgent(state: SequentialState): Promise<Partial<SequentialState>> {
  logger.info('Editor agent processing');

  const llm = createLLM();

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', `You are an editing agent. Review the draft and improve it by:
- Fixing grammar and clarity issues
- Improving flow and coherence
- Enhancing readability
- Ensuring it meets the original request

Provide the final polished version.`],
    ['user', 'Draft:\n{draft}\n\nOriginal request:\n{request}'],
  ]);

  const originalRequest = state.messages[0].content;
  const chain = prompt.pipe(llm);
  const response = await chain.invoke({
    draft: state.draft,
    request: originalRequest,
  });

  return {
    finalContent: response.content as string,
    messages: [...state.messages, new AIMessage({ content: response.content, name: 'EditorAgent' })],
    next: 'end',
  };
}

/**
 * Router function
 */
function router(state: SequentialState): string {
  return state.next || END;
}

/**
 * Create sequential agents workflow
 */
export function createSequentialWorkflow() {
  const workflow = new StateGraph<SequentialState>({
    channels: {
      messages: {
        value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
        default: () => [],
      },
      outline: {
        value: (x?: string, y?: string) => y ?? x,
        default: () => undefined,
      },
      draft: {
        value: (x?: string, y?: string) => y ?? x,
        default: () => undefined,
      },
      finalContent: {
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
  workflow.addNode('planner', plannerAgent);
  workflow.addNode('drafter', drafterAgent);
  workflow.addNode('editor', editorAgent);

  // Add edges (strict sequence)
  workflow.addEdge(START, 'planner');

  workflow.addConditionalEdges('planner', router, {
    drafter: 'drafter',
  });

  workflow.addConditionalEdges('drafter', router, {
    editor: 'editor',
  });

  workflow.addConditionalEdges('editor', router, {
    end: END,
  });

  return workflow.compile();
}

/**
 * Run sequential agents workflow
 */
export async function runSequentialAgents(input: string): Promise<string> {
  logger.info('Running sequential agents workflow', { input });

  const workflow = createSequentialWorkflow();

  const result = await workflow.invoke({
    messages: [new HumanMessage(input)],
  });

  // Return final content
  return result.finalContent || result.messages[result.messages.length - 1].content as string;
}
