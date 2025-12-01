# GEA Cyber Bot

AI-powered assistant for code quality analysis (SonarCloud) and website performance testing (Google PageSpeed Insights).

## Features

- Interactive chat interface powered by OpenAI Assistants API
- **Security Analysis** - Code quality analysis using SonarCloud (bugs, vulnerabilities, code smells, technical debt)
- **Performance Testing** - Website performance analysis using Google PageSpeed Insights (Core Web Vitals, Lighthouse scores)
- Actionable recommendations with prioritized findings

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

## Deployment

### Vercel

1. Push to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/dashboard)
3. Add environment variables
4. Deploy

**Important:** For production, place `sonar-repos.json` in `public/config/`.

## Documentation

| Document | Description |
|----------|-------------|
| [openai-setup.md](docs/openai-setup.md) | OpenAI Assistant configuration |
| [how-to-add-repository.md](docs/how-to-add-repository.md) | Repository setup guide |
| [implementation-summary.md](docs/implementation-summary.md) | Architecture overview |
| [cyber-bot-capabilities.md](docs/cyber-bot-capabilities.md) | Bot capabilities reference |

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

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- OpenAI Assistants API
- SonarCloud API
- Google PageSpeed Insights API

## License

MIT
