import { useState, useEffect } from 'react'
import { DuckDBProvider } from './providers/DuckDBProvider'
import { Layout } from './components/Layout'
import { LoadingScreen } from './components/LoadingScreen'
import { useStore } from './store/store'

function App() {
  const [isInitializing, setIsInitializing] = useState(true)
  const { initializeSession } = useStore()

  useEffect(() => {
    const init = async () => {
      try {
        await initializeSession()
      } catch (error) {
        console.error('Failed to initialize session:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    init()
  }, [initializeSession])

  if (isInitializing) {
    return <LoadingScreen />
  }

  return (
    <DuckDBProvider>
      <Layout />
    </DuckDBProvider>
  )
}

export default App