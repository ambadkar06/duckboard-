# Duckboard

Duckboard is a privacy‑first, serverless analytics studio that runs entirely in your browser. Analyze CSV and Parquet files with SQL and create publication‑ready charts using DuckDB‑WASM and Vega‑Lite.


## Live: https://duckboard-mvgt.vercel.app/


## Highlights

- Privacy‑first local processing: data never leaves the browser.
- SQL analytics powered by DuckDB‑WASM.
- CSV and Parquet file support with drag‑and‑drop import.
- Interactive charting via Vega‑Lite.
- Session bundles for save/restore (`.duckboard`).
- Progressive Web App capabilities for offline use.
- Fast, modern UI built with React and TypeScript.

## Quick Start

- Install Node.js 18 or later.
- Install dependencies: `npm install`.
- Start the dev server: `npm run dev`.
- Open the app and drag CSV/Parquet files into the Dataset Drawer.
- Write SQL in the editor and view results and charts.

## Development

### Prerequisites

- Node.js `>=18`
- npm (or yarn/pnpm)

### Common Commands

- `npm run dev` — start the development server (Vite).
- `npm run build` — type‑check and build for production.
- `npm run preview` — preview the production build locally.
- `npm run test` — run unit tests (Vitest).
- `npm run test:e2e` — run end‑to‑end tests (Playwright).
- `npm run type-check` — TypeScript type checking.
- `npm run lint` — lint the codebase.
- `npm run format` — format the codebase with Prettier.

### Project Structure

```
src/
├── components/          # React components
│   ├── BundleManager.tsx     # Bundle import/export and PDF export UI
│   ├── ChartBuilder.tsx      # Vega-Lite chart builder
│   ├── DatasetDrawer.tsx     # File upload and dataset management
│   ├── DiagnosticsModal.tsx  # DuckDB engine diagnostics viewer
│   ├── ResultsGrid.tsx       # Virtualized query results
│   ├── SQLEditor.tsx         # SQL editor
│   └── Toolbar.tsx           # Top toolbar controls
├── providers/
│   └── DuckDBProvider.tsx    # Worker lifecycle and diagnostics context
├── store/
│   └── store.ts              # Zustand application state
├── types/
│   ├── bundle.ts             # Bundle schema, PDF export utilities
│   └── index.ts              # Core types
├── workers/
│   └── duckdb.worker.ts      # DuckDB‑WASM worker implementation
└── utils/
    └── sw.ts                 # Service worker registration
```

## Architecture

### Overview

- Frontend: React 18, TypeScript, Vite.
- Database: DuckDB‑WASM executing entirely in a Web Worker.
- Worker bridge: Comlink is used to expose a typed API from the worker.
- State: Zustand for lightweight state management with selective persistence.
- Charts: Vega‑Lite for specification‑driven visualization.
- PDF export: jsPDF + `jspdf-autotable` to produce a self‑contained report.

### Execution Model

- File ingestion and SQL execution run in a dedicated worker (`duckdb.worker.ts`) to keep the UI responsive.
- The provider (`DuckDBProvider.tsx`) establishes a MessageChannel, wraps it with Comlink, initializes DuckDB, and surfaces diagnostics to the UI.
- Results are rendered in a virtualized grid; chart configuration is driven from query outputs.

### Diagnostics

- The worker exposes `getDiagnostics()` including: cross‑origin isolation, threads availability, selected module, SIMD support, DuckDB version, and initialization time.
- The Diagnostics Modal provides a concise view and allows refreshing diagnostics.

## Export and Import

### Session Bundles

- Duckboard can serialize the current session (datasets metadata, current query, results, chart config, and panel state) to a `.duckboard` file with Zod validation.
- Bundles can be imported to restore the session’s state.

### PDF Export

- Use the Export dialog (Bundle Manager) to select sections and export to PDF.
- A filename field allows specifying the output name; disallowed characters are sanitized and `.pdf` is enforced.
- The “Included” checklist uses clear Yes/No values for reliable rendering.
- Options include cover page, table of contents label, chart captions, and wide‑table optimization (landscape and column chunking).

## Security and Privacy

- All computations run locally in the browser; no server‑side processing.
- No analytics or tracking requests are performed.
- PWA support allows offline operation.

## Browser Support

- Chrome 89+
- Firefox 78+
- Safari 14+
- Edge 89+

## Testing

- Unit tests: `npm run test` (Vitest).
- End‑to‑end tests: `npm run test:e2e` (Playwright).
- Test setup is under `src/test` and `e2e/`.

## Contributing

- Fork the repository and create a feature branch.
- Keep changes focused and covered by tests where applicable.
- Ensure `npm run type-check` and `npm run lint` pass.
- Submit a pull request describing the motivation and changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) for details.

## Acknowledgements

- DuckDB for the embedded analytics database.
- Vega‑Lite for the visualization grammar.
- Monaco Editor for the SQL editing experience.
- Vite for the fast development and build tooling.
