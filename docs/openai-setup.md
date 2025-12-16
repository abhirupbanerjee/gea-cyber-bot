# OpenAI Assistant Setup Guide

Complete guide for configuring your OpenAI Assistant to work with GEA Cyber Bot.

## Prerequisites

- OpenAI API account with access to Assistants API
- Assistant ID (create one at https://platform.openai.com/assistants)

## Step 1: Create or Select Assistant

1. Go to [OpenAI Platform - Assistants](https://platform.openai.com/assistants)
2. Click **Create** or select an existing assistant
3. Choose model: `gpt-4-turbo` or `gpt-4o` (recommended)

## Step 2: Add Functions

Add these functions to your assistant. Click **Add Function** for each:

### Function 1: validate_github_repo

```json
{
  "name": "validate_github_repo",
  "description": "Validates if a GitHub repository URL is configured in SonarCloud for analysis. Call this first when user provides a GitHub URL.",
  "parameters": {
    "type": "object",
    "properties": {
      "github_url": {
        "type": "string",
        "description": "Full GitHub repository URL (e.g., https://github.com/owner/repo)"
      }
    },
    "required": ["github_url"]
  }
}
```

### Function 2: get_code_analysis

```json
{
  "name": "get_code_analysis",
  "description": "Retrieves comprehensive code quality analysis from SonarCloud including bugs, vulnerabilities, code smells, test coverage, and actionable recommendations. Only call after validating the repository.",
  "parameters": {
    "type": "object",
    "properties": {
      "github_url": {
        "type": "string",
        "description": "Full GitHub repository URL that was previously validated (e.g., https://github.com/owner/repo)"
      },
      "include_issues": {
        "type": "boolean",
        "description": "Include detailed list of issues in the analysis (defaults to true)"
      }
    },
    "required": ["github_url"]
  }
}
```

### Function 3: analyze_website_performance

```json
{
  "name": "analyze_website_performance",
  "description": "Analyzes a website's performance using Google PageSpeed Insights. Returns Lighthouse scores (performance, accessibility, SEO, best practices), Core Web Vitals (LCP, FID, CLS, FCP, TTFB), and specific recommendations for improvement. Use this when users ask about website speed, performance, or Core Web Vitals.",
  "strict": true,
  "parameters": {
    "type": "object",
    "properties": {
      "target_url": {
        "type": "string",
        "description": "The full URL of the website to analyze (e.g., https://example.com)"
      },
      "strategy": {
        "type": "string",
        "enum": ["mobile", "desktop"],
        "description": "Test as mobile or desktop device. Use 'mobile' for mobile device simulation, 'desktop' for desktop simulation."
      }
    },
    "required": ["target_url", "strategy"],
    "additionalProperties": false
  }
}
```

**Note:** The `analyze_website_performance` function uses `strict: true` which requires all parameters to be in the `required` array.

## Step 3: Set Instructions

Copy the system prompt from `app/lib/openai/function-definitions.ts` or use this summary:

```
You are GEA Cyber Bot, a senior code review and performance analysis assistant.

## Capabilities
1. Security Analysis (SonarCloud) - Analyzes GitHub repos for bugs, vulnerabilities, code smells
2. Performance Testing (PageSpeed Insights) - Tests websites for Core Web Vitals and Lighthouse scores

## Workflow
- When user provides GitHub URL with "security" context: Run validate_github_repo then get_code_analysis
- When user provides URL with "performance" context: Run analyze_website_performance (default to desktop)
- If unclear, ask which analysis they want

## Response Rules
- Never invent metrics - only use data from function results
- Explain technical terms (LCP, FID, CLS, TTFB, etc.)
- Be actionable - explain what metrics mean and what to do about them
- Use concise markdown with bullet lists and tables
```

See `app/lib/openai/function-definitions.ts` for the complete system prompt.

## Step 4: Configure Environment Variables

Add to your `.env.local`:

```bash
OPENAI_API_KEY=sk-...
OPENAI_ASSISTANT_ID=asst_...
OPENAI_ORGANIZATION=org-...  # Optional

# For PageSpeed (optional but recommended)
PAGESPEED_API_KEY=...
```

## Step 5: Save and Test

1. Click **Save** in the OpenAI dashboard
2. Start the app: `npm run dev`
3. Test with:
   - A configured GitHub URL for security analysis
   - Any public website URL for performance testing

## Troubleshooting

### "server_error" from OpenAI

- Remove `"strict": false` from SonarCloud function definitions (dashboard doesn't support it for non-strict functions)
- Ensure JSON is valid
- Check function names match exactly

### Function not being called

- Verify function description clearly states when to use it
- Check function is saved in dashboard
- For performance testing, ensure user mentions "performance", "speed", or similar keywords

### "Function required parameters list must include all properties when strict is true"

- For functions with `strict: true`, all properties must be listed in the `required` array
- The `analyze_website_performance` function requires both `target_url` and `strategy`

### Missing parameters

- Ensure `required` array is present
- Parameter names are case-sensitive

## Verification Script

Run to check your assistant configuration:

```bash
node scripts/test-openai-assistant.js
```

## Related Files

- [how-to-add-repository.md](how-to-add-repository.md) - Repository configuration
- `app/lib/openai/function-definitions.ts` - Source of truth for functions and system prompt
- `app/lib/pagespeed/` - PageSpeed Insights client implementation
