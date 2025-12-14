Resume Optimizer — Project Overview
Semantic Resume Architect is a privacy-first, AST-driven career document engine designed to generate and optimize resumes and cover letters using Large Language Models (Gemini 2.5 Flash). Unlike typical wrapper applications, this project implements a dual-phase AI generation pipeline and utilizes a custom Abstract Syntax Tree (AST) implementation to ensure structural integrity across document formats.

The architecture prioritizes stateless execution, ensuring user data is processed in-memory and never persisted to disk, mitigating GDPR and data privacy concerns.

Technical Architecture
Core Components
Frontend: Next.js 14 (App Router), React 18, TypeScript.

State Management: Custom useDocumentReducer leveraging a uni-directional data flow for document manipulation.

Document Parsing: Unified/Remark-based AST parsing for robust Markdown-to-Structure conversion, eliminating fragile regex-based string manipulation.

AI Orchestration: Google Gemini 2.5 Flash via a dedicated Service Layer pattern.

Streaming: Server-Sent Events (SSE) for real-time generation feedback and progressive rendering.

Design Patterns
Service-Repository Pattern: Business logic for AI interaction and document processing is isolated from Next.js API routes, facilitating unit testing and separation of concerns.

Prompt Chaining: Implements a two-phase "Reasoning-Action" chain where the model first analyzes the job description (Phase 1) before generating content based on that analysis (Phase 2).

Dependency Injection: External services (GenAI clients, Loggers) are injected into consumers to support strictly typed mocking in test suites.

Features
Context-Aware Generation: Utilizes a dual-pass prompting strategy to extract keywords and tonal requirements from job descriptions before content generation.

Structured Document Editor: A block-based editor that maintains document structure programmatically, preventing formatting corruption common in raw text editors.

Stateless Architecture: Zero-retention data processing pipeline.

Edge-Ready: Optimized for serverless deployment with lightweight runtime requirements.

Getting Started
Prerequisites
Node.js 18.17 or later

Google Gemini API Key

Installation
Clone the repository:

```bash

git clone https://github.com/saifmb0/resume-optimizer.git
cd resume-optimizer
```
Install dependencies:

```bash

npm ci
```
Configure environment variables: Create a .env.local file in the root directory:

```bash

GEMINI_API_KEY=your_key_here
```
Run the development server:

```bash

npm run dev
```
Testing Strategy
This project enforces high code quality standards through a comprehensive testing matrix:

Unit Tests (Vitest): Cover core business logic, including the AST parser, prompt construction, and validation schemas.

Integration Tests: Verify the interaction between the Service Layer and mocked AI endpoints.

E2E Tests (Playwright): Validate critical user flows including form submission, editor interaction, and export functionality.

To run the test suite:

```bash

npm run test:unit
npm run test:e2e
```
Security
Input Sanitization: Strict Zod schemas validate all incoming request bodies.

Prompt Injection Defense: Context-aware heuristic analysis detects and blocks adversarial inputs before they reach the LLM.

Rate Limiting: Token-bucket algorithm implemented via Redis/Upstash prevents API abuse.

License
MIT