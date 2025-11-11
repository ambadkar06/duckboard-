// src/providers/DuckDBProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as Comlink from 'comlink'
import type { DuckDBWorker } from '../workers/duckdb.worker'

interface DuckDBDiagnostics {
  crossOriginIsolated: boolean
  threads: boolean
  module: string | undefined
  simd: boolean
  version: string
  initializationTimeMs?: number
}

interface DuckDBContextType {
  worker: DuckDBWorker | null
  isInitialized: boolean
  diagnostics: DuckDBDiagnostics | null
  refreshDiagnostics: () => Promise<void>
}

const DuckDBContext = createContext<DuckDBContextType>({
  worker: null,
  isInitialized: false,
  diagnostics: null,
  refreshDiagnostics: async () => {}
})

export const DuckDBProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [worker, setWorker] = useState<DuckDBWorker | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [diagnostics, setDiagnostics] = useState<DuckDBDiagnostics | null>(null)
  const rawWorkerRef = useRef<Worker | null>(null)
  const initAttemptRef = useRef(0)
  const remoteRef = useRef<Comlink.Remote<DuckDBWorker> | null>(null)

  // Ensure robust error marshalling: provide a throw handler that returns a function
  // so APPLY targets a callable and not a raw object.
  try {
    const throwHandler: Comlink.TransferHandler<unknown, unknown> = {
      canHandle: (_): _ is unknown => false,
      serialize: (v: unknown): [unknown, Transferable[]] => [v, []],
      deserialize: (errorValue: unknown) => {
        return function () {
          throw errorValue
        }
      },
    }
    const handlers = (Comlink as any).transferHandlers as Map<any, any>
    if (handlers && !handlers.get('throw')) {
      handlers.set('throw', throwHandler as any)
    }
  } catch (e) {
    console.warn('Unable to set Comlink throw transfer handler:', e)
  }

  useEffect(() => {
    let isMounted = true
    let currentWorker: Worker | null = null

    // Helper function to create and wrap a worker properly
    async function createWorkerAPI(): Promise<Comlink.Remote<DuckDBWorker>> {
      
      
      // Step 1: Create the web worker
      const dbWorker = new Worker(
        new URL('../workers/duckdb.worker.ts', import.meta.url),
        { type: 'module' }
      )
      currentWorker = dbWorker
      rawWorkerRef.current = dbWorker

      // Add error listener
      dbWorker.addEventListener('error', (event) => {
        console.error('Worker error event:', event)
      })

      dbWorker.addEventListener('messageerror', (event) => {
        console.error('Worker message error event:', event)
      })

      // Step 2: Create MessageChannel and send the worker port
      const channel = new MessageChannel()
      const portMain = channel.port1
      const portWorker = channel.port2
      portMain.start?.()
      portWorker.start?.()
      dbWorker.postMessage({ __duckdb_comlink_init__: true, port: portWorker }, [portWorker])

      // Step 3: Wait for worker readiness acknowledgement
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error('Worker handshake timeout - did not receive ready ack')
          reject(new Error('Worker handshake timeout'))
        }, 5000)

        const onMessage = (event: MessageEvent) => {
          const data = event.data as any
          if (data && data.__duckdb_comlink_ready__ === true) {
            clearTimeout(timeout)
            dbWorker.removeEventListener('message', onMessage)
            resolve()
          }
        }
        dbWorker.addEventListener('message', onMessage)
      })

      // Step 4: Wrap the main-side port with Comlink
      const remote = Comlink.wrap<DuckDBWorker>(portMain)
      remoteRef.current = remote
      return remote
    }

    async function initDuckDB() {
      try {
        initAttemptRef.current += 1

        // Create and wrap the worker
        const remote = await createWorkerAPI()

        // Initialize DuckDB
        await remote.initialize()

        // Verify Comlink channel health
        const pong = await remote.ping()
        
        if (pong !== 'ok') {
          throw new Error(`DuckDB worker ping failed: ${pong}`)
        }

        const methods = await remote.getMethods()

        // Check if all required methods are available
        const requiredMethods = ['initialize', 'registerFile', 'query', 'ping']
        const missingMethods = requiredMethods.filter(m => !methods.includes(m))
        
        if (missingMethods.length > 0) {
          throw new Error(`DuckDB worker missing methods: ${missingMethods.join(', ')}`)
        }

        // Success path
        if (isMounted) {
        const localApi: DuckDBWorker = {
          initialize: () => remote.initialize(),
          registerFile: (name, buffer) => remote.registerFile(name, buffer),
          query: (sql) => remote.query(sql),
          queryStream: (sql) => remote.queryStream(sql),
          cancelQuery: () => remote.cancelQuery(),
          getTableInfo: (tableName) => remote.getTableInfo(tableName),
          createView: (viewName, fileName, fileType) => remote.createView(viewName, fileName, fileType),
          ping: () => remote.ping(),
          getMethods: () => remote.getMethods(),
          copyQueryToParquet: (sql, fileName?) => remote.copyQueryToParquet(sql, fileName),
          getDiagnostics: () => remote.getDiagnostics(),
        }
          setWorker(localApi)
          setIsInitialized(true)

          // Capture diagnostics
          try {
            const info = await remote.getDiagnostics()
            setDiagnostics(info as DuckDBDiagnostics)
          } catch (e) {
            console.warn('Unable to fetch diagnostics:', e)
          }
        }
      } catch (err) {
        console.error('❌ Failed to initialize DuckDB worker:', err)
        
        // Cleanup on error
        if (currentWorker) {
          try {
            currentWorker.terminate()
          } catch (e) {
            console.error('Error terminating worker:', e)
          }
        }
        rawWorkerRef.current = null
        
        // Optionally retry once after a delay
        if (initAttemptRef.current === 1) {
          setTimeout(() => {
            if (isMounted) {
              initDuckDB()
            }
          }, 1000)
        }
      }
    }

    initDuckDB()

    return () => {
      isMounted = false
      // In development, React.StrictMode replays effects; avoid terminating the worker
      // during this replay to prevent duplicate endpoints and Comlink finalize races.
      if (!import.meta.env.PROD) {
        return
      }
      // Terminate raw worker on actual unmount in production
      if (rawWorkerRef.current) {
        try {
          rawWorkerRef.current.terminate()
        } catch (e) {
          console.error('Error terminating worker on cleanup:', e)
        }
      }
      rawWorkerRef.current = null
    }
  }, [])

  const refreshDiagnostics = async () => {
    if (!remoteRef.current) return
    try {
      const info = await remoteRef.current.getDiagnostics()
      setDiagnostics(info as DuckDBDiagnostics)
    } catch (e) {
      console.warn('Unable to refresh diagnostics:', e)
    }
  }

  const contextValue = useMemo(() => ({ worker, isInitialized, diagnostics, refreshDiagnostics }), [worker, isInitialized, diagnostics])
  return (
    <DuckDBContext.Provider value={contextValue}>
      {children}
    </DuckDBContext.Provider>
  )
}

export const useDuckDB = () => useContext(DuckDBContext)