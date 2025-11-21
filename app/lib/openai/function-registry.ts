/**
 * OpenAI Function Call Registry
 *
 * Centralized registry for all function call handlers.
 * This pattern makes it easy to add new functions without modifying
 * the main chat route logic.
 */

import { NextRequest } from 'next/server';

type FunctionHandler = (args: any) => Promise<any>;

/**
 * Registry mapping function names to their handlers
 */
export const functionRegistry: Record<string, FunctionHandler> = {
  /**
   * SonarCloud: Validate GitHub repository
   */
  validate_github_repo: async (args) => {
    const { POST: handler } = await import('@/app/api/sonar/validate-repo/route');
    const mockRequest = { json: async () => args } as NextRequest;
    const response = await handler(mockRequest);
    return await response.json();
  },

  /**
   * SonarCloud: Get code analysis
   */
  get_code_analysis: async (args) => {
    const { POST: handler } = await import('@/app/api/sonar/get-analysis/route');
    const mockRequest = { json: async () => args } as NextRequest;
    const response = await handler(mockRequest);
    return await response.json();
  },

  /**
   * Lighthouse: Analyze website performance
   */
  analyze_website: async (args) => {
    const { POST: handler } = await import('@/app/api/lighthouse/analyze-website/route');
    const mockRequest = { json: async () => args } as NextRequest;
    const response = await handler(mockRequest);
    return await response.json();
  }
};

/**
 * Execute a function call by name with arguments
 *
 * @param functionName - Name of the function to execute
 * @param args - Arguments to pass to the function
 * @returns Promise resolving to function output
 * @throws Error if function is not found in registry
 */
export async function executeFunctionCall(
  functionName: string,
  args: any
): Promise<any> {
  const handler = functionRegistry[functionName];

  if (!handler) {
    throw new Error(`Unknown function: ${functionName}`);
  }

  console.log('[Function Registry]', {
    functionName,
    registeredFunctions: Object.keys(functionRegistry),
    timestamp: new Date().toISOString()
  });

  return await handler(args);
}

/**
 * Check if a function is registered
 */
export function isFunctionRegistered(functionName: string): boolean {
  return functionName in functionRegistry;
}

/**
 * Get list of all registered function names
 */
export function getRegisteredFunctions(): string[] {
  return Object.keys(functionRegistry);
}
