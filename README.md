# GEA Cyber Bot

AI-powered assistant for code quality analysis (SonarCloud) and website performance testing (Google PageSpeed Insights).

## Features

- Interactive chat interface powered by OpenAI Assistants API
- **Security Analysis** - Code quality analysis using SonarCloud (bugs, vulnerabilities, code smells, technical debt)
- **Performance Testing** - Website performance analysis using Google PageSpeed Insights (Core Web Vitals, Lighthouse scores)
- Actionable recommendations with prioritized findings

---

## Solution Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React/Next.js)                     │
│                         app/page.tsx                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js Routes)                    │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │ /api/chat   │  │ /api/sonar/*    │  │ /api/pagespeed/*    │  │
│  │ Orchestrator│  │ Security APIs   │  │ Performance API     │  │
│  └─────────────┘  └─────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       External Services                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │   OpenAI     │  │  SonarCloud  │  │  Google PageSpeed  │    │
│  │ Assistants   │  │     API      │  │   Insights API     │    │
│  └──────────────┘  └──────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Function Call Flow

```
User Message → /api/chat → OpenAI Assistant
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     validate_github_repo  get_code_analysis  analyze_website_performance
              │               │               │
              ▼               ▼               ▼
     /api/sonar/         /api/sonar/     /api/pagespeed/
     validate-repo       get-analysis    analyze
              │               │               │
              └───────────────┼───────────────┘
                              ▼
              Results submitted to Assistant
                              │
                              ▼
              Formatted response to User
```

### Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| Chat Orchestrator | `app/api/chat/route.ts` | Thread management, function routing |
| Repo Validation | `app/api/sonar/validate-repo/` | Check SonarCloud configuration |
| Code Analysis | `app/api/sonar/get-analysis/` | Fetch security metrics |
| Performance Test | `app/api/pagespeed/analyze/` | Run Lighthouse tests |
| SonarCloud Client | `app/lib/sonarcloud/` | API wrapper & data normalization |
| PageSpeed Client | `app/lib/pagespeed/` | API wrapper |
| Function Definitions | `app/lib/openai/` | OpenAI function schemas |

### Function Specifications

| Function | Trigger | Parameters |
|----------|---------|------------|
| `validate_github_repo` | GitHub URL provided | `github_url` |
| `get_code_analysis` | After validation passes | `github_url`, `include_issues` |
| `analyze_website_performance` | Any URL + performance intent | `target_url`, `strategy` |

---

## Quick Start

### 1. Install Dependencies

```bash
git clone https://github.com/yourusername/gea-cyber-bot.git
cd gea-cyber-bot
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_ASSISTANT_ID=asst_...
OPENAI_ORGANIZATION=org-...

# SonarCloud
SONARCLOUD_TOKEN=...
SONARCLOUD_ORGANIZATION=...

# Google PageSpeed Insights (optional - works without key but recommended for higher rate limits)
PAGESPEED_API_KEY=...
```

### 3. Configure OpenAI Assistant

See [docs/openai-setup.md](docs/openai-setup.md) for detailed instructions.

### 4. Add Repositories (for Security Analysis)

Edit `public/config/sonar-repos.json`:

```json
{
  "repositories": [
    {
      "githubUrl": "https://github.com/owner/repo",
      "sonarProjectKey": "owner_repo",
      "displayName": "My Repository",
      "branch": "main",
      "configured": true,
      "lastSync": "2025-11-20T00:00:00Z"
    }
  ]
}
```

See [docs/how-to-add-repository.md](docs/how-to-add-repository.md) for details.

### 5. Run

```bash
npm run dev
# Open http://localhost:3000
```

---

## Usage

The bot provides three main options from the welcome screen:

1. **How-To Guide** - Learn about bot capabilities
2. **Code Analysis** - Select a configured repository for security analysis
3. **Website Review** - Enter any URL for performance testing

### Security Analysis (SonarCloud)
- Analyzes GitHub repositories for bugs, vulnerabilities, code smells
- Provides maintainability ratings and technical debt estimates
- Requires repository to be configured in SonarCloud

### Performance Testing (PageSpeed Insights)
- Tests any public website for Core Web Vitals (LCP, FID, CLS, FCP, TTFB)
- Returns Lighthouse scores (Performance, Accessibility, Best Practices, SEO)
- Supports both mobile and desktop testing
- No configuration needed - works with any public URL

---

## Project Structure

```
gea-cyber-bot/
├── app/
│   ├── api/
│   │   ├── chat/route.ts           # Main orchestrator
│   │   ├── sonar/
│   │   │   ├── validate-repo/      # Repo validation
│   │   │   ├── get-analysis/       # Full analysis
│   │   │   └── list-repos/         # List configured repos
│   │   └── pagespeed/
│   │       └── analyze/            # Performance testing
│   ├── lib/
│   │   ├── sonarcloud/             # SonarCloud client
│   │   ├── pagespeed/              # PageSpeed client
│   │   └── openai/                 # Function definitions
│   └── page.tsx                    # Main UI
├── public/config/
│   └── sonar-repos.json            # Repository whitelist
└── docs/                           # Documentation
```

---

## Deployment

### Vercel

1. Push to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/dashboard)
3. Add environment variables
4. Deploy

**Important:** For production, place `sonar-repos.json` in `public/config/`.

---

## Documentation

| Document | Description |
|----------|-------------|
| [openai-setup.md](docs/openai-setup.md) | OpenAI Assistant configuration |
| [how-to-add-repository.md](docs/how-to-add-repository.md) | Repository setup guide |
| [implementation-summary.md](docs/implementation-summary.md) | Architecture overview |
| [cyber-bot-capabilities.md](docs/cyber-bot-capabilities.md) | Bot capabilities reference |

---

## Troubleshooting

### "Repository not configured"
- Verify URL in `sonar-repos.json`
- Check URL matches exactly (including `.git` suffix if present)

### "Authentication failed"
- Regenerate SonarCloud token
- Update `SONARCLOUD_TOKEN` environment variable
- Redeploy if on Vercel

### PageSpeed analysis fails
- Verify URL is publicly accessible
- Check URL format includes protocol (https://)
- Some sites may block automated requests

### Assistant not calling functions
- Verify functions are added in OpenAI dashboard
- Check function names match exactly
- See [docs/openai-setup.md](docs/openai-setup.md#troubleshooting)

---

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- OpenAI Assistants API
- SonarCloud API
- Google PageSpeed Insights API

## License

MIT