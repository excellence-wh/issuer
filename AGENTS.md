# AGENTS.md

This file provides guidelines for agentic coding agents working on the Excellence Issuer codebase.

## Project Overview

This is a monorepo containing:
- **server**: Hono.js API server with Bun runtime
- **browser-extension**: React + TypeScript browser extension using Vite and Mantine UI

## Build Commands

### Server
```bash
cd server
bun run dev      # Development with hot reload
bun run start    # Production start
bun run build    # Build to dist/server.js
bun run test     # Run tests with Bun test runner
```

### Browser Extension
```bash
cd browser-extension
bun run dev      # Development server
bun run build    # Production build
bun run lint     # Run ESLint
bun run preview  # Preview production build
```

## Testing

- **Server**: Uses Bun's built-in test runner (`bun test`)
  - Run single test file: `bun test path/to/test.ts`
  - Run tests matching pattern: `bun test --grep "pattern"`
- **Browser Extension**: No test framework currently configured

## Code Style Guidelines

### TypeScript

- Use strict TypeScript configuration
- Explicit return types for exported functions
- Interface names in PascalCase (e.g., `IssueData`)
- Type imports with `import type { X } from '...'`
- Use `import type` for type-only imports

### Naming Conventions

- **Files**: kebab-case for utility files (e.g., `hg.ts`), PascalCase for React components (e.g., `IssueReportModal.tsx`)
- **Components**: PascalCase (e.g., `IssueReportModal`)
- **Interfaces**: PascalCase with descriptive names
- **Variables/functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Services**: Use `xService` pattern (e.g., `hgService`, `llmService`)

### Import Order

1. External library imports (React, Hono, Mantine)
2. Type imports
3. Internal absolute imports (services, utils, types)
4. Relative imports (components, local utils)
5. CSS/SCSS imports last

### Code Patterns

**Server (Hono.js)**:
- Use service layer pattern (services/ directory)
- Routes organized by feature in routes/
- Types in types/ directory with .ts extension
- Use `.js` extension for local imports (e.g., `'./hg.js'`)

**Browser Extension (React)**:
- Functional components with hooks
- Extract complex logic into utility functions in utils/
- Components in components/ directory
- Services for API calls in services/
- Type definitions in types/ with .d.ts extension
- Default exports for page components

### Error Handling

- Use try-catch with console.error for debugging
- Return null/empty arrays on errors in services
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Avoid throwing errors; return error values instead

### Formatting

- No semicolons (except when necessary)
- Single quotes for strings
- 2-space indentation
- Trailing commas in multiline objects/arrays
- Max line length: ~100 characters

### ESLint

Run linting before committing:
```bash
cd browser-extension && bun run lint
```

## Project Structure

```
server/
  src/
    index.ts          # Entry point
    openapi.ts        # OpenAPI spec
    routes/           # API routes
    services/         # Business logic
    types/            # Type definitions

browser-extension/
  src/
    main.tsx          # Entry point
    App.tsx           # Root component
    components/       # React components
    services/         # API services
    types/            # Type definitions
    utils/            # Utility functions
```

## Tech Stack

- **Server**: Bun runtime, Hono.js framework, Scalar for API docs
- **Frontend**: React 19, TypeScript, Vite, Mantine v8, Tabler Icons
- **Build**: Bun for server, Vite for extension
- **Linting**: ESLint 9 with TypeScript support

## Notes

- Extension injects UI into Redmine pages
- Server provides Mercurial (hg) integration
- No existing Cursor rules or Copilot instructions found
- Project uses Chinese text in UI (e.g., "修改的文件")
