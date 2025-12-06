# CVMaker Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │   CoverLetterForm│    │ CoverLetterResult│    │   CvDocument     │       │
│  │                  │    │                  │    │   (React-PDF)    │       │
│  │  • Job Desc Input│    │  • ATS Score     │    │                  │       │
│  │  • Resume Input  │    │  • Missing Keys  │    │  • PDF Render    │       │
│  │  • Tone Select   │    │  • Optimize Btn  │    │  • Open Sans     │       │
│  │  • PDF Upload    │    │  • Copy/Export   │    │  • Markdown Parse│       │
│  └────────┬─────────┘    └────────┬─────────┘    └──────────────────┘       │
│           │                       │                                          │
│           ▼                       ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                     usePersistedState Hook                       │        │
│  │              (localStorage + 2s debounce for form data)          │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                     useSSEStream Hook                            │        │
│  │          (eventsource-parser for robust SSE handling)            │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                                                                              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼  HTTP/SSE
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS API ROUTES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                    Security Middleware Layer                        │     │
│  │  ┌─────────────┐  ┌─────────────────┐  ┌──────────────────┐        │     │
│  │  │ Rate Limit  │  │ Input Sanitize  │  │ Prompt Injection │        │     │
│  │  │  (Upstash)  │  │     (Zod)       │  │   Detection      │        │     │
│  │  │ 10 req/60s  │  │                 │  │   (Regex)        │        │     │
│  │  └─────────────┘  └─────────────────┘  └──────────────────┘        │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                       │                                      │
│           ┌───────────────────────────┼───────────────────────────┐         │
│           ▼                           ▼                           ▼         │
│  ┌─────────────────┐    ┌─────────────────────┐    ┌──────────────────┐    │
│  │ /api/parse-     │    │ /api/generate-      │    │ /api/optimize-   │    │
│  │ resume          │    │ cover-letter        │    │ resume           │    │
│  │                 │    │                     │    │                  │    │
│  │ • PDF Upload    │    │ • SSE Streaming     │    │ • Keyword Inject │    │
│  │ • pdf-parse     │    │ • ATS Analysis      │    │ • Resume Rewrite │    │
│  │ • Text Extract  │    │ • Doc Generation    │    │ • Gemini Flash   │    │
│  └─────────────────┘    └─────────────────────┘    └──────────────────┘    │
│                                       │                                      │
└───────────────────────────────────────┼──────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SERVICES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐         ┌─────────────────────────────────────┐    │
│  │    Upstash Redis    │         │         Google Gemini AI            │    │
│  │                     │         │                                     │    │
│  │  • Rate Limiting    │         │  • gemini-2.5-pro (main gen)        │    │
│  │  • Sliding Window   │         │  • gemini-2.5-flash (optimize)      │    │
│  │  • Distributed      │         │  • JSON Mode w/ Schema              │    │
│  │  • Analytics        │         │  • Streaming Response               │    │
│  └─────────────────────┘         └─────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Vercel (Deployment & Logging)                     │    │
│  │                                                                      │    │
│  │  • Edge Runtime Compatible                                           │    │
│  │  • Log Dashboard (SecurityLogger → console.warn JSON)                │    │
│  │  • Environment Variables (GEMINI_API_KEY, UPSTASH_*)                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Generate Cover Letter

```
User Input                 API Processing              AI Generation
─────────────────────────────────────────────────────────────────────────────

1. User fills form    ──►  2. Rate limit check    ──►  5. Gemini API call
   • Job Description       (Upstash Redis)             • System prompt
   • Resume/PDF                   │                      (from prompts.ts)
   • Tone                         ▼                    • JSON schema mode
        │                  3. Sanitize & Validate            │
        │                  (Zod schemas)                     ▼
        │                         │                    6. Stream response
        │                         ▼                    (generateContentStream)
        │                  4. Injection detection            │
        │                  (40+ regex patterns)              │
        │                         │                          │
        │                         ▼                          │
        ▼               ┌─────────────────────┐              │
  usePersistedState     │ SecurityLogger      │              │
  (localStorage save)   │ (production logging)│              │
                        └─────────────────────┘              │
                                                             │
                                                             ▼
7. SSE Events ◄──────────────────────────────────────────────┘
   • event: analysis  (ATS score + keywords)
   • event: chunk     (progressive text)
   • event: done      (final document)
   • event: error     (if failed)
        │
        ▼
8. useSSEStream parses
   (eventsource-parser)
        │
        ▼
9. UI Updates
   • Show ATS gauge
   • Stream text
   • Enable actions
```

