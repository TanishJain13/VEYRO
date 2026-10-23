# Contributing to VEYRO

Thank you for your interest in contributing to VEYRO! This document provides guidelines for local development, code style, testing, and pull requests.

---

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/veyro-org/veyro.git
   cd veyro
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure local environment:**
   ```bash
   cp .env.example .env.local
   ```
   Add a GitHub personal access token to `GITHUB_TOKEN` to avoid unauthenticated rate limiting while debugging.

4. **Start development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` or `http://localhost:3000/explorer`.

---

## Code Style & Architecture Guidelines

- **Strict TypeScript:** All code must compile with `npx tsc --noEmit` under `target: ES2022`. Do not use `any` unless strictly necessary for third-party boundary adaptations.
- **Next.js Conventions:**
  - Route handlers in `src/app/api/*/route.ts` must use standard request validation schemas from `@/lib/validation/api-schemas`.
  - Client components must declare `'use client'` explicitly.
  - Server-only modules (such as `serverConfig` and `githubToken`) must never be imported into client components.
- **Design Tokens:** Always use VEYRO CSS variables defined in `src/app/globals.css` (e.g. `var(--veyro-bg-base)`, `var(--veyro-border)`, `var(--veyro-violet)`, `var(--veyro-cyan)`). Do not hardcode arbitrary hex colors.
- **Deterministic Analysis:** Do not invent mock graph edges, fabricated percentages, or simulated progress timers. All data displayed in the explorer must stem from the actual analysis pipeline.

---

## Testing Guidelines

- **Offline by Default:** All standard unit and integration tests in `vitest` must run offline without requiring internet access or GitHub tokens.
- **Mocking Strategy:** Use in-memory test fixtures (e.g. `SAMPLE_FILES` in `src/lib/fixtures/sample-repo.ts`) or mocked fetch responses for testing.
- **Live Smoke Tests:** The live GitHub smoke test (`tests/live-smoke.test.ts`) is opt-in and will only run when `VEYRO_LIVE_TESTS=1`.

```bash
# Run unit & component tests
npm test

# Run tests with typechecking and linting
npx tsc --noEmit
npm run lint

# Run production build validation
npm run build
```

---

## Pull Request Checklist

Before submitting a pull request, ensure:
1. `npm run lint` passes with 0 errors and 0 warnings.
2. `npx tsc --noEmit` exits with code 0.
3. `npm test` passes completely offline.
4. `npm run build` compiles all pages and API routes cleanly.
5. No credentials, tokens, or local `.env` files are committed.
6. New features or parser adapters include accompanying unit tests.
