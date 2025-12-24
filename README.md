# Resume Optimizer

A privacy-first career intelligence platform engineered to optimize professional documents using Google Gemini 2.5. Built with a stateless architecture and a custom security layer to ensure data privacy and system resilience.

## Core Architecture

### 🛡️ Security Sentinel Layer
Unlike standard wrappers, this application implements a custom security middleware (`src/utils/validation.ts`) that sanitizes inputs before they reach the LLM.
- **Context-Aware Injection Detection**: Custom regex patterns block "jailbreak" attempts (e.g., DAN mode, role-play overrides).
- **XSS Vector Elimination**: Strips potential malicious payloads from user input.
- **Rate Limiting**: Distributed limiting via Upstash Redis to prevent abuse.

### ⚡ Two-Phase Prompt Chain
The application utilizes a structured prompt chaining architecture for higher precision:
1.  **Phase 1 (Analysis):** The PDF is parsed and analyzed against the job description to identify keyword gaps and ATS compatibility.
2.  **Phase 2 (Optimization):** Missing keywords are injected naturally into the candidate's existing experience using a schema-driven generation process.

### 🔒 Stateless & Privacy-First
- **Zero Data Retention**: No database is used to store user resumes or job descriptions.
- **Ephemeral Processing**: Data exists only during the request lifecycle and is cleared immediately after generation.
- **Local Persistence**: Drafts are stored only in the user's local browser storage.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **AI Runtime**: Google Gemini 2.5 Flash
- **Infrastructure**: Vercel Edge Functions
- **State Management**: Upstash Redis (Rate Limiting)
- **Validation**: Zod & Custom Regex Engines
- **Testing**: Playwright E2E
- **Styling**: Tailwind CSS v4

## Getting Started

### Prerequisites
- Node.js 18+
- Google Gemini API Key
- Upstash Redis Credentials (optional for local dev, required for prod)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/saifmb0/resume-optimizer.git
   cd resume-optimizer
2. **Install dependencies**
    ```bash
    npm install
    ```
3. **Create .env.local**

    ```
    GEMINI_API_KEY=your_gemini_key
    UPSTASH_REDIS_REST_URL=your_upstash_url
    UPSTASH_REDIS_REST_TOKEN=your_upstash_token
    ```
4. **Run Development Server**

    ```bash
    
    npm run dev
    ```
## Project Structure

```
src/
├── app/api/           # Edge API Routes (Streaming enabled)
├── components/        # React Server/Client Components
├── utils/
│   ├── validation.ts  # Security Sentinel Logic
│   └── rateLimit.ts   # Upstash Implementation
├── lib/
│   └── prompts.ts     # System Instructions & Prompt Engineering
└── hooks/             # Custom Hooks (SSE, Persistence)
```
## Security & Validation
The platform enforces strict validation rules:
```
PDF Parsing: Validates file structure and text content ratio to reject malformed or malicious files.

Input Sanitization: All text inputs go through a multi-pass sanitizer to remove control characters and HTML tags.

Output Validation: AI responses are validated against a Zod schema to ensure structural integrity before rendering.
```
License
MIT License. See [LICENSE](/LICENSE) for details.
