import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '../store/store'

describe('Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useStore.getState().clearSession()
  })

  it('should initialize with default state', () => {
    const state = useStore.getState()
    
    expect(state.datasets).toEqual([])
    expect(state.queries).toEqual([])
    expect(state.currentQuery).toBe('')
    expect(state.charts).toEqual([])
    expect(state.chartConfig).toBe(null)
    expect(state.activePanel).toBe('sql')
    expect(state.queryStatus).toEqual({ isRunning: false, error: null })
    expect(state.queryResult).toEqual({ data: [], columns: [] })
  })

  it('should add datasets', () => {
    const { addDataset } = useStore.getState()
    
    const testDataset = {
      id: 'test-1',
      name: 'Test Dataset',
      tableName: 'test_1',
      fileName: 'test.csv',
      fileSize: 1024,
      size: 1024,
      rowCount: 100,
      columns: [{ name: 'id', type: 'INTEGER', nullable: false }],
      file: null,
      embedded: false,
      uploadedAt: new Date().toISOString(),
      createdAt: new Date()
    }
    
    addDataset(testDataset)
    
    const state = useStore.getState()
    expect(state.datasets).toHaveLength(1)
    expect(state.datasets[0]).toEqual(testDataset)
  })

  it('should remove datasets', () => {
    const { addDataset, removeDataset } = useStore.getState()
    
    const testDataset = {
      id: 'test-1',
      name: 'Test Dataset',
      tableName: 'test_1',
      fileName: 'test.csv',
      fileSize: 1024,
      size: 1024,
      rowCount: 100,
      columns: [{ name: 'id', type: 'INTEGER', nullable: false }],
      file: null,
      embedded: false,
      uploadedAt: new Date().toISOString(),
      createdAt: new Date()
    }
    
    addDataset(testDataset)
    removeDataset('test-1')
    
    const state = useStore.getState()
    expect(state.datasets).toHaveLength(0)
  })

  it('should update current query', () => {
    const { setCurrentQuery } = useStore.getState()
    
    setCurrentQuery('SELECT * FROM users')
    
    const state = useStore.getState()
    expect(state.currentQuery).toBe('SELECT * FROM users')
  })

  it('should manage query results', () => {
    const { setQueryResult, setQueryStatus } = useStore.getState()
    
    const testResult = {
      data: [{ id: 1, name: 'Test' }],
      columns: ['id', 'name']
    }
    
    const testStatus = {
      isRunning: false,
      error: null,
      executionTime: 150
    }
    
    setQueryResult(testResult)
    setQueryStatus(testStatus)
    
    const state = useStore.getState()
    expect(state.queryResult).toEqual(testResult)
    expect(state.queryStatus).toEqual(testStatus)
  })

  it('should manage chart configuration', () => {
    const { setChartConfig } = useStore.getState()
    
    const testConfig = {
      type: 'bar' as const,
      xField: 'category',
      yField: 'value',
      colorField: 'type'
    }
    
    setChartConfig(testConfig)
    
    const state = useStore.getState()
    expect(state.chartConfig).toEqual(testConfig)
  })

  it('should switch active panel', () => {
    const { setActivePanel } = useStore.getState()
    
    setActivePanel('results')
    
    const state = useStore.getState()
    expect(state.activePanel).toBe('results')
  })

  it('should clear session', () => {
    const { addDataset, setCurrentQuery, setChartConfig, clearSession } = useStore.getState()
    
    // Add some data
    const testDataset = {
      id: 'test-1',
      name: 'Test Dataset',
      tableName: 'test_1',
      fileName: 'test.csv',
      fileSize: 1024,
      size: 1024,
      rowCount: 100,
      columns: [{ name: 'id', type: 'INTEGER', nullable: false }],
      file: null,
      embedded: false,
      uploadedAt: new Date().toISOString(),
      createdAt: new Date()
    }
    
    addDataset(testDataset)
    setCurrentQuery('SELECT * FROM test')
    setChartConfig({ type: 'bar', xField: 'x', yField: 'y' })
    
    // Clear session
    clearSession()
    
    const state = useStore.getState()
    expect(state.datasets).toEqual([])
    expect(state.currentQuery).toBe('')
    expect(state.chartConfig).toBe(null)
    expect(state.queries).toEqual([])
    expect(state.charts).toEqual([])
  })

  it('should manage queries', () => {
    const { addQuery, updateQuery, removeQuery } = useStore.getState()
    
    const testQuery = {
      id: 'query-1',
      sql: 'SELECT * FROM users',
      name: 'User Query',
      datasetId: 'dataset-1',
      createdAt: new Date()
    }
    
    addQuery(testQuery)
    
    let state = useStore.getState()
    expect(state.queries).toHaveLength(1)
    expect(state.queries[0]).toEqual(testQuery)
    
    updateQuery('query-1', 'SELECT * FROM users WHERE active = true')
    
    state = useStore.getState()
    expect(state.queries[0].sql).toBe('SELECT * FROM users WHERE active = true')
    
    removeQuery('query-1')
    
    state = useStore.getState()
    expect(state.queries).toHaveLength(0)
  })

  it('should manage charts', () => {
    const { addChart, removeChart } = useStore.getState()
    
    const testChart = {
      id: 'chart-1',
      name: 'Test Chart',
      queryId: 'query-1',
      type: 'bar' as const,
      vegaLite: { mark: 'bar', encoding: {} },
      width: 800,
      height: 600,
      createdAt: new Date()
    }
    
    addChart(testChart)
    
    let state = useStore.getState()
    expect(state.charts).toHaveLength(1)
    expect(state.charts[0]).toEqual(testChart)
    
    removeChart('chart-1')
    
    state = useStore.getState()
    expect(state.charts).toHaveLength(0)
  })
})