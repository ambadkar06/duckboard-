import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Dataset, Query, Chart, ChartConfig } from '../types'

interface AppState {
  // Datasets
  datasets: Dataset[]
  addDataset: (dataset: Dataset) => void
  removeDataset: (id: string) => void
  
  // Queries
  queries: Query[]
  currentQuery: string
  setCurrentQuery: (query: string) => void
  addQuery: (query: Query) => void
  updateQuery: (id: string, sql: string) => void
  removeQuery: (id: string) => void
  
  // Query results
  queryResult: { data: any[], columns: string[] }
  queryStatus: { isRunning: boolean, error: string | null, executionTime?: number }
  setQueryResult: (result: { data: any[], columns: string[] }) => void
  setQueryStatus: (status: { isRunning: boolean, error: string | null, executionTime?: number }) => void
  
  // Charts
  charts: Chart[]
  chartConfig: ChartConfig | null
  addChart: (chart: Chart) => void
  removeChart: (id: string) => void
  setChartConfig: (config: ChartConfig | null) => void
  
  // UI State
  activePanel: 'sql' | 'results' | 'charts'
  setActivePanel: (panel: 'sql' | 'results' | 'charts') => void
  
  // Session management
  initializeSession: () => Promise<void>
  clearSession: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      datasets: [],
      queries: [],
      currentQuery: '',
      queryResult: { data: [], columns: [] },
      queryStatus: { isRunning: false, error: null },
      charts: [],
      chartConfig: null,
      activePanel: 'sql',

      // Dataset actions
      addDataset: (dataset) => set((state) => ({
        datasets: [...state.datasets, dataset]
      })),
      
      removeDataset: (id) => set((state) => ({
        datasets: state.datasets.filter(d => d.id !== id)
      })),

      // Query actions
      setCurrentQuery: (query) => set({ currentQuery: query }),
      
      addQuery: (query) => set((state) => ({
        queries: [...state.queries, query]
      })),
      
      updateQuery: (id, sql) => set((state) => ({
        queries: state.queries.map(q => q.id === id ? { ...q, sql } : q)
      })),
      
      removeQuery: (id) => set((state) => ({
        queries: state.queries.filter(q => q.id !== id)
      })),

      // Query result actions
      setQueryResult: (result) => set({ queryResult: result }),
      
      setQueryStatus: (status) => set({ queryStatus: status }),

      // Chart actions
      addChart: (chart) => set((state) => ({
        charts: [...state.charts, chart]
      })),
      
      removeChart: (id) => set((state) => ({
        charts: state.charts.filter(c => c.id !== id)
      })),
      
      setChartConfig: (config) => set({ chartConfig: config }),

      // UI actions
      setActivePanel: (panel) => set({ activePanel: panel }),

      // Session management
      initializeSession: async () => {
        // Check for session restore
        const hasStoredSession = localStorage.getItem('duckboard-store') !== null
        if (hasStoredSession) {
          // Session will be automatically restored by persist middleware
          console.log('Session restored from storage')
        }
      },
      
      clearSession: () => {
        set({
          datasets: [],
          queries: [],
          currentQuery: '',
          queryResult: { data: [], columns: [] },
          queryStatus: { isRunning: false, error: null },
          charts: [],
          chartConfig: null,
          activePanel: 'sql'
        })
        localStorage.removeItem('duckboard-store')
      }
    }),
    {
      name: 'duckboard-store',
      // Avoid persisting datasets and queries to prevent stale metadata without worker files
      partialize: (state) => ({
        currentQuery: state.currentQuery,
        charts: state.charts,
        chartConfig: state.chartConfig,
        activePanel: state.activePanel
      })
    }
  )
)