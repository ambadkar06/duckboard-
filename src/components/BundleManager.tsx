import { useState, useRef } from 'react'
import { useStore } from '../store/store'
import { createBundle, downloadBundlePdf, loadBundle, type BundlePdfOptions } from '../types/bundle'
import { useDuckDB } from '../providers/DuckDBProvider'

export function BundleManager() {
  const store = useStore()
  const { worker: _worker } = useDuckDB()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const defaultBaseName = `duckboard-${new Date().toISOString().split('T')[0]}`
  const [pdfName, setPdfName] = useState<string>(`${defaultBaseName}.pdf`)
  const [options, setOptions] = useState<BundlePdfOptions>({
    includeMetadata: true,
    includeQuery: true,
    includeDatasets: true,
    includeResults: true,
    includeCharts: true,
    maxResultRows: 50,
    optimizeWideTables: true
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    setShowOptions(true)
  }

  const confirmExport = async () => {
    if (isExporting) return
    setIsExporting(true)
    setError(null)
    try {
      // Determine safe filename and base bundle name
      const rawName = (pdfName || '').trim() || `${defaultBaseName}.pdf`
      const sanitized = rawName.replace(/[\\/:*?"<>|]/g, '-')
      const finalName = sanitized.toLowerCase().endsWith('.pdf') ? sanitized : `${sanitized}.pdf`
      const baseName = finalName.replace(/\.pdf$/i, '')

      const bundle = createBundle(
        baseName,
        {
          datasets: store.datasets,
          currentQuery: store.currentQuery,
          queryResult: store.queryResult,
          queryStatus: store.queryStatus,
          chartConfig: store.chartConfig,
          activePanel: store.activePanel
        },
        `Duckboard session exported on ${new Date().toLocaleDateString()}`
      )
      await downloadBundlePdf(bundle, finalName, options)
      setShowOptions(false)
    } catch (err) {
      setError(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setError(null)

    try {
      const bundle = await loadBundle(file)
      
      // Clear current session
      store.clearSession()
      
      // Import datasets and register files
      for (const dataset of bundle.datasets) {
        // Convert bundle dataset to store dataset format
        const storeDataset = {
          id: dataset.id,
          name: dataset.name,
          tableName: dataset.tableName || dataset.id,
          fileName: dataset.fileName,
          fileSize: dataset.fileSize,
          size: dataset.fileSize,
          rowCount: dataset.columnCount || 0,
          columns: [], // We'll need to get this from the actual table
          file: null,
          embedded: false, // Default to false since we don't have the original file
          uploadedAt: dataset.uploadedAt,
          createdAt: new Date()
        }
        // Note: We can't actually re-upload the files, but we can restore metadata
        // In a real implementation, you'd need to handle file restoration
        store.addDataset(storeDataset)
      }
      
      // Restore query and results
      if (bundle.currentQuery) {
        store.setCurrentQuery(bundle.currentQuery)
      }
      
      if (bundle.queryResult) {
        store.setQueryResult(bundle.queryResult)
      }
      
      if (bundle.queryStatus) {
        store.setQueryStatus({
          isRunning: bundle.queryStatus.isRunning,
          error: bundle.queryStatus.error || null,
          executionTime: bundle.queryStatus.executionTime
        })
      }
      
      if (bundle.chartConfig) {
        store.setChartConfig(bundle.chartConfig)
      }
      
      if (bundle.activePanel) {
        store.setActivePanel(bundle.activePanel)
      }
      
    } catch (err) {
      setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsImporting(false)
      // Reset file input
      event.target.value = ''
    }
  }

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      alignItems: 'center'
    }}>
      <button
        onClick={handleExport}
        disabled={isExporting}
        style={{
          padding: '6px 12px',
          border: '1px solid #ced4da',
          borderRadius: '4px',
          backgroundColor: isExporting ? '#e9ecef' : '#fff',
          color: '#495057',
          fontSize: '12px',
          cursor: isExporting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        {isExporting ? '⏳' : '📄'}
        Export PDF
      </button>
      
      <button
        onClick={handleImport}
        disabled={isImporting}
        style={{
          padding: '6px 12px',
          border: '1px solid #ced4da',
          borderRadius: '4px',
          backgroundColor: isImporting ? '#e9ecef' : '#fff',
          color: '#495057',
          fontSize: '12px',
          cursor: isImporting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        {isImporting ? '⏳' : '📁'}
        Import Bundle
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".duckboard,.json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      {showOptions && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="panel-surface" style={{
            width: '420px',
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              Export PDF – Select Sections
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '12px', color: 'var(--muted)' }}>File name</label>
                <input
                  type="text"
                  value={pdfName}
                  onChange={(e) => setPdfName(e.target.value)}
                  placeholder={`${defaultBaseName}.pdf`}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '12px'
                  }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={!!options.includeMetadata}
                  onChange={(e) => setOptions(o => ({ ...o, includeMetadata: e.target.checked }))}
                />
                Include export metadata
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={!!options.includeQuery}
                  onChange={(e) => setOptions(o => ({ ...o, includeQuery: e.target.checked }))}
                />
                Include current SQL query
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={!!options.includeDatasets}
                  onChange={(e) => setOptions(o => ({ ...o, includeDatasets: e.target.checked }))}
                />
                Include datasets table
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={!!options.includeResults}
                  onChange={(e) => setOptions(o => ({ ...o, includeResults: e.target.checked }))}
                />
                Include results table
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={!!options.includeCharts}
                  onChange={(e) => setOptions(o => ({ ...o, includeCharts: e.target.checked }))}
                />
                Include charts section
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={!!options.includeCover}
                  onChange={(e) => setOptions(o => ({ ...o, includeCover: e.target.checked }))}
                />
                Include cover page (title + description)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={!!options.includeTOC}
                  onChange={(e) => setOptions(o => ({ ...o, includeTOC: e.target.checked }))}
                />
                Rename checklist to Table of Contents
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={options.includeChartCaptions ?? true}
                  onChange={(e) => setOptions(o => ({ ...o, includeChartCaptions: e.target.checked }))}
                />
                Add chart captions under images
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={!!options.optimizeWideTables}
                  onChange={(e) => setOptions(o => ({ ...o, optimizeWideTables: e.target.checked }))}
                />
                Optimize wide tables (landscape + column chunks)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '12px', color: 'var(--muted)' }}>Max result rows</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={options.maxResultRows ?? 50}
                  onChange={(e) => setOptions(o => ({ ...o, maxResultRows: Math.max(1, Math.min(1000, Number(e.target.value))) }))}
                  style={{
                    width: '80px',
                    padding: '4px 6px',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '12px'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button className="btn" style={{ fontSize: '12px' }} onClick={() => setShowOptions(false)}>Cancel</button>
              <button className="btn" style={{ fontSize: '12px' }} onClick={confirmExport} disabled={isExporting}>
                {isExporting ? 'Exporting…' : 'Export Selected'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          padding: '4px 8px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          color: '#721c24',
          fontSize: '12px'
        }}>
          {error}
        </div>
      )}
    </div>
  )
}