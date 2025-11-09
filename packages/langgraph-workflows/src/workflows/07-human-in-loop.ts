/**
 * Human-in-the-Loop (7.8)
 * Allows human intervention and approval at critical points
 */

import { StateGraph, END, START, Interrupt } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createLLM } from '../utils/llm-factory.js';
import { logger } from '@ai-agent-mastery/shared';

interface HumanLoopState {
  messages: BaseMessage[];
  draftResponse?: string;
  humanFeedback?: string;
  humanApproved: boolean;
  revisionCount: number;
  next?: string;
}

/**
 * Draft Agent - Creates initial response
 */
async function draftAgent(state: HumanLoopState): Promise<Partial<HumanLoopState>> {
  logger.info('Draft agent processing', { revisionCount: state.revisionCount });

  const llm = createLLM();

  let prompt: ChatPromptTemplate;

  // If we have feedback, incorporate it
  if (state.humanFeedback) {
    prompt = ChatPromptTemplate.fromMessages([
      ['system', 'You are a helpful assistant. A human has reviewed your previous response and provided feedback. Revise your response based on their feedback.'],
      ['placeholder', '{messages}'],
      ['user', 'Human feedback: {feedback}\n\nPlease revise your response accordingly.'],
    ]);

    const chain = prompt.pipe(llm);
    const response = await chain.invoke({
      messages: state.messages,
      feedback: state.humanFeedback,
    });

    return {
      draftResponse: response.content as string,
      messages: [
        ...state.messages,
        new AIMessage({ content: `[Revision ${state.revisionCount}]\n${response.content}`, name: 'DraftAgent' }),
      ],
      next: 'human_review',
    };
  } else {
    // Initial draft
    prompt = ChatPromptTemplate.fromMessages([
      ['system', 'You are a helpful assistant. Provide a thoughtful response to the user\'s request. This will be reviewed by a human before being finalized.'],
      ['placeholder', '{messages}'],
    ]);

    const chain = prompt.pipe(llm);
    const response = await chain.invoke({ messages: state.messages });

    return {
      draftResponse: response.content as string,
      messages: [
        ...state.messages,
        new AIMessage({ content: response.content, name: 'DraftAgent' }),
      ],
      next: 'human_review',
    };
  }
}

/**
 * Human Review Node - Interrupts for human feedback
 * In a real implementation, this would pause and wait for human input
 */
async function humanReviewNode(state: HumanLoopState): Promise<Partial<HumanLoopState>> {
  logger.info('Human review checkpoint - waiting for feedback');

  // In LangGraph, this would trigger an interrupt
  // For this example, we'll simulate it
  // In production, this would pause execution and wait for human input

  // Throw an Interrupt to pause execution
  // The human can then provide feedback and resume
  throw new Interrupt({
    message: 'Human review required',
    data: {
      draftResponse: state.draftResponse,
      promptForHuman: 'Please review the draft response. Provide feedback or approve (type "approve" to continue):',
    },
  });
}

/**
 * Process Human Feedback
 */
async function processFeedback(state: HumanLoopState): Promise<Partial<HumanLoopState>> {
  logger.info('Processing human feedback', { approved: state.humanApproved });

  // If approved, we're done
  if (state.humanApproved) {
    return {
      next: 'finalize',
    };
  }

  // If not approved and we have feedback, revise
  if (state.humanFeedback && state.revisionCount < 5) {
    return {
      next: 'draft',
      revisionCount: state.revisionCount + 1,
    };
  }

  // Max revisions reached
  logger.warn('Max revisions reached');
  return {
    next: 'finalize',
  };
}

/**
 * Finalize Agent - Prepares final response
 */
async function finalizeAgent(state: HumanLoopState): Promise<Partial<HumanLoopState>> {
  logger.info('Finalizing response');

  const finalMessage = state.humanApproved
    ? `[APPROVED BY HUMAN]\n${state.draftResponse}`
    : `[FINAL VERSION AFTER ${state.revisionCount} REVISIONS]\n${state.draftResponse}`;

  return {
    messages: [...state.messages, new AIMessage({ content: finalMessage, name: 'FinalAgent' })],
    next: 'end',
  };
}

/**
 * Router function
 */
function router(state: HumanLoopState): string {
  return state.next || END;
}

/**
 * Create human-in-the-loop workflow
 */
export function createHumanLoopWorkflow() {
  const workflow = new StateGraph<HumanLoopState>({
    channels: {
      messages: {
        value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
        default: () => [],
      },
      draftResponse: {
        value: (x?: string, y?: string) => y ?? x,
        default: () => undefined,
      },
      humanFeedback: {
        value: (x?: string, y?: string) => y ?? x,
        default: () => undefined,
      },
      humanApproved: {
        value: (x: boolean, y: boolean) => y ?? x,
        default: () => false,
      },
      revisionCount: {
        value: (x: number, y: number) => y ?? x,
        default: () => 0,
      },
      next: {
        value: (x?: string, y?: string) => y ?? x,
        default: () => undefined,
      },
    },
  });

  // Add nodes
  workflow.addNode('draft', draftAgent);
  workflow.addNode('human_review', humanReviewNode);
  workflow.addNode('process_feedback', processFeedback);
  workflow.addNode('finalize', finalizeAgent);

  // Add edges
  workflow.addEdge(START, 'draft');

  workflow.addConditionalEdges('draft', router, {
    human_review: 'human_review',
  });

  workflow.addEdge('human_review', 'process_feedback');

  workflow.addConditionalEdges('process_feedback', router, {
    draft: 'draft',
    finalize: 'finalize',
  });

  workflow.addConditionalEdges('finalize', router, {
    end: END,
  });

  return workflow.compile();
}

/**
 * Run human-in-the-loop workflow
 *
 * Note: In production, this would be async and support resumption
 * The workflow would pause at human_review and wait for input
 */
export async function runHumanLoopWorkflow(
  input: string,
  humanFeedbackCallback?: (draft: string) => Promise<{ approved: boolean; feedback?: string }>
): Promise<string> {
  logger.info('Running human-in-the-loop workflow', { input });

  const workflow = createHumanLoopWorkflow();

  try {
    // Initial run
    const result = await workflow.invoke({
      messages: [new HumanMessage(input)],
      humanApproved: false,
      revisionCount: 0,
    });

    // Get final message
    const messages = result.messages;
    const lastMessage = messages[messages.length - 1];

    return lastMessage.content as string;
  } catch (error: any) {
    // Handle interrupt for human review
    if (error?.message === 'Human review required' && humanFeedbackCallback) {
      const draftResponse = error.data?.draftResponse;

      if (draftResponse) {
        // Get human feedback
        const feedback = await humanFeedbackCallback(draftResponse);

        // Resume with feedback
        const resumedResult = await workflow.invoke({
          messages: [new HumanMessage(input)],
          draftResponse,
          humanFeedback: feedback.feedback,
          humanApproved: feedback.approved,
          revisionCount: 1,
        });

        const messages = resumedResult.messages;
        const lastMessage = messages[messages.length - 1];

        return lastMessage.content as string;
      }
    }

    throw error;
  }
}

/**
 * Example usage with simulated human feedback
 */
export async function runHumanLoopWorkflowExample(input: string): Promise<string> {
  return runHumanLoopWorkflow(input, async (draft: string) => {
    // Simulated human review
    logger.info('Simulated human reviewing draft', { draftLength: draft.length });

    // For demo purposes, approve automatically
    // In real usage, this would be interactive
    return {
      approved: true,
    };
  });
}