## Security Layers

```
                    ┌─────────────────────────────────────┐
                    │         INCOMING REQUEST            │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │   1. IP EXTRACTION                  │
                    │   (x-forwarded-for, cf-connecting)  │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │   2. RATE LIMITING                  │
          ┌─────────│   Upstash Redis Sliding Window      │─────────┐
          │ BLOCKED │   10 requests / 60 seconds          │         │
          │         └─────────────────┬───────────────────┘         │
          │                           │                              │
          │         ┌─────────────────▼───────────────────┐         │
          │         │   3. ZOD SCHEMA VALIDATION          │         │
          │ ◄───────│   • Min/max length                  │─────────┤
          │ BLOCKED │   • Required fields                 │         │
          │         │   • Enum validation                 │         │
          │         └─────────────────┬───────────────────┘         │
          │                           │                              │
          │         ┌─────────────────▼───────────────────┐         │
          │         │   4. HTML/JS SANITIZATION           │         │
          │         │   • Script tag removal              │         │
          │         │   • Event handler stripping         │         │
          │         └─────────────────┬───────────────────┘         │
          │                           │                              │
          │         ┌─────────────────▼───────────────────┐         │
          │         │   5. PROMPT INJECTION DETECTION     │         │
          │ ◄───────│   • 40+ attack patterns             │─────────┤
          │ BLOCKED │   • Jailbreak attempts              │         │
          │         │   • Role manipulation               │         │
          │         └─────────────────┬───────────────────┘         │
          │                           │                              │
          │         ┌─────────────────▼───────────────────┐         │
          │         │   6. MALICIOUS CONTENT CHECK        │         │
          │ ◄───────│   • XSS patterns                    │─────────┤
          │ BLOCKED │   • Data URL injection              │         │
          │         │   • eval() detection                │         │
          │         └─────────────────┬───────────────────┘         │
          │                           │                              │
          ▼                           ▼                              │
┌─────────────────────┐    ┌──────────────────────┐                 │
│  SecurityLogger     │    │   PROCESS REQUEST    │◄────────────────┘
│  (Vercel logs)      │    │   (Gemini API call)  │
│                     │    │                      │
│  • Timestamp        │    │   AI has its own     │
│  • Event type       │    │   system prompt      │
│  • IP address       │    │   guardrails too     │
│  • Severity         │    │                      │
└─────────────────────┘    └──────────────────────┘
```

## File Structure

```
src/
├── app/
│   ├── page.tsx              # Main page with form/result toggle
│   ├── layout.tsx            # Root layout with providers
│   ├── globals.css           # Tailwind imports
│   └── api/
│       ├── generate-cover-letter/
│       │   └── route.ts      # SSE streaming, ATS analysis
│       ├── optimize-resume/
│       │   └── route.ts      # Keyword integration
│       └── parse-resume/
│           └── route.ts      # PDF text extraction
│
├── components/
│   ├── CoverLetterForm.tsx   # Input form with PDF upload
│   ├── CoverLetterResult.tsx # Results with ATS gauge
│   ├── DarkModeToggle.tsx    # Theme switcher
│   └── InteractiveNetwork.tsx # Background animation
│
├── documents/
│   └── CvDocument.tsx        # React-PDF template
│
├── hooks/
│   ├── usePersistedState.ts  # localStorage with debounce
│   └── useSSEStream.ts       # SSE parser wrapper
│
├── lib/
│   └── prompts.ts            # AI prompts & schemas
│
├── contexts/
│   └── DarkModeContext.tsx   # Theme context
│
└── utils/
    ├── validation.ts         # Zod schemas, injection detection
    ├── rateLimit.ts          # Upstash rate limiter
    └── securityLogger.ts     # Production logging
```

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `next@16.0.7` | Framework (security patched) |
| `@google/genai` | Gemini AI SDK |
| `@upstash/ratelimit` | Distributed rate limiting |
| `@upstash/redis` | Redis client for serverless |
| `@react-pdf/renderer` | Declarative PDF generation |
| `pdf-parse` | PDF text extraction |
| `eventsource-parser` | Robust SSE parsing |
| `zod` | Input validation |
