import { useState, useCallback, useMemo } from 'react'
import { useStore } from '../store/store'
import { VariableSizeGrid as Grid } from 'react-window'
import { useDuckDB } from '../providers/DuckDBProvider'



export function ResultsGrid() {
  const { queryResult, queryStatus, currentQuery } = useStore()
  const { worker } = useDuckDB()
  const [isDownloading, setIsDownloading] = useState(false)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const rect = node.getBoundingClientRect()
      setContainerSize({ width: rect.width, height: rect.height })
    }
  }, [])

  const { data, columns } = queryResult

  const columnWidths = useMemo(() => {
    if (!data || data.length === 0) return {}
    
    const widths: Record<number, number> = {}
    columns.forEach((col, index) => {
      // Calculate max width for each column
      const maxContentLength = Math.max(
        col.length,
        ...data.slice(0, 100).map(row => String(row[col] || '').length)
      )
      widths[index] = Math.min(Math.max(maxContentLength * 8 + 16, 100), 300)
    })
    return widths
  }, [data, columns])

  const Cell = ({ columnIndex, rowIndex, style, data: cellData }: {
    columnIndex: number
    rowIndex: number
    style: React.CSSProperties
    data: { data: any[], columns: string[] }
  }) => {
    const { data, columns } = cellData
    
    if (rowIndex === 0) {
      // Header row
      return (
        <div
          style={{
            ...style,
            backgroundColor: 'var(--surface-2)',
            borderBottom: '2px solid var(--border)',
            borderRight: columnIndex < columns.length - 1 ? '1px solid var(--border)' : 'none',
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            fontWeight: 'bold',
            fontSize: '12px'
          }}
        >
          {columns[columnIndex]}
        </div>
      )
    }

    // Data row
    const rowData = data[rowIndex - 1]
    const value = rowData ? rowData[columns[columnIndex]] : ''

    return (
      <div
        style={{
          ...style,
          // Remove white; use soft surfaces and app bg for striping
          backgroundColor: rowIndex % 2 === 0 ? 'var(--surface-2)' : 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          borderRight: columnIndex < columns.length - 1 ? '1px solid var(--border)' : 'none',
          display: 'flex',
          alignItems: 'center',
          padding: '8px',
          fontSize: '12px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
        title={String(value)}
      >
        {String(value)}
      </div>
    )
  }

  if (queryStatus.error) {
    return (
      <div className="panel-surface" style={{
        height: '100%',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          color: 'var(--danger)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
            Query Error
          </div>
          <div style={{ fontSize: '12px', maxWidth: '400px' }}>
            {queryStatus.error}
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="panel-surface" style={{
        height: '100%',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          color: 'var(--muted)',
          textAlign: 'center'
        }}>
          {queryStatus.isRunning ? (
            <div>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>⏳ Running query...</div>
              <div style={{ fontSize: '12px' }}>Please wait</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>📊 No results yet</div>
              <div style={{ fontSize: '12px' }}>Run a query to see results here</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const totalHeight = containerSize.height - 40 // Account for header
  const rowHeight = 32

  return (
    <div className="panel-surface" style={{
      height: '100%',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '8px 0',
        borderBottom: '1px solid var(--border)',
        marginBottom: '8px',
        fontSize: '12px',
        color: 'var(--muted)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          Results: {data.length.toLocaleString()} rows × {columns.length} columns
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn"
            disabled={isDownloading || queryStatus.isRunning || !worker || !(currentQuery && currentQuery.trim())}
            onClick={async () => {
              if (!worker || !currentQuery) return
              setIsDownloading(true)
              try {
                const buf = await (worker as any).copyQueryToParquet(currentQuery, 'result.parquet')
                const blob = new Blob([buf], { type: 'application/x-parquet' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'result.parquet'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
              } catch (error) {
                console.error('Parquet download failed:', error)
                alert(`Parquet download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
              } finally {
                setIsDownloading(false)
              }
            }}
            style={{ fontSize: '12px' }}
          >
            {isDownloading ? '⏳' : '⬇️'}
            Download Parquet (COPY)
          </button>
        </div>
      </div>
      
       <div 
         ref={containerRef} 
         style={{
           flex: 1,
          backgroundColor: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}
      >
        <Grid
          columnCount={columns.length}
          columnWidth={(index: number) => columnWidths[index] || 150}
          height={totalHeight}
          rowCount={data.length + 1} // +1 for header
          rowHeight={() => rowHeight}
          width={containerSize.width}
          itemData={{ data, columns }}
        >
          {Cell as any}
        </Grid>
      </div>
    </div>
  )
}