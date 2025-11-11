# Duckboard Development Guide

## Quick Start

### 1. Prerequisites
- Node.js 18.0.0 or higher
- npm, yarn, or pnpm package manager
- Git

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/duckboard.git
cd duckboard

# Run setup script (Unix/Mac)
chmod +x setup.sh
./setup.sh

# Or run setup script (Windows)
setup.bat

# Or manual installation
npm install
```

### 3. Development Server
```bash
npm run dev
```
Visit `http://localhost:5173` to see the application.

## Project Structure

```
src/
├── components/          # React components
│   ├── BundleManager.tsx     # Export/import functionality
│   ├── ChartBuilder.tsx      # Vega-Lite chart builder
│   ├── DatasetDrawer.tsx     # File upload and dataset management
│   ├── ResultsGrid.tsx       # Virtualized query results
│   ├── SQLEditor.tsx         # Monaco SQL editor
│   ├── Toolbar.tsx           # Application toolbar
│   └── Layout.tsx            # Main layout component
├── providers/         # React context providers
│   └── DuckDBProvider.tsx    # DuckDB worker integration
├── store/             # Zustand state management
│   ├── store.ts              # Global application state
│   └── store.test.ts         # Store tests
├── workers/           # Web Workers
│   └── duckdb.worker.ts      # DuckDB-WASM worker
├── types/             # TypeScript type definitions
│   ├── index.ts              # Core types
│   └── bundle.ts             # Bundle export/import types
├── utils/             # Utility functions
│   └── sw.ts                 # Service worker registration
└── main.tsx           # Application entry point
```

## Development Workflow

### 1. Component Development
```bash
# Start development server
npm run dev

# In another terminal, run tests in watch mode
npm run test -- --watch
```

### 2. Adding New Features
1. Create component in `src/components/`
2. Add types to `src/types/index.ts`
3. Update store if needed in `src/store/store.ts`
4. Add tests in `src/store/store.test.ts`
5. Update documentation

### 3. Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## Key Technologies

### DuckDB-WASM
- Runs in Web Worker for performance
- Handles CSV and Parquet file processing
- Provides SQL execution capabilities

### State Management (Zustand)
```typescript
// Example: Adding a new state property
interface AppState {
  myNewProperty: string
  setMyNewProperty: (value: string) => void
}

// In store.ts
myNewProperty: '',
setMyNewProperty: (value) => set({ myNewProperty: value })
```

### Chart System (Vega-Lite)
- Auto-generates Vega-Lite specifications
- Supports multiple chart types
- Handles field type inference

### Bundle System
- Exports sessions as `.duckboard` files
- Uses Zod for validation
- Compresses data with JSZip

## Common Development Tasks

### Adding a New Chart Type
1. Update `ChartConfig` type in `src/types/index.ts`
2. Add chart type to `ChartBuilder.tsx`
3. Update Vega-Lite spec generation
4. Add tests for new functionality

### Adding a New File Format
1. Update DuckDB worker in `src/workers/duckdb.worker.ts`
2. Add file type detection
3. Update UI components for new format
4. Add validation and error handling

### Modifying the Store
1. Update `AppState` interface in `src/store/store.ts`
2. Add new actions and state
3. Update persistence configuration
4. Add tests in `src/store/store.test.ts`

## Testing Guidelines

### Unit Tests
- Test store actions and state changes
- Test utility functions
- Test component logic

### E2E Tests
- Test file upload functionality
- Test SQL query execution
- Test chart creation
- Test bundle export/import

### Test Structure
```typescript
// Example test structure
describe('Feature', () => {
  beforeEach(() => {
    // Reset state before each test
    useStore.getState().clearSession()
  })

  it('should do something', () => {
    // Test implementation
    expect(result).toBe(expected)
  })
})
```

## Performance Optimization

### Virtualization
- Use `react-window` for large lists
- Implement proper key props
- Optimize re-renders

### Web Workers
- Move heavy computations to workers
- Use Comlink for worker communication
- Handle worker errors gracefully

### State Management
- Use Zustand selectors for fine-grained subscriptions
- Minimize state updates
- Use proper React.memo usage

## Debugging

### Browser DevTools
- React DevTools for component inspection
- Redux DevTools for state inspection (Zustand compatible)
- Performance profiler for optimization

### Console Debugging
```typescript
// Store debugging
const state = useStore.getState()
console.log('Current state:', state)

// Worker debugging
// Check browser console for worker messages
```

### Common Issues
1. **Worker not loading**: Check browser console for CORS issues
2. **File upload failing**: Check file type and size limits
3. **Charts not rendering**: Check Vega-Lite console errors
4. **State not persisting**: Check localStorage quota

## Deployment

### Development Build
```bash
npm run build
npm run preview
```

### Production Build
```bash
npm run build
# Deploy dist/ folder to your hosting provider
```

### GitHub Pages
```bash
# Automatic via GitHub Actions on push to main
# Manual deployment
npm run build
# Copy dist/ contents to gh-pages branch
```

## Contributing

### Code Style
- Follow TypeScript best practices
- Use proper React patterns
- Write comprehensive tests
- Document your changes

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Update documentation
5. Submit pull request

### Code Review Checklist
- [ ] Tests pass
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Code is formatted
- [ ] Documentation updated
- [ ] Performance impact considered

## Resources

### Documentation
- [DuckDB-WASM Documentation](https://duckdb.org/docs/api/wasm)
- [Vega-Lite Documentation](https://vega.github.io/vega-lite/docs/)
- [React Documentation](https://react.dev/)
- [Zustand Documentation](https://zustand.docs.pmnd.rs/)

### Examples
- See `src/store/store.test.ts` for testing examples
- Check component files for React patterns
- Review worker implementation for Web Worker usage

### Community
- GitHub Issues for bug reports
- GitHub Discussions for questions
- Pull requests for contributions