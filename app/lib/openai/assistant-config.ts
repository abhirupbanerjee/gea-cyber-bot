/**
 * Complete OpenAI Assistant Configuration
 *
 * This file combines all function definitions and system prompts
 * for the GEA Cyber Bot assistant.
 *
 * Use these configurations in the OpenAI Assistant dashboard:
 * 1. Copy `allFunctionsJSON` to the Functions section
 * 2. Copy `completeSystemPrompt` to the Instructions section
 */

import { sonarFunctions, systemPrompt as sonarSystemPrompt } from './function-definitions';

/**
 * All function definitions combined
 */
export const allFunctions = [
  ...sonarFunctions
];

/**
 * JSON formatted functions for OpenAI dashboard
 */
export const allFunctionsJSON = JSON.stringify(allFunctions, null, 2);

/**
 * Complete system prompt combining all capabilities
 */
export const completeSystemPrompt = `${sonarSystemPrompt}

## Function Usage Priority:
- For GitHub repository code analysis → use validate_github_repo + get_code_analysis
- If user provides a GitHub URL, analyze the code quality

## Important Rules:
- ALWAYS validate repository before requesting analysis
- NEVER make up data - only use function call results
- If a function call fails, explain clearly what went wrong
- Focus on actionable insights, not just numbers
`;

/**
 * Export individual components for reference
 */
export { sonarFunctions };
export { sonarSystemPrompt };

/**
 * Helper function to display configuration instructions
 */
export function printAssistantConfig() {
  console.log('=== GEA Cyber Bot Assistant Configuration ===\n');

  console.log('1. FUNCTIONS (Copy this to OpenAI Assistant Functions):');
  console.log('---------------------------------------------------');
  console.log(allFunctionsJSON);
  console.log('\n');

  console.log('2. SYSTEM PROMPT (Copy this to OpenAI Assistant Instructions):');
  console.log('---------------------------------------------------');
  console.log(completeSystemPrompt);
  console.log('\n');

  console.log('=== Configuration Complete ===');
}
