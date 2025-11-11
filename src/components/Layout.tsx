import { useState } from 'react'
import { SQLEditor } from './SQLEditor'
import { ResultsGrid } from './ResultsGrid'
import { ChartBuilder } from './ChartBuilder'
import { DatasetDrawer } from './DatasetDrawer'
import { StatusBar } from './StatusBar'
import { Toolbar } from './Toolbar'
import { useStore } from '../store/store'

export function Layout() {
  const { activePanel, setActivePanel } = useStore()
  const [isDrawerOpen, setIsDrawerOpen] = useState(true)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw'
    }}>
      <Toolbar onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)} />
      
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      }}>
        <DatasetDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
        
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div className="tabbar">
            <button
              onClick={() => setActivePanel('sql')}
              className={`tab-btn ${activePanel === 'sql' ? 'active' : ''}`}
            >
              SQL Editor
            </button>
            <button
              onClick={() => setActivePanel('results')}
              className={`tab-btn ${activePanel === 'results' ? 'active' : ''}`}
            >
              Results
            </button>
            <button
              onClick={() => setActivePanel('charts')}
              className={`tab-btn ${activePanel === 'charts' ? 'active' : ''}`}
            >
              Charts
            </button>
          </div>

          <div style={{
            flex: 1,
            overflow: 'hidden'
          }}>
            {activePanel === 'sql' && <SQLEditor />}
            {activePanel === 'results' && <ResultsGrid />}
            {activePanel === 'charts' && <ChartBuilder />}
          </div>
        </div>
      </div>
      
      <StatusBar />
    </div>
  )
}