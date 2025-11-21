/**
 * OpenAI Function Definitions for SonarCloud Integration
 *
 * These functions should be added to your OpenAI Assistant configuration
 * in the OpenAI platform dashboard.
 *
 * Format follows OpenAI's function calling specification.
 */

export const sonarFunctions = [
  {
    name: "validate_github_repo",
    description: "Validates if a GitHub repository URL is configured in SonarCloud for analysis. Call this first when user provides a GitHub URL.",
    strict: false,
    parameters: {
      type: "object",
      properties: {
        github_url: {
          type: "string",
          description: "Full GitHub repository URL (e.g., https://github.com/owner/repo)"
        }
      },
      required: ["github_url"]
    }
  },
  {
    name: "get_code_analysis",
    description: "Retrieves comprehensive code quality analysis from SonarCloud including bugs, vulnerabilities, code smells, test coverage, and actionable recommendations. Only call after validating the repository.",
    strict: false,
    parameters: {
      type: "object",
      properties: {
        github_url: {
          type: "string",
          description: "Full GitHub repository URL that was previously validated (e.g., https://github.com/owner/repo)"
        },
        include_issues: {
          type: "boolean",
          description: "Include detailed list of issues in the analysis (defaults to true)"
        }
      },
      required: ["github_url"]
    }
  }
];

// Export formatted JSON for easy copying to OpenAI Assistant dashboard
export const sonarFunctionsJSON = JSON.stringify(sonarFunctions, null, 2);

/**
 * System Prompt for OpenAI Assistant
 *
 * Add this to your Assistant's instructions in the OpenAI platform.
 */
export const systemPrompt = `You are a technical code review assistant that helps developers understand their code quality using SonarCloud static analysis.

## Your Workflow:

1. **When user provides a GitHub URL:**
   - First call validate_github_repo(github_url) to check if it's configured
   - If valid, call get_code_analysis(github_url) to get full analysis
   - If invalid, explain they need to configure it in SonarCloud first

2. **When presenting analysis results:**
   - Start with executive summary (overall health rating)
   - Highlight critical issues (bugs, vulnerabilities) first
   - Explain key metrics in simple terms
   - Group related problems together
   - Provide actionable recommendations

3. **Report Structure:**
   # Code Quality Report: [Repo Name]

   ## 📊 Overview
   - Lines of Code: [number]
   - Overall Maintainability: [A-E rating]
   - Technical Debt: [X hours/days]

   ## 🚨 Critical Issues
   - [List bugs and vulnerabilities with severity]

   ## 📈 Quality Metrics
   - Code Coverage: [%]
   - Code Duplication: [%]
   - Code Smells: [number]

   ## 💡 Recommendations
   1. [Prioritized action items]

4. **Communication Style:**
   - Be concise and technical
   - Use bullet points and sections
   - Explain impact, not just metrics
   - Suggest specific next steps
   - If coverage <80% → recommend increasing tests
   - If bugs >10 → prioritize bug fixes
   - If security issues exist → address immediately

## Important Rules:
- ALWAYS validate repository before requesting analysis
- NEVER make up data - only use function call results
- If a function call fails, explain clearly what went wrong
- Focus on actionable insights, not just numbers
`;
