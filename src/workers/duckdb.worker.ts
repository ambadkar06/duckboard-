import * as Comlink from 'comlink'
import * as duckdb from '@duckdb/duckdb-wasm'

export interface DuckDBWorker {
  initialize(): Promise<void>
  registerFile(name: string, buffer: ArrayBuffer): Promise<void>
  query(sql: string): Promise<any[]>
  queryStream(sql: string, batchSize?: number): Promise<{ columns: string[], data: any[][], totalRows: number }>
  cancelQuery(): Promise<void>
  getTableInfo(tableName: string): Promise<{ columns: Array<{ name: string; type: string }> }>
  createView(viewName: string, fileName: string, fileType: 'csv' | 'parquet'): Promise<void>
  ping(): Promise<string>
  getMethods(): Promise<string[]>
}

class DuckDBWorkerImpl implements DuckDBWorker {
  private db: duckdb.AsyncDuckDB | null = null
  private conn: duckdb.AsyncDuckDBConnection | null = null
  private currentQueryController: AbortController | null = null

  async initialize(): Promise<void> {
    try {
      // Idempotent: if already initialized, do nothing
      if (this.db && this.conn) {
        console.log('DuckDB already initialized')
        return
      }
      // Select bundle based on browser capabilities
      const bundle = await duckdb.selectBundle({
        mvp: {
          mainModule: new URL('@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm', import.meta.url).toString(),
          mainWorker: new URL('@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js', import.meta.url).toString(),
        },
        eh: {
          mainModule: new URL('@duckdb/duckdb-wasm/dist/duckdb-eh.wasm', import.meta.url).toString(),
          mainWorker: new URL('@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js', import.meta.url).toString(),
        },
      })

      // Create worker and instantiate database
      const worker = new Worker(bundle.mainWorker!)
      const logger = new duckdb.ConsoleLogger()
      this.db = new duckdb.AsyncDuckDB(logger, worker)
      
      await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker)
      this.conn = await this.db.connect()
      
      console.log('DuckDB initialized successfully')
    } catch (error) {
      console.error('Failed to initialize DuckDB:', error)
      throw new Error(`DuckDB initialization failed: ${error}`)
    }
  }

  async registerFile(name: string, buffer: ArrayBuffer): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    try {
      // Convert ArrayBuffer to Uint8Array for DuckDB
      const uint8Array = new Uint8Array(buffer)
      await this.db.registerFileBuffer(name, uint8Array)
      console.log(`File registered: ${name}`)
    } catch (error) {
      console.error(`Failed to register file ${name}:`, error)
      throw new Error(`File registration failed: ${error}`)
    }
  }

  async query(sql: string): Promise<any[]> {
    if (!this.conn) throw new Error('Database not connected')
    
    // Cancel any running query
    if (this.currentQueryController) {
      this.currentQueryController.abort()
    }
    
    this.currentQueryController = new AbortController()
    
    try {
      console.log('Executing query:', sql)
      const startTime = performance.now()
      
      const result = await this.conn.query(sql)
      
      const endTime = performance.now()
      console.log(`Query completed in ${endTime - startTime}ms`)
      
      // Convert Arrow result to plain objects via field names
      const rows = result.toArray().map((row: any) => {
        const obj: any = {}
        for (let i = 0; i < result.schema.fields.length; i++) {
          const field = result.schema.fields[i]
          const value = row[field.name]
          obj[field.name] = (value && typeof value?.toString === 'function') ? value.toString() : String(value)
        }
        return obj
      })
      
      return rows
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Query cancelled')
        return []
      }
      console.error('Query execution failed:', error)
      throw error
    } finally {
      this.currentQueryController = null
    }
  }

  async queryStream(sql: string): Promise<{ columns: string[], data: any[][], totalRows: number }> {
    if (!this.conn) throw new Error('Database not connected')
    
    try {
      console.log('Executing streaming query:', sql)
      const startTime = performance.now()
      
      const result = await this.conn.query(sql)
      const endTime = performance.now()
      console.log(`Query completed in ${endTime - startTime}ms`)
      
      // Get column names
      const columns = result.schema.fields.map(field => field.name)
      
      // Convert Arrow result to array format for better performance
      const rows = result.toArray()
      const totalRows = rows.length
      
      // Convert to array-of-arrays via field names
      const data = rows.map((row: any) => {
        const rowData: any[] = []
        for (let i = 0; i < result.schema.fields.length; i++) {
          const field = result.schema.fields[i]
          const value = row[field.name]
          rowData.push((value && typeof value?.toString === 'function') ? value.toString() : String(value))
        }
        return rowData
      })
      
      return { columns, data, totalRows }
    } catch (error) {
      console.error('Streaming query execution failed:', error)
      throw error
    }
  }

  async cancelQuery(): Promise<void> {
    if (this.currentQueryController) {
      this.currentQueryController.abort()
      this.currentQueryController = null
    }
  }

  async getTableInfo(tableName: string): Promise<{ columns: Array<{ name: string; type: string }> }> {
    if (!this.conn) throw new Error('Database not connected')
    
    try {
      // Use PRAGMA table_info for stable column introspection
      const result = await this.conn.query(`PRAGMA table_info('${tableName}')`)
      const rows = result.toArray() as any[]
      const columns = rows.map((row: any) => ({
        name: (row.name ?? row.column_name ?? row[result.schema.fields.find(f => f.name.toLowerCase().includes('name'))?.name || '']) || '',
        type: (row.type ?? row.data_type ?? row[result.schema.fields.find(f => f.name.toLowerCase().includes('type'))?.name || '']) || ''
      }))
      
      return { columns }
    } catch (error) {
      console.error(`Failed to get table info for ${tableName}:`, error)
      throw error
    }
  }

  async createView(viewName: string, fileName: string, fileType: 'csv' | 'parquet'): Promise<void> {
    if (!this.conn) throw new Error('Database not connected')
    
    try {
      let createViewSQL: string
      
      if (fileType === 'csv') {
        createViewSQL = `
          CREATE OR REPLACE VIEW ${viewName} AS
          SELECT * FROM read_csv_auto('${fileName}')
        `
      } else if (fileType === 'parquet') {
        createViewSQL = `
          CREATE OR REPLACE VIEW ${viewName} AS
          SELECT * FROM read_parquet('${fileName}')
        `
      } else {
        throw new Error(`Unsupported file type: ${fileType}`)
      }
      
      await this.conn.query(createViewSQL)
      console.log(`View created: ${viewName} from ${fileName}`)
    } catch (error) {
      console.error(`Failed to create view ${viewName}:`, error)
      throw error
    }
  }

  async ping(): Promise<string> {
    return 'ok'
  }

  async getMethods(): Promise<string[]> {
    return ['initialize', 'registerFile', 'query', 'queryStream', 'cancelQuery', 'getTableInfo', 'createView', 'ping']
  }
}

