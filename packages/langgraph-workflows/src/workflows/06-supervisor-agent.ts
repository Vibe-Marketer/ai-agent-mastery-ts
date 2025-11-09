/**
 * Supervisor Agent (7.7)
 * A supervisor coordinates and delegates to worker agents
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { createLLM } from '../utils/llm-factory.js';
import { logger } from '@ai-agent-mastery/shared';

interface SupervisorState {
  messages: BaseMessage[];
  nextAgent?: string;
  taskComplete: boolean;
  iterations: number;
}

const SupervisorDecisionSchema = z.object({
  next: z.enum(['researcher', 'coder', 'writer', 'finish']),
  reasoning: z.string(),
});

/**
 * Supervisor Agent - Coordinates workflow
 */
async function supervisorAgent(state: SupervisorState): Promise<Partial<SupervisorState>> {
  logger.info('Supervisor agent processing', { iteration: state.iterations });

  // Prevent infinite loops
  if (state.iterations >= 10) {
    logger.warn('Max iterations reached, finishing');
    return {
      nextAgent: 'finish',
      taskComplete: true,
    };
  }

  const llm = createLLM({ temperature: 0 });

  const availableAgents = [
    'researcher: Gathers information and facts',
    'coder: Writes code and technical implementations',
    'writer: Creates written content and documentation',
    'finish: Task is complete',
  ];

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', `You are a supervisor agent managing a team of specialized workers:

${availableAgents.join('\n')}

Based on the conversation history and the current task state, decide which agent should work next.
If the task is complete, choose "finish".

Respond with JSON: {"next": "<agent>", "reasoning": "<why>"}`],
    ['placeholder', '{messages}'],
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ messages: state.messages });

  // Parse decision
  let next = 'finish';
  try {
    const content = response.content as string;
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const parsed = SupervisorDecisionSchema.parse(JSON.parse(jsonMatch[0]));
      next = parsed.next;
      logger.info('Supervisor decision', { next, reasoning: parsed.reasoning });

      // Add supervisor's decision to messages
      state.messages.push(
        new SystemMessage({
          content: `Supervisor assigned task to: ${next}. Reasoning: ${parsed.reasoning}`,
          name: 'Supervisor',
        })
      );
    }
  } catch (error) {
    logger.warn('Failed to parse supervisor decision, finishing', { error });
  }

  return {
    nextAgent: next,
    taskComplete: next === 'finish',
    iterations: state.iterations + 1,
  };
}

/**
 * Researcher Agent
 */
async function researcherAgent(state: SupervisorState): Promise<Partial<SupervisorState>> {
  logger.info('Researcher agent processing');

  const llm = createLLM();

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a researcher. Gather relevant information and facts to help complete the task. Be thorough and cite sources when possible.'],
    ['placeholder', '{messages}'],
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ messages: state.messages });

  return {
    messages: [...state.messages, new AIMessage({ content: response.content, name: 'Researcher' })],
    nextAgent: 'supervisor',
  };
}

/**
 * Coder Agent
 */
async function coderAgent(state: SupervisorState): Promise<Partial<SupervisorState>> {
  logger.info('Coder agent processing');

  const llm = createLLM();

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a coding expert. Write clean, well-documented code to solve the technical aspects of the task. Include explanations.'],
    ['placeholder', '{messages}'],
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ messages: state.messages });

  return {
    messages: [...state.messages, new AIMessage({ content: response.content, name: 'Coder' })],
    nextAgent: 'supervisor',
  };
}

/**
 * Writer Agent
 */
async function writerAgent(state: SupervisorState): Promise<Partial<SupervisorState>> {
  logger.info('Writer agent processing');

  const llm = createLLM();

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a writer. Create clear, engaging documentation or explanations based on the work done by other agents. Make it accessible and well-structured.'],
    ['placeholder', '{messages}'],
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ messages: state.messages });

  return {
    messages: [...state.messages, new AIMessage({ content: response.content, name: 'Writer' })],
    nextAgent: 'supervisor',
  };
}

/**
 * Router function
 */
function router(state: SupervisorState): string {
  if (state.taskComplete || !state.nextAgent) {
    return END;
  }
  return state.nextAgent;
}

/**
 * Create supervisor workflow
 */
export function createSupervisorWorkflow() {
  const workflow = new StateGraph<SupervisorState>({
    channels: {
      messages: {
        value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
        default: () => [],
      },
      nextAgent: {
        value: (x?: string, y?: string) => y ?? x,
        default: () => undefined,
      },
      taskComplete: {
        value: (x: boolean, y: boolean) => y ?? x,
        default: () => false,
      },
      iterations: {
        value: (x: number, y: number) => y ?? x,
        default: () => 0,
      },
    },
  });

  // Add nodes
  workflow.addNode('supervisor', supervisorAgent);
  workflow.addNode('researcher', researcherAgent);
  workflow.addNode('coder', coderAgent);
  workflow.addNode('writer', writerAgent);

  // Start with supervisor
  workflow.addEdge(START, 'supervisor');

  // Supervisor routes to workers or finish
  workflow.addConditionalEdges('supervisor', router, {
    researcher: 'researcher',
    coder: 'coder',
    writer: 'writer',
    finish: END,
  });

  // Workers return to supervisor
  workflow.addConditionalEdges('researcher', router, {
    supervisor: 'supervisor',
  });
  workflow.addConditionalEdges('coder', router, {
    supervisor: 'supervisor',
  });
  workflow.addConditionalEdges('writer', router, {
    supervisor: 'supervisor',
  });

  return workflow.compile();
}

/**
 * Run supervisor workflow
 */
export async function runSupervisorWorkflow(input: string): Promise<string> {
  logger.info('Running supervisor workflow', { input });

  const workflow = createSupervisorWorkflow();

  const result = await workflow.invoke({
    messages: [new HumanMessage(input)],
    taskComplete: false,
    iterations: 0,
  });

  // Get final message
  const messages = result.messages;
  const lastMessage = messages[messages.length - 1];

  return lastMessage.content as string;
}
