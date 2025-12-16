# Architecture Overview

Technical architecture and implementation details for GEA Cyber Bot.

## System Architecture

```
User Input
    │
    ▼
Chat Interface (app/page.tsx)
    │
    ├── Welcome Screen (3 options)
    │   ├── How-To Guide
    │   ├── Code Analysis (repo selection)
    │   └── Website Review (URL input)
    │
    ▼
POST /api/chat
    │
    ▼
OpenAI Assistant (determines intent)
    │
    ├─────────────────────────────────┐
    │                                 │
    ▼                                 ▼
Security Analysis               Performance Testing
    │                                 │
    ▼                                 ▼
validate_github_repo            analyze_website_performance
    │                                 │
    ▼                                 ▼
POST /api/sonar/validate-repo   POST /api/pagespeed/analyze
    │                                 │
    ▼                                 ▼
Config Loader                   PageSpeed Client
(sonar-repos.json)              (Google API)
    │                                 │
    ▼                                 │
get_code_analysis                    │
    │                                 │
    ▼                                 │
POST /api/sonar/get-analysis         │
    │                                 │
    ▼                                 │
SonarCloud Client                    │
    │                                 │
    └─────────────────────────────────┘
                    │
                    ▼
            Assistant generates report
                    │
                    ▼
            Display to user
```

## Project Structure

```
gea-cyber-bot/
├── app/
│   ├── api/
│   │   ├── chat/route.ts              # Main chat endpoint with function routing
│   │   ├── sonar/
│   │   │   ├── validate-repo/route.ts # Repository validation
│   │   │   ├── get-analysis/route.ts  # Code analysis retrieval
│   │   │   └── list-repos/route.ts    # List configured repos
│   │   └── pagespeed/
│   │       └── analyze/route.ts       # PageSpeed Insights analysis
│   ├── lib/
│   │   ├── sonarcloud/
│   │   │   ├── client.ts              # SonarCloud API client
│   │   │   ├── config.ts              # Configuration loader
│   │   │   ├── normalizer.ts          # Data transformation
│   │   │   └── types.ts               # TypeScript interfaces
│   │   ├── pagespeed/
│   │   │   ├── client.ts              # PageSpeed Insights API client
│   │   │   ├── types.ts               # TypeScript interfaces
│   │   │   └── index.ts               # Barrel export
│   │   └── openai/
│   │       └── function-definitions.ts # Function schemas & system prompt
│   ├── config/
│   │   └── sonar-repos.json           # Repository configuration (dev)
│   └── page.tsx                       # Chat UI with welcome screen
├── public/
│   └── config/
│       └── sonar-repos.json           # Repository configuration (prod)
├── scripts/
│   └── test-openai-assistant.js       # Test assistant setup
└── docs/                              # Documentation
```

## Component Responsibilities

### Frontend (`app/page.tsx`)
- Chat interface with message history
- Three-button welcome screen (How-To, Code Analysis, Website Review)
- Repository selection view
- Performance testing form (URL + device mode)
- Markdown rendering with syntax highlighting
- Local storage for chat persistence

### API Layer (`app/api/`)

| Endpoint | Purpose |
|----------|---------|
| `/api/chat` | OpenAI integration with function calling |
| `/api/sonar/validate-repo` | Validate GitHub URL against config |
| `/api/sonar/get-analysis` | Fetch SonarCloud analysis data |
| `/api/sonar/list-repos` | Return configured repositories |
| `/api/pagespeed/analyze` | Fetch PageSpeed Insights data |

### Service Layer

#### SonarCloud (`app/lib/sonarcloud/`)

| Module | Purpose |
|--------|---------|
| `client.ts` | HTTP requests to SonarCloud API |
| `config.ts` | Load and validate repository configuration |
| `normalizer.ts` | Transform API responses for LLM consumption |
| `types.ts` | TypeScript interfaces |

#### PageSpeed Insights (`app/lib/pagespeed/`)

