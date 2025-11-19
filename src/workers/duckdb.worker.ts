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
  copyQueryToParquet(sql: string, fileName?: string): Promise<Uint8Array>
  getDiagnostics(): Promise<{
    crossOriginIsolated: boolean
    threads: boolean
    module: string | undefined
    simd: boolean
    version: string
    initializationTimeMs?: number
  }>
}

class DuckDBWorkerImpl implements DuckDBWorker {
  private db: duckdb.AsyncDuckDB | null = null
  private conn: duckdb.AsyncDuckDBConnection | null = null
  private currentQueryController: AbortController | null = null
  private lastBundle: { mainModule?: string; pthreadWorker?: string | undefined } | null = null
  private initializationTimeMs: number | undefined

  async initialize(): Promise<void> {
    try {
      // Idempotent: if already initialized, do nothing
      if (this.db && this.conn) {
        return
      }
      const initStart = performance.now()
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
      // Use a silent logger to avoid emitting structured log objects to console
      const logger = (duckdb as any).VoidLogger ? new (duckdb as any).VoidLogger() : new duckdb.ConsoleLogger()
      // Fallback safeguard: if ConsoleLogger is used, neutralize its log method
      if (!(duckdb as any).VoidLogger && logger && typeof (logger as any).log === 'function') {
        try { (logger as any).log = () => {} } catch (_e) { /* noop */ }
      }
      this.db = new duckdb.AsyncDuckDB(logger, worker)
      
      // Normalize null to undefined for pthreadWorker to satisfy typings
      await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker ?? undefined)
      this.conn = await this.db.connect()
      this.lastBundle = { mainModule: bundle.mainModule, pthreadWorker: bundle.pthreadWorker ?? undefined }
      this.initializationTimeMs = performance.now() - initStart
      
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
      const result = await this.conn.query(sql)
      
      
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
        return []
      }
      console.error('Query execution failed:', error)
      throw error
    } finally {
      this.currentQueryController = null
    }
  }

  async queryStream(sql: string, _batchSize?: number): Promise<{ columns: string[], data: any[][], totalRows: number }> {
    if (!this.conn) throw new Error('Database not connected')
    
    try {
      const result = await this.conn.query(sql)
      
      
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
          SELECT * FROM read_csv_auto('${fileName}', ignore_errors=true, normalize_names=true)
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
    } catch (error) {
      console.error(`Failed to create view ${viewName}:`, error)
      throw error
    }
  }

  async ping(): Promise<string> {
    return 'ok'
  }

  async getMethods(): Promise<string[]> {
    return ['initialize', 'registerFile', 'query', 'queryStream', 'cancelQuery', 'getTableInfo', 'createView', 'ping', 'copyQueryToParquet', 'getDiagnostics']
  }

  async copyQueryToParquet(sql: string, fileName: string = 'result.parquet'): Promise<Uint8Array> {
    if (!this.conn || !this.db) throw new Error('Database not connected')
    try {
      // Sanitize: DuckDB COPY subquery must not end with a semicolon
      const cleanSql = (sql ?? '').replace(/;\s*$/m, '')
      if (!cleanSql.trim()) throw new Error('No SQL provided for COPY-to-Parquet')
      // Write Parquet directly inside DuckDB WASM virtual filesystem
      const copySql = `COPY (${cleanSql}) TO '${fileName}' (FORMAT PARQUET)`
      await this.conn.query(copySql)

      // Read the generated file back as a Uint8Array for streaming to main thread
      // AsyncDuckDB exposes copy-to-buffer utility for the virtual FS
      const buffer: Uint8Array = await (this.db as any).copyFileToBuffer(fileName)
      return buffer
    } catch (error) {
      console.error('COPY-to-Parquet failed:', error)
      throw error
    }
  }

  async getDiagnostics(): Promise<{
    crossOriginIsolated: boolean
    threads: boolean
    module: string | undefined
    simd: boolean
    version: string
    initializationTimeMs?: number
  }> {
    if (!this.db) throw new Error('Database not initialized')
    try {
      const isolated = (self as any).crossOriginIsolated === true
      let threads = false
      // Prefer DB API if available; fall back to bundle info
      if (typeof (this.db as any).isThreadsEnabled === 'function') {
        threads = Boolean(await (this.db as any).isThreadsEnabled())
      } else {
        threads = Boolean(this.lastBundle?.pthreadWorker)
      }

      let simd = false
      if (typeof (this.db as any).isSimdSupported === 'function') {
        simd = Boolean(await (this.db as any).isSimdSupported())
      }

      const version = typeof (this.db as any).version === 'function' ? await (this.db as any).version() : 'unknown'
      const module = this.lastBundle?.mainModule
      return {
        crossOriginIsolated: isolated,
        threads,
        module,
        simd,
        version,
        initializationTimeMs: this.initializationTimeMs,
      }
    } catch (error) {
      console.error('Failed to get diagnostics:', error)
      throw error
    }
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
    port.start?.()
    // Expose a plain function API wrapper to avoid prototype edge cases
    const api: DuckDBWorker = {
      initialize: () => workerImpl.initialize(),
      registerFile: (name, buffer) => workerImpl.registerFile(name, buffer),
      query: (sql) => workerImpl.query(sql),
      queryStream: (sql, batchSize) => workerImpl.queryStream(sql, batchSize),
      cancelQuery: () => workerImpl.cancelQuery(),
      getTableInfo: (tableName) => workerImpl.getTableInfo(tableName),
      createView: (viewName, fileName, fileType) => workerImpl.createView(viewName, fileName, fileType),
      ping: () => workerImpl.ping(),
      getMethods: () => workerImpl.getMethods(),
      copyQueryToParquet: (sql, fileName) => workerImpl.copyQueryToParquet(sql, fileName),
      getDiagnostics: () => workerImpl.getDiagnostics(),
    }
    Comlink.expose(api, port)
    exposed = true
    // Notify main thread that Comlink is ready on the provided port
    // Using the worker global channel avoids interfering with the Comlink port.
    postMessage({ __duckdb_comlink_ready__: true })
  }
})