const workerImpl = new DuckDBWorkerImpl()

// Await a MessagePort from the main thread and expose Comlink on it.
// This avoids races and ensures the provider is in control of the handshake.
let exposed = false
self.addEventListener('message', (event: MessageEvent) => {
  const data = event.data as any
  if (data && data.__duckdb_comlink_init__ && data.port && !exposed) {
    const port: MessagePort = data.port as MessagePort
    // @ts-ignore
    port.start?.()
    // Expose a plain function API wrapper to avoid prototype edge cases
    const api: DuckDBWorker = {
      initialize: () => workerImpl.initialize(),
      registerFile: (name, buffer) => workerImpl.registerFile(name, buffer),
      query: (sql) => workerImpl.query(sql),
      queryStream: (sql, batchSize) => workerImpl.queryStream(sql),
      cancelQuery: () => workerImpl.cancelQuery(),
      getTableInfo: (tableName) => workerImpl.getTableInfo(tableName),
      createView: (viewName, fileName, fileType) => workerImpl.createView(viewName, fileName, fileType),
      ping: () => workerImpl.ping(),
      getMethods: () => workerImpl.getMethods(),
    }
    Comlink.expose(api, port)
    exposed = true
    // Notify main thread that Comlink is ready on the provided port
    // Using the worker global channel avoids interfering with the Comlink port.
    postMessage({ __duckdb_comlink_ready__: true })
  }
})
