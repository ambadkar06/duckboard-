# Duckboard 🦆

A privacy-first, serverless analytics studio that runs entirely in your browser. Analyze CSV and Parquet files with SQL and create beautiful charts using DuckDB-WASM.

## Features ✨

- **🔒 Privacy-First**: All data processing happens locally in your browser - no data ever leaves your device
- **📊 SQL Analytics**: Full SQL support powered by DuckDB-WASM for fast, in-memory analytics
- **📁 File Support**: Import CSV and Parquet files with drag-and-drop simplicity
- **📈 Interactive Charts**: Create beautiful visualizations with Vega-Lite
- **💾 Session Management**: Save and restore your analysis sessions with .duckboard bundles
- **📱 Progressive Web App**: Works offline as a PWA on desktop and mobile
- **🚀 Blazing Fast**: DuckDB's columnar engine provides lightning-fast query performance
- **🎨 Modern UI**: Clean, intuitive interface built with React and TypeScript

## Quick Start 🚀

1. **Open Duckboard**: Navigate to [duckboard.app](https://duckboard.app) or run locally
2. **Upload Data**: Drag and drop CSV or Parquet files into the dataset drawer
3. **Write SQL**: Use the Monaco SQL editor with syntax highlighting and auto-completion
4. **Visualize**: Create charts with the Vega-Lite chart builder
5. **Export**: Save your session as a .duckboard bundle to share or restore later

## Development 🛠️

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/duckboard.git
cd duckboard

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test
npm run test:e2e

# Build for production
npm run build
```

### Project Structure

```
src/
├── components/          # React components
│   ├── ChartBuilder.tsx      # Vega-Lite chart builder
│   ├── DatasetDrawer.tsx     # File upload and dataset management
│   ├── ResultsGrid.tsx       # Virtualized query results
│   ├── SQLEditor.tsx         # Monaco SQL editor
│   └── BundleManager.tsx     # Export/import functionality
├── providers/         # React context providers
│   └── DuckDBProvider.tsx    # DuckDB worker integration
├── store/             # Zustand state management
│   └── store.ts              # Global application state
├── workers/           # Web Workers
│   └── duckdb.worker.ts      # DuckDB-WASM worker
├── types/             # TypeScript type definitions
│   ├── index.ts              # Core types
│   └── bundle.ts             # Bundle export/import types
└── utils/             # Utility functions
    └── sw.ts                   # Service worker registration
```

## Architecture 🏗️

### Core Technologies

- **Frontend**: React 18, TypeScript, Vite
- **Database**: DuckDB-WASM for in-browser SQL processing
- **State Management**: Zustand with persistence
- **UI Components**: Custom components with inline styles
- **Charts**: Vega-Lite for interactive visualizations
- **Editor**: Monaco Editor for SQL editing
- **Virtualization**: react-window for large result sets

### Data Flow

1. **File Upload**: Files are processed in the browser using DuckDB-WASM
2. **SQL Execution**: Queries run in a Web Worker to avoid blocking the UI
3. **Results Display**: Virtualized grids handle large result sets efficiently
4. **Chart Creation**: Vega-Lite specs are generated from query results
5. **Bundle Export**: Sessions are serialized with Zod validation

### Security & Privacy

- **Local Processing**: All data stays in your browser
- **No External Requests**: No analytics, tracking, or data transmission
- **PWA Support**: Works offline without internet connection
- **File Access**: Direct file access via File API, no server upload

## Browser Support 🌐

- Chrome 89+ (recommended)
- Firefox 78+
- Safari 14+
- Edge 89+

## Contributing 🤝

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `npm run test`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## License 📄

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- [DuckDB](https://duckdb.org/) for the amazing embedded database
- [Vega-Lite](https://vega.github.io/vega-lite/) for powerful visualization grammar
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the SQL editor
- [Vite](https://vitejs.dev/) for the fast build tool

---

**Made with ❤️ for the data community**