| Module | Purpose |
|--------|---------|
| `client.ts` | HTTP requests to Google PageSpeed API |
| `types.ts` | TypeScript interfaces (CoreWebVitals, LighthouseScores, etc.) |
| `index.ts` | Barrel export |

## Metrics Tracked

### Security Analysis (SonarCloud)

| Metric | Description |
|--------|-------------|
| Bugs | Reliability issues |
| Vulnerabilities | Security issues |
| Security Hotspots | Potential vulnerabilities |
| Code Smells | Maintainability issues |
| Coverage | Test coverage percentage |
| Duplication | Code duplication percentage |
| NCLOC | Non-comment lines of code |
| Technical Debt | Minutes to fix all issues |
| Reliability Rating | A-E scale |
| Security Rating | A-E scale |
| Maintainability Rating | A-E scale |

### Performance Testing (PageSpeed Insights)

| Metric | Description |
|--------|-------------|
| Performance Score | Overall Lighthouse performance (0-100) |
| Accessibility Score | Accessibility compliance (0-100) |
| Best Practices Score | Security and best practices (0-100) |
| SEO Score | Search engine optimization (0-100) |
| LCP | Largest Contentful Paint (seconds) |
| FID | First Input Delay (milliseconds) |
| CLS | Cumulative Layout Shift (score) |
| FCP | First Contentful Paint (seconds) |
| TTFB | Time to First Byte (milliseconds) |

## Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...
OPENAI_ASSISTANT_ID=asst_...
SONARCLOUD_TOKEN=...
SONARCLOUD_ORGANIZATION=...

# Optional
OPENAI_ORGANIZATION=org-...
PAGESPEED_API_KEY=...  # Recommended for higher rate limits
```

### Repository Configuration

Location: `public/config/sonar-repos.json` (production) or `app/config/sonar-repos.json` (development)

```json
{
  "repositories": [
    {
      "githubUrl": "https://github.com/owner/repo",
      "sonarProjectKey": "owner_repo",
      "displayName": "Repository Name",
      "branch": "main",
      "configured": true,
      "lastSync": "2025-11-20T00:00:00Z"
    }
  ]
}
```

## Error Handling

### SonarCloud
Custom `SonarCloudError` class handles:
- 401: Authentication failures
- 404: Project not found
- 429: Rate limiting
- 5xx: Server errors

### PageSpeed Insights
Custom `PageSpeedError` class handles:
- Invalid URL format
- Unreachable URLs
- API rate limiting
- Server errors

All errors return user-friendly messages.

## Performance

| Operation | Typical Time |
|-----------|--------------|
| Repository Validation | ~50-100ms |
| SonarCloud Analysis | ~2-5s |
| PageSpeed Analysis | ~10-20s |
| Total Security Response | ~5-10s |
| Total Performance Response | ~15-25s |

## Security

- API tokens stored in environment variables
- URL format validated before API calls
- Generic error messages avoid leaking sensitive info
- CORS handled by Next.js (API routes are server-side only)
- GitHub URLs hidden from chat display (sent to backend only)

## Known Limitations

1. No caching - each analysis hits external APIs
2. SonarCloud: Limited to 500 issues per repository
3. SonarCloud: Fetches latest analysis only (no new scans)
4. SonarCloud: Single branch monitoring per repository
5. PageSpeed: Only works with publicly accessible URLs
6. PageSpeed: Results may vary based on Google's test infrastructure

## Architecture Decisions

### Why JSON Configuration?
- Simple to edit and version control
- No database setup required
- Easy migration path to database later

### Why Function Calling?
- Deterministic API integration
- Better than prompt-based URL extraction
- OpenAI handles parameter validation
- Clear separation of concerns

### Why PageSpeed Insights?
- Free API with optional API key for higher limits
- Synchronous response (no polling required)
- Comprehensive metrics (Lighthouse + Core Web Vitals)
- Works with any public URL

### Why Hide GitHub URLs?
- Privacy: Users don't need to see internal repo URLs
- Cleaner UX: Display names are more readable
- Security: Prevents accidental sharing of repo URLs
