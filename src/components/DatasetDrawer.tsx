import { useState, useRef } from 'react'

import { useStore } from '../store/store'
import { useDuckDB } from '../providers/DuckDBProvider'

interface DatasetDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function DatasetDrawer({ isOpen, onClose }: DatasetDrawerProps) {
  const { worker, isInitialized } = useDuckDB()
  const { datasets, addDataset, setCurrentQuery, setActivePanel } = useStore()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [copiedById, setCopiedById] = useState<Record<string, boolean>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileUpload = async (files: FileList) => {
    if (!worker || !isInitialized || isUploading) return

    setIsUploading(true)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileName = file.name
      const fileExtension = fileName.split('.').pop()?.toLowerCase()
      
      if (fileExtension !== 'csv' && fileExtension !== 'parquet') {
        alert(`Unsupported file type: ${fileExtension}. Please upload CSV or Parquet files.`)
        continue
      }

      try {
        // Read file as ArrayBuffer
        const buffer = await file.arrayBuffer()
        
        // Ensure Comlink-exposed method is present
        const hasRegister = typeof (worker as any).registerFile === 'function'
        if (!hasRegister) {
          throw new Error('DuckDB worker not ready: registerFile missing')
        }
        // Register file with DuckDB
        await worker.registerFile(fileName, buffer)
        
        // Create a view from the file
        const tableName = fileName.replace(/\.(csv|parquet)$/i, '').replace(/[^a-zA-Z0-9_]/g, '_')
        await worker.createView(tableName, fileName, fileExtension as 'csv' | 'parquet')
        
        // Get table info
        const tableInfo = await worker.getTableInfo(tableName)
        
        // Convert table info columns to Dataset Column format
        const columns = tableInfo.columns.map(col => ({
          name: col.name,
          type: col.type,
          nullable: true // Default to true since we don't have this info from DESCRIBE
        }))
        
        // Add to store (don't send the File object to avoid DataCloneError)
        addDataset({
          id: tableName,
          name: fileName,
          fileName,
          tableName,
          columns,
          fileSize: file.size,
          size: file.size, // Alias for compatibility
          rowCount: 0, // Will be populated later
          file: null, // Don't store the File object to avoid serialization issues
          embedded: false,
          uploadedAt: new Date().toISOString(),
          createdAt: new Date()
        })
        
        console.log(`Successfully loaded ${fileName} as ${tableName}`)
      } catch (error) {
        console.error(`Failed to load ${fileName}:`, error)
        alert(`Failed to load ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    setIsUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files)
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".csv,.parquet"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
      <div style={{
        width: '300px',
        backgroundColor: 'var(--surface-2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
      <div className="header" style={{
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>Datasets</h3>
        <button
          onClick={onClose}
          className="btn"
          style={{ fontSize: '12px', padding: '4px 8px' }}
        >
          ×
        </button>
      </div>
      
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto'
      }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="drop-zone" style={{
          borderColor: isDragging ? 'var(--accent)' : undefined,
          color: isDragging ? 'var(--text)' : undefined,
          backgroundColor: isDragging ? 'rgba(13,110,253,0.08)' : undefined,
          cursor: isUploading ? 'wait' : 'pointer'
        }}
          onClick={isUploading ? undefined : handleBrowseClick}
        >
          {isUploading ? (
            <div>Uploading files...</div>
          ) : (
            <>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                Drop CSV or Parquet files here
              </div>
              <div style={{ fontSize: '12px' }}>
                or click to browse
              </div>
            </>
          )}
        </div>
        
        {datasets.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{
              fontSize: '12px',
              color: '#6c757d',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              Loaded Datasets ({datasets.length})
            </div>
            {datasets.map(dataset => (
              <div key={dataset.id} className="panel-surface" style={{
                padding: '8px',
                marginBottom: '8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                  {dataset.name}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>
                  {dataset.columns.length} columns • {(dataset.size / 1024 / 1024).toFixed(2)} MB
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>
                  Table: {dataset.tableName}
                </div>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  <button
                    className="btn"
                    style={{ fontSize: '12px' }}
                    onClick={() => {
                      const sql = `SELECT * FROM ${dataset.tableName} LIMIT 10;`
                      setCurrentQuery(sql)
                      setActivePanel('sql')
                    }}
                  >
                    Insert SELECT
                  </button>
                  <button
                    className="btn"
                    style={{ fontSize: '12px' }}
                    aria-live="polite"
                    disabled={!!copiedById[dataset.id]}
                    onClick={() => {
                      navigator.clipboard?.writeText(dataset.tableName)
                      setCopiedById(prev => ({ ...prev, [dataset.id]: true }))
                      setTimeout(() => {
                        setCopiedById(prev => ({ ...prev, [dataset.id]: false }))
                      }, 5000)
                    }}
                  >
                    {copiedById[dataset.id] ? 'Copied' : 'Copy table name'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  )
}