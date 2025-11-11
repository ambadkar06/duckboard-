// src/providers/DuckDBProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as Comlink from 'comlink'
import type { DuckDBWorker } from '../workers/duckdb.worker'

interface DuckDBContextType {
  worker: DuckDBWorker | null
  isInitialized: boolean
}

const DuckDBContext = createContext<DuckDBContextType>({
  worker: null,
  isInitialized: false,
})

export const DuckDBProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [worker, setWorker] = useState<DuckDBWorker | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
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
      console.log('Creating new DuckDB worker...')
      
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
      console.log('Creating MessageChannel and sending port to worker...')
      const channel = new MessageChannel()
      const portMain = channel.port1
      const portWorker = channel.port2
      // @ts-ignore
      portMain.start?.()
      // @ts-ignore
      portWorker.start?.()
      // Debug: log all messages arriving on the Comlink MessagePort to identify APPLY targets
      portMain.addEventListener('message', (event: MessageEvent) => {
        try {
          console.log('[Comlink Port message]', event.data)
        } catch (_) {
          console.log('[Comlink Port message] (non-serializable)')
        }
      })
      dbWorker.postMessage({ __duckdb_comlink_init__: true, port: portWorker }, [portWorker])

      // Step 3: Wait for worker readiness acknowledgement
      console.log('Waiting for worker Comlink ready ack...')
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
            console.log('Worker Comlink ready acknowledged')
            resolve()
          }
        }
        dbWorker.addEventListener('message', onMessage)
      })

      // Step 4: Wrap the main-side port with Comlink
      console.log('Wrapping MessagePort with Comlink...')
      const remote = Comlink.wrap<DuckDBWorker>(portMain)
      remoteRef.current = remote
      return remote
    }

    async function initDuckDB() {
      try {
        initAttemptRef.current += 1
        console.log(`Init attempt #${initAttemptRef.current}`)

        // Create and wrap the worker
        const remote = await createWorkerAPI()
        console.log('Worker API created, calling initialize...')

        // Initialize DuckDB
        await remote.initialize()
        console.log('DuckDB initialize() completed')

        // Verify Comlink channel health
        console.log('Pinging worker...')
        const pong = await remote.ping()
        console.log('Ping response:', pong)
        
        if (pong !== 'ok') {
          throw new Error(`DuckDB worker ping failed: ${pong}`)
        }

        console.log('Getting methods...')
        const methods = await remote.getMethods()
        console.log('DuckDB worker methods available:', methods)

        // Check if all required methods are available
        const requiredMethods = ['initialize', 'registerFile', 'query', 'ping']
        const missingMethods = requiredMethods.filter(m => !methods.includes(m))
        
        if (missingMethods.length > 0) {
          throw new Error(`DuckDB worker missing methods: ${missingMethods.join(', ')}`)
        }

        // Success path
        if (isMounted) {
          console.log('✅ DuckDB worker initialized and ready')
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
          }
          setWorker(localApi)
          setIsInitialized(true)
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
          console.log('Will retry initialization in 1 second...')
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
      console.log('DuckDBProvider cleanup')
      isMounted = false
      // In development, React.StrictMode replays effects; avoid terminating the worker
      // during this replay to prevent duplicate endpoints and Comlink finalize races.
      if (!import.meta.env.PROD) {
        console.log('Dev mode: skipping worker termination during StrictMode cleanup replay')
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

  const contextValue = useMemo(() => ({ worker, isInitialized }), [worker, isInitialized])
  return (
    <DuckDBContext.Provider value={contextValue}>
      {children}
    </DuckDBContext.Provider>
  )
}

export const useDuckDB = () => useContext(DuckDBContext)