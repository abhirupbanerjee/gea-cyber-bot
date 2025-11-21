/**
 * Utility for normalizing OpenAI function arguments
 *
 * Converts snake_case parameters from OpenAI function calls
 * to camelCase for internal API consumption.
 */

/**
 * Normalize function arguments from snake_case to camelCase
 */
export function normalizeApiArgs(args: Record<string, any>): Record<string, any> {
  const normalized = { ...args };

  // GitHub URL normalization (for SonarCloud functions)
  if (normalized.github_url !== undefined) {
    normalized.githubUrl = normalized.github_url;
    delete normalized.github_url;
  }

  // Include issues normalization (for SonarCloud functions)
  if (normalized.include_issues !== undefined) {
    normalized.includeIssues = normalized.include_issues;
    delete normalized.include_issues;
  }

  // URL normalization (for Lighthouse functions - already in correct format)
  // No transformation needed for 'url' parameter

  // Strategy normalization (for Lighthouse functions - already in correct format)
  // No transformation needed for 'strategy' parameter

  return normalized;
}

/**
 * Type-safe normalization with explicit mappings
 */
export const PARAM_MAPPINGS: Record<string, string> = {
  github_url: 'githubUrl',
  include_issues: 'includeIssues',
  // Add more mappings as needed
};

/**
 * Generic normalization using mapping table
 */
export function normalizeWithMappings(
  args: Record<string, any>,
  mappings: Record<string, string> = PARAM_MAPPINGS
): Record<string, any> {
  const normalized = { ...args };

  for (const [snakeCase, camelCase] of Object.entries(mappings)) {
    if (normalized[snakeCase] !== undefined) {
      normalized[camelCase] = normalized[snakeCase];
      delete normalized[snakeCase];
    }
  }

  return normalized;
}
