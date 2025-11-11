# Duckboard Architecture

## Overview

Duckboard is a privacy-first, serverless analytics studio that runs entirely in the browser. This document outlines the technical architecture and design decisions.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser UI                               │
├─────────────────────────────────────────────────────────────────┤
│  React Components  │  State Management │  TypeScript Types   │
│  ┌─────────────┐   │  ┌──────────────┐  │  ┌──────────────┐  │
│  │SQLEditor    │   │  │Zustand Store │  │  │Bundle Types  │  │
│  │ChartBuilder │   │  │              │  │  │Chart Config  │  │
│  │ResultsGrid  │   │  │Query State   │  │  │Dataset Types │  │
│  │BundleManager│   │  │Dataset State │  │  │              │  │
│  └─────────────┘   │  │Chart Config  │  │  │              │  │
│                    │  └──────────────┘  │  └──────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    Web Workers                                  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    DuckDB Worker                            │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐ │  │
│  │  │File I/O │  │SQL Exec │  │Data Proc│  │Result Set│ │  │
│  │  │CSV/Parq │  │Query    │  │Transform│  │Streaming │ │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └──────────┘ │  │
│  └─────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    Browser APIs                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │File API      │  │IndexedDB     │  │Service Worker      │  │
│  │Drag & Drop   │  │Local Storage │  │PWA Cache           │  │
│  │File Reading  │  │Bundle Export │  │Offline Support     │  │
│  └──────────────┘  └──────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend Layer

#### React Components
- **SQLEditor**: Monaco-based SQL editor with syntax highlighting
- **ChartBuilder**: Vega-Lite chart configuration interface
- **ResultsGrid**: Virtualized data grid for large result sets
- **DatasetDrawer**: File upload and dataset management
- **BundleManager**: Session export/import functionality
- **Toolbar**: Application controls and navigation

#### State Management (Zustand)
```typescript
interface AppState {
  // Query Management
  currentQuery: string;
  queryResult: QueryResult | null;
  queryStatus: QueryStatus;
  
  // Dataset Management  
  datasets: Dataset[];
  
  // Chart Configuration
  chartConfig: ChartConfig | null;
  
  // UI State
  activePanel: Panel;
  
  // Actions
  setCurrentQuery: (query: string) => void;
  setQueryResult: (result: QueryResult | null) => void;
  setQueryStatus: (status: QueryStatus) => void;
  addDataset: (dataset: Dataset) => void;
  removeDataset: (id: string) => void;
  setChartConfig: (config: ChartConfig | null) => void;
  clearSession: () => void;
}
```

### 2. Database Layer (DuckDB-WASM)

#### Web Worker Architecture
- Runs DuckDB-WASM in a separate thread
- Prevents UI blocking during query execution
- Handles file I/O operations
- Manages database state and connections

#### SQL Execution Flow
1. User writes SQL query in editor
2. Query is sent to DuckDB worker via Comlink
3. Worker executes query against in-memory database
4. Results are streamed back to main thread
5. Virtualized grid displays results efficiently

### 3. Chart System (Vega-Lite)

#### Chart Configuration
```typescript
interface ChartConfig {
  type: 'bar' | 'line' | 'scatter' | 'histogram';
  xField: string;
  yField: string;
  colorField?: string;
}
```

#### Auto-Field Detection
- Analyzes query result schema
- Suggests appropriate chart types
- Recommends field mappings
- Handles data type inference

### 4. Bundle System

#### Export Format (.duckboard)
```typescript
interface DuckboardBundle {
  version: string;
  timestamp: string;
  datasets: Dataset[];
  currentQuery: string;
  queryResult: QueryResult | null;
  chartConfig: ChartConfig | null;
}
```

#### Import/Export Process
1. Bundle is validated using Zod schemas
2. Data is compressed using JSZip
3. Files are base64 encoded for portability
4. Bundle can be shared and imported on any device

### 5. Storage Layer

#### IndexedDB Schema
- **Datasets**: File metadata and schema information
- **Query History**: Recent queries for quick access
- **Chart Configs**: Saved chart configurations
- **App State**: Persistent application state

#### PWA Cache Strategy
- Static assets cached with service worker
- Database files cached for offline access
- Query results cached for performance
- Bundle files cached for quick access

## Data Flow

### File Upload Flow
```
User Drop File → File API → DuckDB Worker → Schema Detection → Store Dataset → Update UI
```

### Query Execution Flow
```
User Input → SQL Editor → Zustand Store → DuckDB Worker → Query Execution → Stream Results → Virtual Grid
```

### Chart Creation Flow
```
Query Results → Field Detection → Chart Config → Vega-Lite Spec → Render Chart → Export Options
```

### Bundle Export Flow
```
App State → Zod Validation → JSZip Compression → Base64 Encode → File Download
```

## Performance Optimizations

### Virtualization
- react-window for large result sets
- Efficient memory usage for big data
- Smooth scrolling performance

### Worker Pool
- DuckDB operations in Web Worker
- Non-blocking UI during queries
- Parallel processing capabilities

### Caching Strategies
- Query result caching
- Schema information caching
- Chart configuration persistence
- PWA offline caching

## Security Considerations

### Data Privacy
- All processing happens locally
- No external API calls
- No data transmission
- Client-side only architecture

### File Security
- File API for direct access
- No server-side storage
- User-controlled data lifecycle
- Secure bundle export/import

## Browser Compatibility

### Required APIs
- Web Workers
- File API
- IndexedDB
- Service Worker
- ES2020+ features

### Supported Browsers
- Chrome 89+
- Firefox 78+
- Safari 14+
- Edge 89+

## Future Enhancements

### Planned Features
- Multiple database connections
- Advanced chart types
- Query sharing capabilities
- Collaborative features
- Plugin system

### Performance Improvements
- Query optimization hints
- Result set pagination
- Advanced caching strategies
- Background processing

## Development Guidelines

### Code Organization
- Component-based architecture
- Type-safe development
- Comprehensive testing
- Documentation standards

### Testing Strategy
- Unit tests with Vitest
- E2E tests with Playwright
- Component testing
- Performance testing

### Deployment
- GitHub Pages hosting
- CI/CD with GitHub Actions
- Automated testing pipeline
- Production optimizations