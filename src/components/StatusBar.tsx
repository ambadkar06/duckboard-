import { useStore } from '../store/store'

export function StatusBar() {
  const { queryStatus } = useStore()
  const { isRunning: isQueryRunning, error: queryError } = queryStatus

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '4px 16px',
      backgroundColor: '#f8f9fa',
      borderTop: '1px solid #dee2e6',
      fontSize: '12px',
      color: '#6c757d'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isQueryRunning && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#007bff',
              borderRadius: '50%',
              animation: 'pulse 1s infinite'
            }} />
            Running query...
          </div>
        )}
        
        {queryError && (
          <div style={{ color: '#dc3545' }}>
            Error: {queryError}
          </div>
        )}
        
        <div>
          Status: Ready
        </div>
        
        <div>
          Offline Mode: Available
        </div>
      </div>
      
      <div style={{ flex: 1 }} />
      
      <div>
        Your data never leaves this device • 
        <a href="https://github.com/your-username/duckboard" target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'none' }}>
          GitHub
        </a>
      </div>
    </div>
  )
}