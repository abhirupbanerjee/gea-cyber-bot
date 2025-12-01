# GEA Cyber Bot

AI-powered code quality assistant integrated with SonarCloud for comprehensive code analysis and security reviews.

## Features

- Interactive chat interface powered by OpenAI Assistants API
- Code quality analysis using SonarCloud integration
- Automated bug and vulnerability detection
- Security hotspot identification
- Actionable recommendations

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
```

### 3. Configure OpenAI Assistant

See [docs/openai-setup.md](docs/openai-setup.md) for detailed instructions.

### 4. Add Repositories

Edit `public/config/sonar-repos.json` (or `app/config/sonar-repos.json` for local dev):

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
| [openai-assistant-instructions.md](docs/openai-assistant-instructions.md) | Assistant prompt templates |

## Troubleshooting

### "Repository not configured"
- Verify URL in `sonar-repos.json`
- Check URL matches exactly (including `.git` suffix if present)

### "Authentication failed"
- Regenerate SonarCloud token
- Update `SONARCLOUD_TOKEN` environment variable
- Redeploy if on Vercel

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

## License

MIT
