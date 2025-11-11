import { useStore } from '../store/store'
import { BundleManager } from './BundleManager'

interface ToolbarProps {
  onToggleDrawer: () => void
}

export function Toolbar({ onToggleDrawer }: ToolbarProps) {
  const { datasets, clearSession } = useStore()

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
    </div>
  )
}