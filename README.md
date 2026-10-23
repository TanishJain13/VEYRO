# VEYRO — Visual Codebase Intelligence & Dependency Explorer

[![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.3.0-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x_ES2022-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/Vitest-35%2B_passed-brightgreen?logo=vitest)](https://vitest.dev)
[![License](https://img.shields.io/badge/License-MIT-purple)](#license)

> **Turn any supported public GitHub repository into an interactive, readable map of its structure, dependencies, and architecture—without cloning or running untrusted code locally.**

VEYRO ingests remote GitHub repositories, resolves branches to immutable 40-character commit SHAs, runs multi-language AST and grammar parsers, resolves imports, detects circular dependencies mathematically via Tarjan's strongly connected components algorithm, and renders an interactive `@xyflow/react` workspace with an in-context CodeMirror 6 code viewer.

---

## Key Features

- **Zero-Cloning Repository Analysis:** Fetches trees and source files dynamically via GitHub's API with strict bounds on concurrency, file count, and byte size.
- **Real AST & Token Parsers:**
  - **TypeScript & JavaScript (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`):** Full TypeScript Compiler API parsing for true symbol extraction, interfaces, type aliases, and dynamic imports.
  - **Python (`.py`):** High-precision grammar tokenizer extracting `import`, `from ... import`, functions, classes, and decorators.
  - **JSON (`.json`, `package.json`):** Manifest parsing extracting runtime, dev, and peer dependencies.
  - **CSS (`.css`):** Extracts `@import` rules and `url(...)` specifiers.
  - **Fallback:** Text reader providing line count, byte metrics, and syntax preview for general code/config files.
- **Topological Graph & Tarjan Cycle Detection:**
  - Interactive `@xyflow/react` canvas with deterministic Dagre layout.
  - Upstream dependent and downstream dependency path highlighting on hover/click.
  - Identifies architectural cycles and high in-degree coupling hotspots.
- **Synchronized In-Context Code Viewer:**
  - Embedded CodeMirror 6 client viewer with One Dark theme.
  - Displays source code from the exact pinned commit revision.
  - Selecting any graph node or file tree leaf focuses its source code.
- **Tabular Dependency View:**
  - Filterable table displaying internal imports, external npm packages, standard libraries, and broken/unresolved imports with line references.
- **Global Command Palette (<kbd>Ctrl</kbd> + <kbd>K</kbd>):**
  - Instant keyboard search across file paths, exported symbol names, import specifiers, and diagnostic findings.
- **Deterministic Sample Repository:**
  - Test fixture repository (`veyro-sample/fixture`) runnable offline and in production to demonstrate every feature without external API calls.

---

## Architectural Pipeline

```
GitHub Repository URL
         │
         ▼
[1. Ingestion & Revision Pinning]  ──► Validates URL, resolves default branch to pinned 40-char SHA
         │
         ▼
[2. Recursive Tree Extraction]     ──► Retrieves tree, filters noise (node_modules, dist, lockfiles)
         │
         ▼
[3. Multi-Language Parser Registry] ──► TypeScript Compiler API, Python grammar, JSON, CSS
         │
         ▼
[4. Import Resolution Engine]       ──► Relative paths, directory indexes, packages, stdlib modules
         │
         ▼
[5. Graph Builder & Tarjan SCC]    ──► Nodes, edges, in/out degrees, circular loops, coverage
         │
         ▼
[6. Interactive Explorer Workspace] ──► File tree, React Flow canvas, CodeMirror 6 viewer, inspector
```

---

## Language Support & Engineering Boundaries

| Language / Format | Extensions | Parser Engine | Capabilities |
| :--- | :--- | :--- | :--- |
| **TypeScript / JavaScript** | `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs` | **TypeScript Compiler API** (True AST) | Symbols, functions, classes, types, ES imports, exports, dynamic imports. |
| **Python** | `.py` | **Syntactic Tokenizer** (Regex-grammar) | `import x`, `from x import y`, relative dotted imports, functions, classes. |
| **CSS** | `.css` | **At-Rule Parser** | `@import` specifiers, `url()` dependency references. |
| **JSON** | `.json`, `package.json` | **Manifest Parser** | npm runtime, dev, and peer dependencies. |
| **Other text files** | `.md`, `.txt`, `.yaml`, etc. | **Fallback Reader** | Line counts, file size metrics, and read-only source preview. |

### Configured Platform Limits

To prevent memory exhaustion, SSRF vulnerabilities, and browser lockups:
- **Max Files Analyzed:** 1,500 files per repository (configurable via `VEYRO_MAX_FILES`).
- **Max Individual File Size:** 300 KB (`VEYRO_MAX_FILE_BYTES`). Files larger than this are skipped from AST parsing.
- **Max Total Download Bytes:** 15 MB per analysis run (`VEYRO_MAX_TOTAL_SOURCE_BYTES`).
- **Bounded Concurrency:** Max 8 concurrent network fetches (`VEYRO_MAX_CONCURRENCY`).
- **Network Timeouts:** 15-second bounded HTTP fetch timeouts with AbortSignal.
- **SSRF Guards:** Outbound requests are strictly constrained to `api.github.com` and `raw.githubusercontent.com`.

---

## Getting Started

### Prerequisites

- **Node.js:** `^20.0.0` or later
- **npm:** `^10.0.0` or later

### Installation

1. Clone or copy the repository:
   ```bash
   git clone https://github.com/veyro-org/veyro.git
   cd veyro
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   *(Optional)* Add a GitHub personal access token to `GITHUB_TOKEN` in `.env.local` to raise API limits from 60 to 5,000 requests/hour.

4. Start development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) for the marketing page, or [http://localhost:3000/explorer](http://localhost:3000/explorer) for the explorer.

---

## Environment Variables

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `GITHUB_TOKEN` | No | `""` | GitHub personal access token (public_repo scope). Increases rate limits. |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Canonical app URL for OpenGraph metadata. |
| `VEYRO_MAX_FILES` | No | `1500` | Max repository files processed per run. |
| `VEYRO_MAX_FILE_BYTES` | No | `300000` | Max single file byte cap (300 KB). |
| `VEYRO_MAX_CONCURRENCY`| No | `8` | Max concurrent HTTP file requests. |
| `VEYRO_ANALYSIS_TIMEOUT_MS`| No | `45000` | Max duration before analysis aborts (45s). |
| `VEYRO_LIVE_TESTS` | No | `""` | Set to `1` to run live GitHub smoke tests during `vitest`. |

---

## Testing & Quality Assurance

VEYRO maintains automated unit, integration, and security tests. Ordinary test runs are **100% offline and deterministic**:

```bash
# Run unit & component tests (offline)
npm test

# Run TypeScript typechecker (ES2022 target)
npx tsc --noEmit

# Run ESLint checks
npm run lint

# Build production bundle
npm run build

# (Optional) Run live GitHub network test
VEYRO_LIVE_TESTS=1 npx vitest run tests/live-smoke.test.ts
```

---

## GitHub API Rate Limits

- **Unauthenticated Requests:** GitHub permits up to 60 requests/hour per IP. When exhausted, VEYRO catches HTTP 403/429 and returns a structured `RATE_LIMIT_EXCEEDED` response showing seconds until reset.
- **Authenticated Requests:** Providing a `GITHUB_TOKEN` in `.env.local` raises the quota to 5,000 requests/hour. The token is stored strictly in server-side memory and is **never** leaked to client JavaScript bundles.

---

## Privacy & Security

- **Untrusted Code Execution:** VEYRO parses source code statically using ASTs and regex grammars. **Imported repository code is never executed, eval'd, or run in any runtime sandbox.**
- **Data Persistence:** VEYRO operates completely in-memory. No repository contents, file trees, or code tokens are saved to a persistent database or disk.
- **Secrets Isolation:** GitHub tokens and server environment variables are loaded strictly server-side. Error responses strip stack traces in production (`NODE_ENV === 'production'`).
- **Path Traversal & SSRF:** All repository parameters (`owner`, `repo`, `sha`, `path`) are validated with Zod against path traversal (`..`), null bytes, Windows drive letters, and unauthorized hosts.

---

## Deploying to Vercel

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Import the project in [Vercel](https://vercel.com/new).
3. In **Project Settings** $\to$ **Environment Variables**, configure:
   - `GITHUB_TOKEN` (strongly recommended for production rate limits).
   - `NEXT_PUBLIC_APP_URL` (e.g. `https://your-domain.vercel.app`).
4. Deploy. Next.js 16 will build static routes (`/`, `/explorer`) and dynamic Edge/Node API route handlers (`/api/*`).

---

## License

MIT © VEYRO Engineering Team
