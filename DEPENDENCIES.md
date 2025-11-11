# Duckboard Dependencies

## Core Dependencies

### Database & Analytics
- **@duckdb/duckdb-wasm** (v1.28.0) - DuckDB WebAssembly for in-browser SQL processing
- **comlink** (v4.4.1) - Web Worker communication library

### UI & Visualization
- **react** (v18.2.0) - React framework
- **react-dom** (v18.2.0) - React DOM renderer
- **react-virtualized** (v9.22.5) - Virtualized lists for large datasets
- **monaco-editor** (v0.44.0) - Code editor for SQL queries
- **vega** (v5.26.1) - Visualization grammar
- **vega-lite** (v5.16.3) - High-level visualization grammar
- **vega-embed** (v6.24.0) - Vega chart embedding

### Data Processing
- **jszip** (v3.10.1) - ZIP file creation for bundle exports
- **uuid** (v9.0.1) - Unique identifier generation
- **zod** (v3.22.4) - Schema validation for bundle imports/exports

### State Management
- **zustand** (v4.4.7) - Lightweight state management with persistence

## Development Dependencies

### Build Tools
- **vite** (v5.0.8) - Fast build tool and dev server
- **@vitejs/plugin-react** (v4.2.1) - React plugin for Vite
- **typescript** (v5.2.2) - TypeScript compiler

### Testing
- **vitest** (v1.0.4) - Unit testing framework
- **@playwright/test** (v1.40.1) - End-to-end testing framework

### Code Quality
- **eslint** (v8.55.0) - JavaScript/TypeScript linting
- **@typescript-eslint/eslint-plugin** (v6.14.0) - TypeScript ESLint rules
- **@typescript-eslint/parser** (v6.14.0) - TypeScript parser for ESLint
- **eslint-plugin-react-hooks** (v4.6.0) - React hooks linting rules
- **eslint-plugin-react-refresh** (v0.4.5) - React refresh linting
- **prettier** (v3.1.1) - Code formatting

### PWA Support
- **vite-plugin-pwa** (v0.17.4) - PWA plugin for Vite
- **@vite-pwa/assets-generator** (v0.2.4) - PWA asset generation

### Type Definitions
- **@types/react** (v18.2.43) - React TypeScript definitions
- **@types/react-dom** (v18.2.17) - React DOM TypeScript definitions
- **@types/react-virtualized** (v9.21.29) - React Virtualized TypeScript definitions
- **@types/uuid** (v9.0.7) - UUID TypeScript definitions

## Installation

### Prerequisites
- Node.js 18.0.0 or higher
- npm, yarn, or pnpm package manager

### Quick Install
```bash
# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install
```

### Manual Installation
```bash
# Install core dependencies
npm install @duckdb/duckdb-wasm@1.28.0 comlink@4.4.1 jszip@3.10.1 monaco-editor@0.44.0 react@18.2.0 react-dom@18.2.0 react-virtualized@9.22.5 uuid@9.0.1 vega@5.26.1 vega-embed@6.24.0 vega-lite@5.16.3 zod@3.22.4 zustand@4.4.7

# Install development dependencies
npm install --save-dev @playwright/test@1.40.1 @types/react@18.2.43 @types/react-dom@18.2.17 @types/react-virtualized@9.21.29 @types/uuid@9.0.7 @typescript-eslint/eslint-plugin@6.14.0 @typescript-eslint/parser@6.14.0 @vite-pwa/assets-generator@0.2.4 @vitejs/plugin-react@4.2.1 eslint@8.55.0 eslint-plugin-react-hooks@4.6.0 eslint-plugin-react-refresh@0.4.5 prettier@3.1.1 typescript@5.2.2 vite@5.0.8 vite-plugin-pwa@0.17.4 vitest@1.0.4
```

## Available Scripts

```bash
# Development
npm run dev          # Start development server

# Building
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run unit tests
npm run test:unit    # Run unit tests (alias)
npm run test:e2e     # Run end-to-end tests
npm run test:e2e:ui  # Run E2E tests with UI

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript type checking
npm run typecheck    # Run TypeScript type checking (alias)
```

## Dependency Updates

### Check for updates
```bash
npm outdated
```

### Update all dependencies
```bash
npm update
```

### Update specific package
```bash
npm install package-name@latest
```

## Security

All dependencies are regularly updated to their latest stable versions. The project uses:
- Automated dependency updates via GitHub Actions
- Security vulnerability scanning
- Minimal dependency footprint to reduce attack surface

## Browser Support

Dependencies are chosen to support:
- Chrome 89+
- Firefox 78+
- Safari 14+
- Edge 89+

## Performance Considerations

### Bundle Size Optimization
- Tree shaking enabled
- Code splitting for lazy loading
- Minimal runtime dependencies
- Web Worker for heavy computations

### Runtime Performance
- Virtualized lists for large datasets
- Efficient state management with Zustand
- Web Worker for DuckDB operations
- Optimized re-renders with React