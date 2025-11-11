import { useStore } from '../store/store'
import { BundleManager } from './BundleManager'
import { useState } from 'react'
import { DiagnosticsModal } from './DiagnosticsModal'

interface ToolbarProps {
  onToggleDrawer: () => void
}

export function Toolbar({ onToggleDrawer }: ToolbarProps) {
  const { datasets, clearSession } = useStore()
  const [showDiagnostics, setShowDiagnostics] = useState(false)

  return (
    <div className="header" style={{
      display: 'flex',
      alignItems: 'center',
      padding: '8px 16px',
      gap: '12px'
    }}>
      <button onClick={onToggleDrawer} className="btn">
        ☰ Datasets
      </button>
      
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#495057'
      }}>
        Duckboard
      </div>
      
      <div style={{ flex: 1 }} />
      
      <BundleManager />

      <button className="btn" title="Diagnostics" onClick={() => setShowDiagnostics(true)}>
        ⚙️ Diagnostics
      </button>
      
      <div style={{
        fontSize: '12px',
        color: '#6c757d'
      }}>
        {datasets.length} dataset{datasets.length !== 1 ? 's' : ''}
      </div>
      
      <button
        onClick={() => {
          if (confirm('Clear all data and start fresh?')) {
            clearSession()
          }
        }}
        className="btn btn-danger"
      >
        Clear Session
      </button>
      {showDiagnostics && (
        <DiagnosticsModal open={showDiagnostics} onClose={() => setShowDiagnostics(false)} />
      )}
    </div>
  )
}