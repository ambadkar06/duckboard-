import { useEffect, useState } from 'react'

export function LoadingScreen() {
  const [dots, setDots] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev + 1) % 4)
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f8f9fa',
      color: '#495057'
    }}>
      <div style={{
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '20px'
      }}>
        Duckboard
      </div>
      <div style={{
        fontSize: '16px',
        marginBottom: '10px'
      }}>
        Initializing DuckDB-WASM
      </div>
      <div style={{
        fontSize: '14px',
        color: '#6c757d'
      }}>
        Loading{'.'.repeat(dots)}
      </div>
    </div>
  )
}