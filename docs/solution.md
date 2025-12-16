# GEA Cyber Bot - Solution Architecture Document

**Version:** 1.1
**Date:** December 2025
**Author:** Architecture Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Solution Overview](#2-solution-overview)
3. [Architecture Diagrams](#3-architecture-diagrams)
4. [Component Details](#4-component-details)
5. [Function Call Specifications](#5-function-call-specifications)
6. [Data Flow](#6-data-flow)
7. [API Integrations](#7-api-integrations)
8. [File Structure](#8-file-structure)
9. [Configuration](#9-configuration)
10. [Deployment Architecture](#10-deployment-architecture)

---

## 1. Executive Summary

**GEA Cyber Bot** is an AI-powered assistant that provides two core capabilities:

| Capability | Tool | Purpose |
|------------|------|---------|
| **Security Analysis** | SonarCloud | Code quality, bugs, vulnerabilities, technical debt |
| **Performance Testing** | Google PageSpeed Insights | Core Web Vitals, Lighthouse scores, optimization |

The solution uses OpenAI's Assistants API with function calling to orchestrate analysis requests, providing conversational access to complex testing tools.

---

## 2. Solution Overview

### 2.1 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 19.x |
| Framework | Next.js | 16.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| AI Orchestration | OpenAI Assistants API | v2 |
| Code Analysis | SonarCloud API | - |
| Performance Testing | Google PageSpeed Insights API | v5 |
| Deployment | Vercel | - |

### 2.2 Key Design Principles

1. **Conversational Interface** - Natural language interaction with technical tools
2. **Function Calling** - AI decides when/which APIs to invoke
3. **Normalized Responses** - Consistent data format for LLM consumption
4. **Stateless API Routes** - Serverless-compatible architecture

---

## 3. Architecture Diagrams

### 3.1 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                              │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        app/page.tsx                               │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐   │  │
│  │  │ Welcome     │  │ Chat Input   │  │ Message Display         │   │  │
│  │  │ Screen      │  │ & Controls   │  │ (ReactMarkdown)         │   │  │
│  │  │ - How-To    │  │              │  │ - User messages         │   │  │
│  │  │ - Code      │  │              │  │ - Bot responses         │   │  │
│  │  │ - Website   │  │              │  │ - Tables/Code blocks    │   │  │
│  │  └─────────────┘  └──────────────┘  └─────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ POST /api/chat
┌─────────────────────────────────────────────────────────────────────────┐
│                           API LAYER (Next.js)                            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    app/api/chat/route.ts                          │  │
│  │                    ════════════════════                           │  │
│  │                    CENTRAL ORCHESTRATOR                           │  │
│  │  • Thread Management (create/retrieve)                            │  │
│  │  • Message Handling (add user message)                            │  │
│  │  • Run Execution (invoke Assistant)                               │  │
│  │  • Function Call Routing (detect & dispatch)                      │  │
│  │  • Response Assembly (return to frontend)                         │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│         ┌──────────────────────────┼──────────────────────────┐         │
│         ▼                          ▼                          ▼         │
│  ┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐  │
│  │ /api/sonar/     │    │ /api/sonar/         │    │ /api/pagespeed/ │  │
│  │ validate-repo   │    │ get-analysis        │    │ analyze         │  │
│  └─────────────────┘    └─────────────────────┘    └─────────────────┘  │
│  ┌─────────────────┐                                                    │
│  │ /api/sonar/     │                                                    │
│  │ list-repos      │                                                    │
│  └─────────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          LIBRARY LAYER                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐  │
│  │ app/lib/sonarcloud  │  │ app/lib/pagespeed   │  │ app/lib/openai  │  │
│  │ ─────────────────── │  │ ───────────────────  │  │ ─────────────── │  │
│  │ • client.ts         │  │ • client.ts         │  │ • function-     │  │
│  │ • types.ts          │  │ • types.ts          │  │   definitions   │  │
│  │ • normalizer.ts     │  │ • index.ts          │  │ • assistant-    │  │
│  │ • config.ts         │  │                     │  │   config.ts     │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                │
│  ┌─────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │    OpenAI       │  │    SonarCloud       │  │  Google PageSpeed   │  │
│  │ Assistants API  │  │       API           │  │   Insights API      │  │
│  │ ─────────────── │  │ ───────────────────  │  │ ─────────────────── │  │
│  │ • Threads       │  │ • /projects/search  │  │ • /runPagespeed     │  │
│  │ • Messages      │  │ • /measures/        │  │                     │  │
│  │ • Runs          │  │   component         │  │                     │  │
│  │ • Functions     │  │ • /issues/search    │  │                     │  │
│  └─────────────────┘  └─────────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Function Call Sequence Diagram

```
┌──────┐     ┌──────────┐     ┌────────────┐     ┌─────────────┐     ┌──────────────┐
│ User │     │ Frontend │     │ /api/chat  │     │   OpenAI    │     │  Tool APIs   │
└──┬───┘     └────┬─────┘     └─────┬──────┘     └──────┬──────┘     └──────┬───────┘
   │              │                 │                   │                   │
   │ "Analyze     │                 │                   │                   │
   │  github.com/ │                 │                   │                   │
   │  owner/repo" │                 │                   │                   │
   │─────────────>│                 │                   │                   │
   │              │ POST {message,  │                   │                   │
   │              │  threadId}      │                   │                   │
   │              │────────────────>│                   │                   │
   │              │                 │                   │                   │
   │              │                 │ Create/Get Thread │                   │
   │              │                 │──────────────────>│                   │
   │              │                 │<──────────────────│                   │
   │              │                 │                   │                   │
   │              │                 │ Add Message       │                   │
   │              │                 │──────────────────>│                   │
   │              │                 │                   │                   │
   │              │                 │ Create Run        │                   │
   │              │                 │──────────────────>│                   │
   │              │                 │                   │                   │
   │              │                 │ status:           │                   │
   │              │                 │ requires_action   │                   │
   │              │                 │ function_call:    │                   │
   │              │                 │ validate_github_  │                   │
   │              │                 │ repo              │                   │
   │              │                 │<──────────────────│                   │
   │              │                 │                   │                   │
   │              │                 │ Call validate-repo route             │
   │              │                 │──────────────────────────────────────>│
   │              │                 │<──────────────────────────────────────│
   │              │                 │                   │                   │
   │              │                 │ Submit tool output│                   │
   │              │                 │──────────────────>│                   │
   │              │                 │                   │                   │
   │              │                 │ requires_action   │                   │
   │              │                 │ get_code_analysis │                   │
   │              │                 │<──────────────────│                   │
   │              │                 │                   │                   │
   │              │                 │ Call get-analysis route              │
   │              │                 │──────────────────────────────────────>│
   │              │                 │<──────────────────────────────────────│
   │              │                 │                   │                   │
   │              │                 │ Submit tool output│                   │
   │              │                 │──────────────────>│                   │
   │              │                 │                   │                   │
   │              │                 │ status: completed │                   │
   │              │                 │<──────────────────│                   │
   │              │                 │                   │                   │
   │              │                 │ Get Messages      │                   │
   │              │                 │──────────────────>│                   │
   │              │                 │<──────────────────│                   │
   │              │                 │                   │                   │
   │              │ {reply, threadId}                   │                   │
   │              │<────────────────│                   │                   │
   │              │                 │                   │                   │
   │ Formatted    │                 │                   │                   │
   │ Analysis     │                 │                   │                   │
   │<─────────────│                 │                   │                   │
   │              │                 │                   │                   │
```

### 3.3 Component Interaction Matrix

```
┌────────────────────┬───────────┬───────────┬───────────┬───────────┬───────────┐
│                    │ Frontend  │ /api/chat │ SonarCloud│ PageSpeed │  OpenAI   │
│                    │           │           │  Routes   │  Route    │           │
├────────────────────┼───────────┼───────────┼───────────┼───────────┼───────────┤
│ Frontend           │     -     │   HTTP    │     -     │     -     │     -     │
│                    │           │   POST    │           │           │           │
├────────────────────┼───────────┼───────────┼───────────┼───────────┼───────────┤
│ /api/chat          │  Response │     -     │  Direct   │  Direct   │   HTTP    │
│                    │           │           │  Import   │  Import   │   REST    │
├────────────────────┼───────────┼───────────┼───────────┼───────────┼───────────┤
│ SonarCloud Routes  │     -     │  Called   │     -     │     -     │     -     │
│                    │           │    by     │           │           │           │
├────────────────────┼───────────┼───────────┼───────────┼───────────┼───────────┤
│ PageSpeed Route    │     -     │  Called   │     -     │     -     │     -     │
│                    │           │    by     │           │           │           │
├────────────────────┼───────────┼───────────┼───────────┼───────────┼───────────┤
│ OpenAI             │     -     │  Thread   │     -     │     -     │     -     │
│                    │           │  Mgmt &   │           │           │           │
│                    │           │  Function │           │           │           │
│                    │           │  Calls    │           │           │           │
└────────────────────┴───────────┴───────────┴───────────┴───────────┴───────────┘
```

---

## 4. Component Details

### 4.1 Frontend Components

| Component | File | Responsibility |
|-----------|------|----------------|
| **ChatApp** | `app/page.tsx` | Main container, state management |
| **Welcome Screen** | Embedded in page.tsx | Three-option landing (How-To, Code, Website) |
| **Message Display** | ReactMarkdown | Renders bot responses with tables, code |
| **Input Controls** | Embedded | Send, Copy Chat, Clear Chat |

### 4.2 API Routes

| Route | Method | Purpose | Input | Output |
|-------|--------|---------|-------|--------|
| `/api/chat` | POST | Main orchestrator | `{message, threadId}` | `{reply, threadId}` |
| `/api/sonar/validate-repo` | POST | Check repo config | `{githubUrl}` | `{valid, projectKey}` |
| `/api/sonar/get-analysis` | POST | Fetch analysis | `{githubUrl}` | `{data: NormalizedAnalysis}` |
| `/api/sonar/list-repos` | GET | List configured repos | - | `{repos: []}` |
| `/api/pagespeed/analyze` | POST | Run PageSpeed test | `{targetUrl, strategy}` | `{data: PageSpeedResult}` |

### 4.3 Library Modules

#### SonarCloud Module (`app/lib/sonarcloud/`)

| File | Purpose |
|------|---------|
| `client.ts` | API wrapper with error handling |
| `types.ts` | TypeScript interfaces |
| `normalizer.ts` | Transform API responses for LLM |
| `config.ts` | Repository whitelist loader |

#### PageSpeed Module (`app/lib/pagespeed/`)

| File | Purpose |
|------|---------|
| `client.ts` | PageSpeed API wrapper |
| `types.ts` | TypeScript interfaces |
| `index.ts` | Barrel exports |

#### OpenAI Module (`app/lib/openai/`)

| File | Purpose |
|------|---------|
| `function-definitions.ts` | Function schemas + System prompt |
| `assistant-config.ts` | Export helper for dashboard |

---

## 5. Function Call Specifications

### 5.1 Function Registry

| Function Name | Trigger Intent | Required Before |
|---------------|----------------|-----------------|
| `validate_github_repo` | User provides GitHub URL | - |
| `get_code_analysis` | User wants security analysis | `validate_github_repo` |
| `analyze_website_performance` | User wants performance test | - |

### 5.2 Function Schemas

#### validate_github_repo

```json
{
  "name": "validate_github_repo",
  "description": "Validates if a GitHub repository URL is configured in SonarCloud",
  "parameters": {
    "type": "object",
    "properties": {
      "github_url": {
        "type": "string",
        "description": "Full GitHub repository URL"
      }
    },
    "required": ["github_url"]
  }
}
```

**Response Structure:**
```json
{
  "valid": true,
  "projectKey": "owner_repo",
  "displayName": "My Repository",
  "message": "Repository is configured and ready"
}
```

#### get_code_analysis

```json
{
  "name": "get_code_analysis",
  "description": "Retrieves comprehensive code quality analysis from SonarCloud",
  "parameters": {
    "type": "object",
    "properties": {
      "github_url": {
        "type": "string",
        "description": "Validated GitHub repository URL"
      },
      "include_issues": {
        "type": "boolean",
        "description": "Include detailed issues list"
      }
    },
    "required": ["github_url"]
  }
}
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "repository": {
      "githubUrl": "https://github.com/owner/repo",
      "sonarProjectKey": "owner_repo",
      "displayName": "My Repository",
      "lastAnalysisDate": "2024-01-15T10:00:00Z"
    },
    "summary": {
      "bugs": 5,
      "vulnerabilities": 2,
      "securityHotspots": 3,
      "codeSmells": 150,
      "coverage": 45.5,
      "duplication": 3.2,
      "linesOfCode": 12500,
      "technicalDebtMinutes": 480
    },
    "ratings": {
      "reliability": "B",
      "security": "A",
      "maintainability": "C"
    },
    "issues": {
      "critical": [...],
      "high": [...],
      "medium": [...],
      "low": [...]
    },
    "recommendations": [...]
  }
}
```

#### analyze_website_performance

```json
{
  "name": "analyze_website_performance",
  "description": "Analyzes website performance using Google PageSpeed Insights",
  "parameters": {
    "type": "object",
    "properties": {
      "target_url": {
        "type": "string",
        "description": "Full URL to analyze"
      },
      "strategy": {
        "type": "string",
        "enum": ["mobile", "desktop"],
        "description": "Device simulation mode"
      }
    },
    "required": ["target_url", "strategy"]
  }
}
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "fetchTime": "2024-01-15T10:00:00Z",
    "strategy": "mobile",
    "scores": {
      "performance": 85,
      "accessibility": 92,
      "bestPractices": 88,
      "seo": 95
    },
    "coreWebVitals": {
      "lcp": 2500,
      "fid": 100,
      "cls": 0.05,
      "fcp": 1800,
      "ttfb": 600
    },
    "opportunities": [...],
    "diagnostics": [...]
  }
}
```

### 5.3 Function Call Decision Matrix

| User Input Pattern | Function Called | Condition |
|--------------------|-----------------|-----------|
| Contains GitHub URL + "analyze/security/code" | `validate_github_repo` → `get_code_analysis` | - |
| Contains URL + "performance/speed/lighthouse" | `analyze_website_performance` | - |
| Contains URL only (ambiguous) | Assistant asks clarification | - |
| "both analyses" + GitHub URL | All three functions | Sequential |

---

## 6. Data Flow

### 6.1 Security Analysis Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SECURITY ANALYSIS DATA FLOW                          │
└─────────────────────────────────────────────────────────────────────────┘

    User Input                Processing                    Output
    ──────────                ──────────                    ──────

┌──────────────┐
│ GitHub URL   │
│ "Analyze     │
│  security"   │
└──────┬───────┘
       │
       ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ sonar-repos  │─────>│ validate-    │─────>│ {valid:true, │
│ .json        │      │ repo route   │      │  projectKey} │
│ (whitelist)  │      └──────────────┘      └──────┬───────┘
└──────────────┘                                   │
                                                   ▼
                      ┌──────────────┐      ┌──────────────┐
                      │ SonarCloud   │─────>│ Raw API      │
                      │ API Calls    │      │ Response     │
                      │ • projects   │      └──────┬───────┘
                      │ • measures   │             │
                      │ • issues     │             ▼
                      └──────────────┘      ┌──────────────┐
                                           │ normalizer.ts│
                                           │ • Metrics    │
                                           │ • Ratings    │
                                           │ • Issues     │
                                           │ • Recommend. │
                                           └──────┬───────┘
                                                  │
                                                  ▼
                                           ┌──────────────┐
                                           │ Normalized   │
                                           │ Analysis     │
                                           │ Object       │
                                           └──────┬───────┘
                                                  │
                                                  ▼
                                           ┌──────────────┐
                                           │ OpenAI       │
                                           │ Assistant    │
                                           │ Formats      │
                                           │ Response     │
                                           └──────┬───────┘
                                                  │
                                                  ▼
                                           ┌──────────────┐
                                           │ Markdown     │
                                           │ Report with  │
                                           │ Tables &     │
                                           │ Priorities   │
                                           └──────────────┘
```

### 6.2 Performance Testing Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE TESTING DATA FLOW                         │
└─────────────────────────────────────────────────────────────────────────┘

    User Input                Processing                    Output
    ──────────                ──────────                    ──────

┌──────────────┐
│ Website URL  │
│ + Strategy   │
│ (mobile/     │
│  desktop)    │
└──────┬───────┘
       │
       ▼
┌──────────────┐      ┌──────────────┐
│ URL          │─────>│ pagespeed/   │
│ Validation   │      │ analyze      │
│              │      │ route        │
└──────────────┘      └──────┬───────┘
                             │
                             ▼
                      ┌──────────────┐      ┌──────────────┐
                      │ Google       │─────>│ Lighthouse   │
                      │ PageSpeed    │      │ Raw Results  │
                      │ API v5       │      └──────┬───────┘
                      └──────────────┘             │
                                                   ▼
                                            ┌──────────────┐
                                            │ client.ts    │
                                            │ normalize-   │
                                            │ Response()   │
                                            │ • Scores     │
                                            │ • Web Vitals │
                                            │ • Opportun.  │
                                            └──────┬───────┘
                                                   │
                                                   ▼
                                            ┌──────────────┐
                                            │ PageSpeed    │
                                            │ Result       │
                                            │ Object       │
                                            └──────┬───────┘
                                                   │
                                                   ▼
                                            ┌──────────────┐
                                            │ OpenAI       │
                                            │ Formats with │
                                            │ Thresholds   │
                                            │ & Status     │
                                            └──────┬───────┘
                                                   │
                                                   ▼
                                            ┌──────────────┐
                                            │ Performance  │
                                            │ Report with  │
                                            │ 🟢🟡🔴       │
                                            │ Indicators   │
                                            └──────────────┘
```

---

## 7. API Integrations

### 7.1 OpenAI Assistants API

| Endpoint | Purpose | Used In |
|----------|---------|---------|
| `POST /v1/threads` | Create conversation thread | `/api/chat` |
| `POST /v1/threads/{id}/messages` | Add user message | `/api/chat` |
| `POST /v1/threads/{id}/runs` | Execute assistant | `/api/chat` |
| `GET /v1/threads/{id}/runs/{id}` | Poll run status | `/api/chat` |
| `POST /v1/threads/{id}/runs/{id}/submit_tool_outputs` | Return function results | `/api/chat` |
| `GET /v1/threads/{id}/messages` | Retrieve response | `/api/chat` |

**Headers Required:**
```
Authorization: Bearer {OPENAI_API_KEY}
OpenAI-Beta: assistants=v2
OpenAI-Organization: {OPENAI_ORGANIZATION} (optional)
```

### 7.2 SonarCloud API

| Endpoint | Purpose | Authentication |
|----------|---------|----------------|
| `GET /api/projects/search` | Get project info | Bearer Token |
| `GET /api/measures/component` | Get metrics | Bearer Token |
| `GET /api/issues/search` | Get issues list | Bearer Token |

**Base URL:** `https://sonarcloud.io/api`

**Metrics Fetched:**
- `bugs`, `vulnerabilities`, `security_hotspots`, `code_smells`
- `coverage`, `duplicated_lines_density`, `ncloc`, `sqale_index`
- `reliability_rating`, `security_rating`, `sqale_rating`

### 7.3 Google PageSpeed Insights API

| Endpoint | Purpose | Authentication |
|----------|---------|----------------|
| `GET /pagespeedonline/v5/runPagespeed` | Analyze URL | API Key (optional) |

**Base URL:** `https://www.googleapis.com`

**Categories Requested:** `performance`, `accessibility`, `best-practices`, `seo`

---

## 8. File Structure

```
gea-cyber-bot/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts              # Main orchestrator
│   │   ├── sonar/
│   │   │   ├── validate-repo/
│   │   │   │   └── route.ts          # Repo validation
│   │   │   ├── get-analysis/
│   │   │   │   └── route.ts          # Full analysis
│   │   │   └── list-repos/
│   │   │       └── route.ts          # List configured repos
│   │   └── pagespeed/
│   │       └── analyze/
│   │           └── route.ts          # Performance testing
│   ├── lib/
│   │   ├── sonarcloud/
│   │   │   ├── client.ts             # API wrapper
│   │   │   ├── types.ts              # TypeScript types
│   │   │   ├── normalizer.ts         # Data transformation
│   │   │   └── config.ts             # Config loader
│   │   ├── pagespeed/
│   │   │   ├── client.ts             # API wrapper
│   │   │   ├── types.ts              # TypeScript types
│   │   │   └── index.ts              # Barrel export
│   │   └── openai/
│   │       ├── function-definitions.ts  # Function schemas
│   │       └── assistant-config.ts      # Export helper
│   ├── page.tsx                      # Main UI component
│   ├── layout.tsx                    # Root layout
│   └── globals.css                   # Global styles
├── public/
│   └── config/
│       └── sonar-repos.json          # Repository whitelist
├── scripts/
│   ├── show-assistant-config.ts      # Display config
│   └── test-openai-assistant.js      # Test assistant
├── .env.local                        # Environment variables
├── package.json
├── tsconfig.json
├── next.config.js
└── vercel.json
```

---

## 9. Configuration

### 9.1 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `OPENAI_ASSISTANT_ID` | Yes | Assistant ID from OpenAI dashboard |
| `OPENAI_ORGANIZATION` | No | OpenAI organization ID |
| `SONARCLOUD_TOKEN` | Yes | SonarCloud access token |
| `SONARCLOUD_ORGANIZATION` | Yes | SonarCloud organization key |
| `PAGESPEED_API_KEY` | No | Google API key (recommended for rate limits) |

### 9.2 Repository Configuration

File: `public/config/sonar-repos.json`

```json
{
  "repositories": [
    {
      "githubUrl": "https://github.com/owner/repo.git",
      "sonarProjectKey": "owner_repo",
      "displayName": "Human Readable Name",
      "branch": "main",
      "configured": true,
      "lastSync": "2024-01-15T00:00:00Z"
    }
  ]
}
```

| Field | Purpose |
|-------|---------|
| `githubUrl` | Exact URL for matching |
| `sonarProjectKey` | SonarCloud project identifier |
| `displayName` | Shown in UI and reports |
| `configured` | Enable/disable without removal |

### 9.3 OpenAI Assistant Setup

1. Create Assistant in OpenAI Dashboard
2. Set Model: `gpt-4` or `gpt-4-turbo`
3. Add Functions from `function-definitions.ts`
4. Add System Prompt from `function-definitions.ts`
5. Copy Assistant ID to `.env.local`

---

## 10. Deployment Architecture

### 10.1 Vercel Deployment

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         VERCEL PLATFORM                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────┐     ┌──────────────────────────────────────────┐     │
│   │   CDN/Edge   │     │           Serverless Functions           │     │
│   │   Network    │     │                                          │     │
│   ├──────────────┤     │  ┌────────────┐  ┌────────────────────┐  │     │
│   │ Static Files │     │  │ /api/chat  │  │ /api/sonar/*       │  │     │
│   │ • page.tsx   │     │  │            │  │ /api/pagespeed/*   │  │     │
│   │ • CSS/JS     │     │  └────────────┘  └────────────────────┘  │     │
│   │ • Images     │     │                                          │     │
│   │ • Config     │     │  Timeout: 60s (Hobby) / 300s (Pro)       │     │
│   └──────────────┘     └──────────────────────────────────────────┘     │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                    Environment Variables                         │  │
│   │  OPENAI_API_KEY | OPENAI_ASSISTANT_ID | SONARCLOUD_TOKEN | etc.  │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                               │
│                                                                         │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐      │
│   │   OpenAI     │    │  SonarCloud  │    │  Google PageSpeed    │      │
│   │   API        │    │  API         │    │  Insights API        │      │
│   └──────────────┘    └──────────────┘    └──────────────────────┘      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Request Flow Timing

| Step | Typical Duration | Notes |
|------|------------------|-------|
| User → Vercel | 50-200ms | CDN routing |
| Thread creation | 200-500ms | First message only |
| Assistant run start | 100-300ms | - |
| Function execution | 1-5s | Depends on external API |
| Assistant response generation | 2-10s | GPT processing |
| **Total (first message)** | **5-15s** | Includes thread creation |
| **Total (subsequent)** | **3-12s** | Thread reuse |

### 10.3 Scalability Considerations

| Constraint | Limit | Mitigation |
|------------|-------|------------|
| Vercel function timeout | 60s (Hobby) | Polling with status checks |
| OpenAI rate limits | Varies by tier | Retry with exponential backoff |
| SonarCloud API | 10 req/s | Caching, request batching |
| PageSpeed API | 25,000 req/day (free) | API key for higher limits |
| OpenAI message size | 512KB | Issue truncation in normalizer |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Thread** | OpenAI conversation context |
| **Run** | Single assistant execution within a thread |
| **Function Call** | Assistant requesting external data |
| **Tool Output** | Response to function call |
| **Normalized Analysis** | Standardized data format for LLM |
| **Core Web Vitals** | Google's UX metrics (LCP, FID, CLS) |
| **SonarCloud Project Key** | Unique identifier in SonarCloud |

---

## Appendix B: Error Codes

| Code | Source | Meaning | Resolution |
|------|--------|---------|------------|
| 401 | SonarCloud | Invalid token | Regenerate SONARCLOUD_TOKEN |
| 404 | SonarCloud | Project not found | Check sonar-repos.json |
| 429 | Any API | Rate limited | Wait and retry |
| 500 | Internal | Server error | Check Vercel logs |
| `requires_action` | OpenAI | Function call pending | Submit tool outputs |

---

*Document End*