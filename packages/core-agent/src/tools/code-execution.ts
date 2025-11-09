/**
 * Code Execution Tool
 * Execute Python code in a sandboxed environment
 * WARNING: Only enable if ENABLE_CODE_EXECUTION=true
 */

import { vm } from 'vm2';
import { getEnv, logger, ToolExecutionError } from '@ai-agent-mastery/shared';

interface CodeExecutionInput {
  code: string;
  timeout?: number;
}

/**
 * Validate code for safety
 */
function validateCode(code: string): void {
  const dangerous = [
    'require(',
    'import ',
    'eval(',
    'Function(',
    'process.',
    '__dirname',
    '__filename',
    'child_process',
    'fs.',
    'net.',
    'http.',
    'https.',
  ];

  for (const pattern of dangerous) {
    if (code.includes(pattern)) {
      throw new ToolExecutionError(
        'execute_safe_code',
        `Code contains forbidden pattern: ${pattern}`
      );
    }
  }
}

/**
 * Execute code in sandboxed environment
 */
async function executeCode(code: string, timeout: number): Promise<any> {
  try {
    // Create a sandboxed VM
    const sandbox = {
      console: {
        log: (...args: any[]) => args.join(' '),
      },
      Math,
      JSON,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean,
    };

    // Execute code with timeout
    const VM2 = require('vm2');
    const vm = new VM2.VM({
      timeout,
      sandbox,
      eval: false,
      wasm: false,
    });

    const result = vm.run(code);
    return result;
  } catch (error) {
    logger.error('Code execution failed', { error, code: code.substring(0, 100) });
    throw new ToolExecutionError(
      'execute_safe_code',
      error instanceof Error ? error.message : 'Code execution failed'
    );
  }
}

/**
 * Format execution result
 */
function formatResult(result: any): string {
  if (result === undefined) {
    return 'Code executed successfully. No return value.';
  }

  if (typeof result === 'object') {
    return `Code executed successfully. Result:\n${JSON.stringify(result, null, 2)}`;
  }

  return `Code executed successfully. Result: ${result}`;
}

/**
 * Code execution tool implementation
 */
export async function codeExecutionTool(input: CodeExecutionInput): Promise<string> {
  const { code, timeout = 5000 } = input;
  const env = getEnv();

  // Check if code execution is enabled
  if (!env.ENABLE_CODE_EXECUTION) {
    throw new ToolExecutionError(
      'execute_safe_code',
      'Code execution is disabled. Set ENABLE_CODE_EXECUTION=true to enable (security risk).'
    );
  }

  logger.info('Executing code', { codeLength: code.length, timeout });

  try {
    // Validate code
    validateCode(code);

    // Execute code
    const result = await executeCode(code, timeout);

    logger.info('Code execution completed', {
      resultType: typeof result,
    });

    // Format and return result
    return formatResult(result);
  } catch (error) {
    logger.error('Code execution tool failed', { error, code: code.substring(0, 100) });
    throw error;
  }
}

/**
 * Tool definition for Mastra
 */
export const codeExecutionToolDefinition = {
  name: 'execute_safe_code',
  description: 'Execute JavaScript code in a sandboxed environment for calculations and data processing. Only basic operations are allowed - no file system, network, or system access.',
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'The JavaScript code to execute',
      },
      timeout: {
        type: 'number',
        description: 'Execution timeout in milliseconds (default: 5000)',
        default: 5000,
      },
    },
    required: ['code'],
  },
  execute: codeExecutionTool,
};
