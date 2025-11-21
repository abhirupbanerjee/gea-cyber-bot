# GEA Cyber Bot - AI Code Review Assistant

An AI-powered chat assistant integrated with SonarCloud for comprehensive code quality analysis and security reviews.

## Features

- 💬 Interactive chat interface powered by OpenAI Assistants API
- 🔍 Code quality analysis using SonarCloud integration
- 🐛 Automated bug and vulnerability detection
- 📊 Detailed metrics and recommendations
- 🔒 Security hotspot identification
- ⚡ Real-time analysis through GitHub URL input

---

## Prerequisites

Before you begin, ensure you have the following:

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **OpenAI API Account** - [Sign up](https://platform.openai.com/)
3. **SonarCloud Account** - [Sign up](https://sonarcloud.io/)
4. **Vercel Account** (for deployment) - [Sign up](https://vercel.com/)

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/gea-cyber-bot.git
cd gea-cyber-bot
npm install
```

### 2. Configure OpenAI Assistant

1. Go to [OpenAI Platform](https://platform.openai.com/assistants)
2. Create a new Assistant
3. **Add the following functions** from `app/lib/openai/function-definitions.ts`:

**Function 1: validate_github_repo**
```json
{
  "name": "validate_github_repo",
  "description": "Validates if a GitHub repository URL is configured in SonarCloud for analysis. Call this first when user provides a GitHub URL.",
  "strict": false,
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

**Function 2: get_code_analysis**
```json
{
  "name": "get_code_analysis",
  "description": "Retrieves comprehensive code quality analysis from SonarCloud including bugs, vulnerabilities, code smells, test coverage, and actionable recommendations. Only call after validating the repository.",
  "strict": false,
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

4. **Add the system prompt** (Instructions field):

```
You are a technical code review assistant that helps developers understand their code quality using SonarCloud static analysis.

When user provides a GitHub URL:
1. First call validate_github_repo(github_url) to check if it's configured
2. If valid, call get_code_analysis(github_url) to get full analysis
3. If invalid, explain they need to configure it in SonarCloud first

When presenting analysis results:
- Start with executive summary (overall health rating)
- Highlight critical issues (bugs, vulnerabilities) first
- Explain key metrics in simple terms
- Provide actionable recommendations

Report Structure:
# Code Quality Report: [Repo Name]

## 📊 Overview
- Lines of Code: [number]
- Overall Maintainability: [A-E rating]
- Technical Debt: [X hours/days]

## 🚨 Critical Issues
[List bugs and vulnerabilities with severity]

## 📈 Quality Metrics
- Code Coverage: [%]
- Code Duplication: [%]
- Code Smells: [number]

## 💡 Recommendations
1. [Prioritized action items]

Important Rules:
- ALWAYS validate repository before requesting analysis
- NEVER make up data - only use function call results
- Focus on actionable insights, not just numbers
```

5. Copy the **Assistant ID**

### 3. Configure SonarCloud

1. Go to [SonarCloud](https://sonarcloud.io)
2. Log in with your GitHub account
3. **Import your repositories:**
   - Click "+" → "Analyze new project"
   - Select repositories to analyze
   - Enable "Automatic Analysis" or configure CI-based analysis
4. **Get your project keys:**
   - Go to each project → Project Information
   - Copy the "Project Key" (e.g., `owner_repository`)
5. **Generate Access Token:**
   - Go to My Account → Security
   - Generate new token with "Browse" permission
   - Copy the token value
6. **Get Organization Key:**
   - Go to your organization page
   - Copy the key from the URL: `https://sonarcloud.io/organizations/{YOUR_ORG_KEY}`

### 4. Configure Repository List

Edit `app/config/sonar-repos.json` to add your repositories:

```json
{
  "repositories": [
    {
      "githubUrl": "https://github.com/yourusername/your-repo",
      "sonarProjectKey": "yourusername_your-repo",
      "displayName": "Your Repository Name",
      "branch": "main",
      "configured": true,
      "lastSync": "2025-11-20T00:00:00Z"
    }
  ]
}
```

### 5. Set Environment Variables

Create `.env.local` file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_ASSISTANT_ID=asst_...
OPENAI_ORGANIZATION=org-...

# SonarCloud Configuration
SONARCLOUD_TOKEN=your_sonarcloud_token_here
SONARCLOUD_ORGANIZATION=your_sonarcloud_org_key
```

---

## Local Development

```bash
# Run development server
npm run dev

# Open browser at http://localhost:3000
```

**Test the integration:**
1. Paste a GitHub URL from your configured repositories
2. The bot will validate and fetch analysis
3. Review the generated code quality report

---

## Deployment to Vercel

1. Push your code to GitHub:
```bash
git add .
git commit -m "Add SonarCloud integration"
git push origin main
```

2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. **Add Environment Variables:**
   - `OPENAI_API_KEY`
   - `OPENAI_ASSISTANT_ID`
   - `OPENAI_ORGANIZATION`
   - `SONARCLOUD_TOKEN`
   - `SONARCLOUD_ORGANIZATION`
6. Click "Deploy"

---

## Troubleshooting

### "Repository not configured" Error
- Verify the GitHub URL is in `app/config/sonar-repos.json`
- Ensure the URL matches exactly
- Check that the repository is imported in SonarCloud

### "Authentication failed" Error
- Regenerate your SonarCloud token
- Update `SONARCLOUD_TOKEN` in environment variables
- Redeploy if on Vercel

---

## License

MIT License - see LICENSE file for details.
