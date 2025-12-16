# GEA Cyber Bot - User Manual

**Version:** 1.0
**Date:** December 2025

---

## Table of Contents

### Part A: Administrator Guide
1. [System Requirements](#1-system-requirements)
2. [Installation](#2-installation)
3. [Configuration](#3-configuration)
4. [OpenAI Assistant Setup](#4-openai-assistant-setup)
5. [Repository Management](#5-repository-management)
6. [Deployment](#6-deployment)
7. [Maintenance](#7-maintenance)
8. [Troubleshooting](#8-troubleshooting-admin)

### Part B: User Guide
9. [Getting Started](#9-getting-started)
10. [Security Analysis](#10-security-analysis)
11. [Performance Testing](#11-performance-testing)
12. [Understanding Reports](#12-understanding-reports)
13. [Tips and Best Practices](#13-tips-and-best-practices)
14. [Troubleshooting](#14-troubleshooting-user)
15. [FAQ](#15-faq)

---

# Part A: Administrator Guide

---

## 1. System Requirements

### Prerequisites

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | 18.x | 20.x or later |
| npm | 9.x | 10.x or later |
| Memory | 512 MB | 1 GB |
| Storage | 100 MB | 500 MB |

### Required Accounts

| Service | Purpose | Required |
|---------|---------|----------|
| OpenAI | AI Assistant API | Yes |
| SonarCloud | Code analysis | Yes |
| Google Cloud | PageSpeed API | Optional |
| Vercel/Azure | Deployment | For production |

### API Keys Required

1. **OpenAI API Key** - For AI assistant functionality
2. **OpenAI Assistant ID** - Pre-configured assistant
3. **SonarCloud Token** - For code analysis
4. **PageSpeed API Key** - Optional, for higher rate limits

---

## 2. Installation

### Step 2.1: Clone Repository

```bash
git clone <repository-url>
cd gea-cyber-bot
```

### Step 2.2: Install Dependencies

```bash
npm install
```

### Step 2.3: Create Environment File

```bash
cp .env.example .env.local
```

### Step 2.4: Verify Installation

```bash
npm run build
```

If the build completes without errors, installation is successful.

---

## 3. Configuration

### 3.1 Environment Variables

Edit `.env.local` with your credentials:

```bash
# OpenAI Configuration (Required)
OPENAI_API_KEY=sk-proj-...
OPENAI_ASSISTANT_ID=asst_...
OPENAI_ORGANIZATION=org-...    # Optional

# SonarCloud Configuration (Required)
SONARCLOUD_TOKEN=...
SONARCLOUD_ORGANIZATION=...

# Google PageSpeed (Optional - recommended for production)
PAGESPEED_API_KEY=...
```

### 3.2 Getting API Keys

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Navigate to **API Keys**
3. Click **Create new secret key**
4. Copy and save the key securely

#### SonarCloud Token
1. Log in to [SonarCloud](https://sonarcloud.io)
2. Go to **My Account** > **Security**
3. Generate a new token with `Analysis` scope
4. Copy and save the token

#### PageSpeed API Key (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **PageSpeed Insights API**
4. Create credentials > API Key
5. Restrict key to PageSpeed Insights API

---

## 4. OpenAI Assistant Setup

### 4.1 Create Assistant

1. Go to [OpenAI Assistants](https://platform.openai.com/assistants)
2. Click **Create**
3. Configure:
   - **Name:** GEA Cyber Bot
   - **Model:** gpt-4o (recommended) or gpt-4-turbo
   - **Instructions:** Copy from `app/lib/openai/function-definitions.ts`

### 4.2 Add Functions

Add these three functions to your assistant:

#### Function 1: validate_github_repo

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

#### Function 2: get_code_analysis

```json
{
  "name": "get_code_analysis",
  "description": "Retrieves comprehensive code quality analysis from SonarCloud including bugs, vulnerabilities, code smells, test coverage, and actionable recommendations. Only call after validating the repository.",
  "parameters": {
    "type": "object",
    "properties": {
      "github_url": {
        "type": "string",
        "description": "Full GitHub repository URL that was previously validated"
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

#### Function 3: analyze_website_performance

```json
{
  "name": "analyze_website_performance",
  "strict": true,
  "description": "Analyzes a website's performance using Google PageSpeed Insights. Returns Lighthouse scores, Core Web Vitals, and recommendations.",
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
        "description": "Test as mobile or desktop device"
      }
    },
    "required": ["target_url", "strategy"],
    "additionalProperties": false
  }
}
```

### 4.3 Save and Test

1. Click **Save** in OpenAI dashboard
2. Copy the **Assistant ID** (starts with `asst_`)
3. Add to `.env.local` as `OPENAI_ASSISTANT_ID`

---

## 5. Repository Management

### 5.1 Configuration File Location

| Environment | Location |
|-------------|----------|
| Production | `public/config/sonar-repos.json` |
| Development | `app/config/sonar-repos.json` (fallback) |

### 5.2 Adding a Repository

Edit `public/config/sonar-repos.json`:

```json
{
  "repositories": [
    {
      "githubUrl": "https://github.com/owner/repo.git",
      "sonarProjectKey": "owner_repo",
      "displayName": "My Application",
      "branch": "main",
      "configured": true,
      "lastSync": "2025-12-16T00:00:00Z"
    }
  ]
}
```

### 5.3 Field Reference

| Field | Description | Example |
|-------|-------------|---------|
| `githubUrl` | Full GitHub URL (with .git) | `https://github.com/org/repo.git` |
| `sonarProjectKey` | SonarCloud project identifier | `org_repo` |
| `displayName` | Name shown in UI | `My Application` |
| `branch` | Branch to monitor | `main` |
| `configured` | Enable/disable without removing | `true` |
| `lastSync` | ISO 8601 timestamp | `2025-12-16T00:00:00Z` |

### 5.4 Finding SonarCloud Project Key

1. Log in to SonarCloud
2. Navigate to your project
3. Go to **Project Information**
4. Copy the **Project Key**

---

## 6. Deployment

### 6.1 Local Development

```bash
npm run dev
# Open http://localhost:3000
```

### 6.2 Vercel Deployment

1. Push code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/dashboard)
3. Add environment variables:
   - `OPENAI_API_KEY`
   - `OPENAI_ASSISTANT_ID`
   - `SONARCLOUD_TOKEN`
   - `SONARCLOUD_ORGANIZATION`
   - `PAGESPEED_API_KEY` (optional)
4. Deploy

### 6.3 Azure Deployment

1. Create Azure App Service
2. Configure deployment from GitHub
3. Add environment variables in **Configuration** > **Application settings**
4. Ensure `public/config/sonar-repos.json` is included

### 6.4 Post-Deployment Verification

1. Open the deployed URL
2. Check browser console for: `[ChatApp] Loaded N configured repositories`
3. Test a security analysis on a configured repository
4. Test a performance analysis on any public URL

---

## 7. Maintenance

### 7.1 Updating Repositories

1. Edit `public/config/sonar-repos.json`
2. Commit and push changes
3. Redeploy (automatic on Vercel)

### 7.2 Rotating API Keys

1. Generate new key in respective service
2. Update `.env.local` (development) or environment variables (production)
3. Redeploy application
4. Revoke old key after confirming new key works

### 7.3 Monitoring

Check these logs for issues:
- **Vercel:** Functions tab > View logs
- **Azure:** Application Insights or Log Stream
- **Browser:** DevTools Console (F12)

### 7.4 Backup Checklist

Regularly backup:
- `public/config/sonar-repos.json`
- Environment variable values
- OpenAI Assistant configuration

---

## 8. Troubleshooting (Admin)

### "No repositories configured" Error

**Cause:** Config file not found or not deployed

**Solutions:**
1. Verify file exists: `public/config/sonar-repos.json`
2. Check git tracking: `git ls-files public/config/sonar-repos.json`
3. Verify JSON syntax: `cat public/config/sonar-repos.json | jq`
4. Check deployment logs for config loading messages

### "Authentication failed" from SonarCloud

**Cause:** Invalid or expired token

**Solutions:**
1. Generate new token in SonarCloud
2. Update `SONARCLOUD_TOKEN` environment variable
3. Redeploy application

### OpenAI Functions Not Being Called

**Cause:** Assistant misconfiguration

**Solutions:**
1. Verify functions are saved in OpenAI dashboard
2. Check function names match exactly (case-sensitive)
3. Ensure system prompt includes usage instructions
4. Run test script: `node scripts/test-openai-assistant.js`

### PageSpeed Analysis Timeout

**Cause:** Target site slow or blocking requests

**Solutions:**
1. Verify URL is publicly accessible
2. Check if site blocks automated requests
3. Try a different URL to isolate the issue
4. Add `PAGESPEED_API_KEY` for higher rate limits

---

# Part B: User Guide

---

## 9. Getting Started

### 9.1 Accessing the Bot

1. Open the GEA Cyber Bot URL in your browser
2. You'll see the welcome screen with three options

### 9.2 Welcome Screen Options

| Option | Description |
|--------|-------------|
| **How-To Guide** | Learn about bot capabilities |
| **Code Analysis** | Select a repository for security analysis |
| **Website Review** | Enter any URL for performance testing |

### 9.3 Chat Interface

- Type messages in the input field at the bottom
- Press **Enter** or click **Send** to submit
- Use **Copy Chat** to copy the conversation
- Use **Clear Chat** to start fresh

---

## 10. Security Analysis

### 10.1 Starting a Security Analysis

**Option A: From Welcome Screen**
1. Click **Code Analysis**
2. Select a repository from the list
3. Bot will automatically analyze

**Option B: Via Chat**
Type a message like:
- "Analyze the security of [repository name]"
- "Check [repository name] for vulnerabilities"
- "Run security analysis on [repository name]"

### 10.2 What Gets Analyzed

| Category | Description |
|----------|-------------|
| **Bugs** | Logic errors, null pointers, type mismatches |
| **Vulnerabilities** | SQL injection, XSS, authentication flaws |
| **Security Hotspots** | Code requiring manual security review |
| **Code Smells** | Maintainability issues, complexity |
| **Coverage** | Test coverage percentage |
| **Duplication** | Duplicate code percentage |
| **Technical Debt** | Time estimate to fix all issues |

### 10.3 Understanding Ratings

| Rating | Description |
|--------|-------------|
| A | Best - minimal issues |
| B | Good - minor issues |
| C | Moderate - some issues need attention |
| D | Poor - significant issues |
| E | Worst - critical issues require immediate action |

### 10.4 Sample Security Report

```
## Repository: My Application
Health status: Needs Attention

### Key Metrics
- **Lines of code:** 12,500
- **Bugs:** 5
- **Vulnerabilities:** 2
- **Security hotspots:** 3
- **Code smells:** 150
- **Test coverage:** 45%
- **Technical debt:** 8 hours

### Top Risks
1. SQL injection vulnerability in user input handling
2. Missing authentication on admin endpoints
3. Exposed API keys in configuration

### Recommended Actions
- [P0] Fix SQL injection in UserController.java:142
- [P1] Add authentication middleware to admin routes
- [P2] Move secrets to environment variables
```

---

## 11. Performance Testing

### 11.1 Starting a Performance Test

**Option A: From Welcome Screen**
1. Click **Website Review**
2. Enter the URL to test
3. Select **Desktop** or **Mobile**
4. Click **Analyze**

**Option B: Via Chat**
Type a message like:
- "Test the performance of https://example.com"
- "Analyze https://example.com on mobile"
- "Check the speed of https://example.com"

### 11.2 Device Modes

| Mode | Description |
|------|-------------|
| **Desktop** | Standard desktop browser simulation |
| **Mobile** | Mobile device with network throttling |

### 11.3 What Gets Measured

#### Lighthouse Scores (0-100)

| Score | Category | Description |
|-------|----------|-------------|
| Performance | Overall speed and responsiveness |
| Accessibility | Usability for people with disabilities |
| Best Practices | Security and modern web standards |
| SEO | Search engine optimization readiness |

#### Core Web Vitals

| Metric | Full Name | Good Threshold |
|--------|-----------|----------------|
| LCP | Largest Contentful Paint | < 2.5 seconds |
| FID | First Input Delay | < 100 ms |
| CLS | Cumulative Layout Shift | < 0.1 |
| FCP | First Contentful Paint | < 1.8 seconds |
| TTFB | Time to First Byte | < 800 ms |

### 11.4 Sample Performance Report

```
## Performance Report: https://example.com
Device: Desktop
Status: Needs Improvement

### Lighthouse Scores
| Category | Score | Status |
|----------|-------|--------|
| Performance | 72/100 | Needs Improvement |
| Accessibility | 95/100 | Good |
| Best Practices | 88/100 | Needs Improvement |
| SEO | 92/100 | Good |

### Core Web Vitals
| Metric | Value | Status |
|--------|-------|--------|
| LCP | 3.2s | Needs Improvement |
| FID | 45ms | Good |
| CLS | 0.05 | Good |

### Top Opportunities
1. Serve images in next-gen formats (save 1.2s)
2. Eliminate render-blocking resources (save 0.8s)
3. Reduce unused JavaScript (save 0.5s)
```

---

## 12. Understanding Reports

### 12.1 Priority Levels

| Priority | Meaning | Action |
|----------|---------|--------|
| **P0** | Critical | Fix immediately |
| **P1** | High | Fix this sprint |
| **P2** | Medium | Plan for next sprint |
| **P3** | Low | Add to backlog |

### 12.2 Status Indicators

| Indicator | Meaning |
|-----------|---------|
| Good | Meets recommended thresholds |
| Needs Improvement | Below optimal, should address |
| Poor | Significantly below standards, urgent |

### 12.3 Technical Terms Glossary

| Term | Definition |
|------|------------|
| **LCP** | Largest Contentful Paint - time until main content loads |
| **FID** | First Input Delay - responsiveness to user clicks |
| **CLS** | Cumulative Layout Shift - visual stability score |
| **FCP** | First Contentful Paint - time until first content appears |
| **TTFB** | Time to First Byte - server response time |
| **Code Smells** | Code patterns indicating potential problems |
| **Technical Debt** | Time needed to fix all code quality issues |
| **Security Hotspot** | Code requiring manual security review |
| **Cognitive Complexity** | Measure of how difficult code is to understand |

---

## 13. Tips and Best Practices

### 13.1 Security Analysis Tips

1. **Run regularly** - Check repositories after significant changes
2. **Focus on P0/P1 items** - Address critical issues first
3. **Track trends** - Compare reports over time
4. **Review hotspots** - Don't ignore security hotspots

### 13.2 Performance Testing Tips

1. **Test both devices** - Mobile and desktop can differ significantly
2. **Test real pages** - Home page may not reflect actual user experience
3. **Test under load** - Results may vary during peak times
4. **Focus on Core Web Vitals** - These impact SEO rankings

### 13.3 Chat Tips

1. **Be specific** - "Analyze security of Project X" is clearer than just "analyze"
2. **Ask follow-ups** - The bot remembers conversation context
3. **Request explanations** - Ask "What does LCP mean?" if unsure
4. **Request priorities** - Ask "What should I fix first?"

---

## 14. Troubleshooting (User)

### "Repository not found" Message

**Meaning:** The repository isn't configured for analysis

**What to do:**
1. Check if you selected the correct repository
2. Contact administrator to add the repository
3. Verify the repository exists in SonarCloud

### Performance Analysis Taking Too Long

**Meaning:** The target website is slow or complex

**What to do:**
1. Wait up to 30 seconds for results
2. Try a different page on the same site
3. If persistent, the site may be blocking automated tests

### "I couldn't understand your request"

**Meaning:** The bot didn't recognize your intent

**What to do:**
1. Be more specific about what you want
2. Use keywords like "security", "performance", "analyze"
3. Include the repository name or URL explicitly

### Results Look Different From Last Time

**This is normal because:**
- Code changes affect security metrics
- Website performance varies with load
- External factors (CDN, network) affect tests

---

## 15. FAQ

### General

**Q: How often is SonarCloud data updated?**
A: Data reflects the latest SonarCloud analysis. Run a new analysis in SonarCloud to get fresh data.

**Q: Can I analyze any GitHub repository?**
A: Only repositories configured by the administrator. Contact your admin to add new repositories.

**Q: Can I test any website for performance?**
A: Yes, any publicly accessible URL can be tested.

### Security Analysis

**Q: What languages does security analysis support?**
A: SonarCloud supports JavaScript, TypeScript, Python, Java, C#, Go, and many more.

**Q: Why are there no vulnerabilities but many security hotspots?**
A: Security hotspots require manual review - they're not confirmed vulnerabilities but need attention.

**Q: How is technical debt calculated?**
A: Based on estimated time to fix all code smells, following SonarCloud's rules.

### Performance Testing

**Q: Why are mobile and desktop scores different?**
A: Mobile tests simulate slower networks and smaller screens, which typically results in lower scores.

**Q: Why does my score vary between tests?**
A: Real-world factors like server load, CDN performance, and network conditions affect results.

**Q: What's a good performance score?**
A: 90+ is good, 50-89 needs improvement, below 50 is poor.

### Account & Access

**Q: Do I need an account to use the bot?**
A: Depends on your organization's setup. Contact your administrator.

**Q: Is my data stored?**
A: Chat sessions are stored locally in your browser. No data is sent to external servers except for analysis APIs.

**Q: Can I export reports?**
A: Use the **Copy Chat** button to copy the conversation, then paste into any document.

---

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Last Updated | December 2025 |
| Author | GEA Team |

---

*For additional support, contact your system administrator or refer to the technical documentation.*
