export interface Dataset {
  id: string
  name: string
  tableName: string
  fileName: string
  fileSize: number
  size: number // Alias for fileSize for compatibility
  rowCount: number
  columns: Column[]
  file: File | null // null for embedded datasets in bundles
  embedded: boolean
  sha256?: string
  createdAt: Date
  uploadedAt: string // ISO string for upload time
}

export interface Column {
  name: string
  type: string
  nullable: boolean
}

export interface Query {
  id: string
  name: string
  sql: string
  datasetId: string
  createdAt: Date
  lastRun?: Date
  rowCount?: number
}

export interface Chart {
  id: string
  name: string
  queryId: string
  type: 'bar' | 'line' | 'table'
  vegaLite: any // Vega-Lite specification
  width: number
  height: number
  createdAt: Date
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'scatter' | 'histogram'
  xField: string
  yField?: string
  colorField?: string
}

export interface Bundle {
  version: number
  datasets: BundleDataset[]
  queries: BundleQuery[]
  charts: BundleChart[]
  layout: {
    gridCols: number
  }
}

export interface BundleDataset {
  id: string
  name: string
  embedded: boolean
  sha256?: string
  data?: ArrayBuffer // For embedded datasets
}

export interface BundleQuery {
  id: string
  name: string
  sql: string
  datasetId: string
}

export interface BundleChart {
  id: string
  name: string
  queryId: string
  type: 'bar' | 'line' | 'table'
  vegaLite: any
  width: number
  height: number
}

export interface QueryResult {
  columns: string[]
  data: any[][]
  rowCount: number
  queryTime: number
}

export interface WorkerResponse {
  type: 'init' | 'query' | 'registerFile' | 'error' | 'progress'
  id: string
  data?: any
  error?: string
  progress?: number
}