import { useRef, useEffect, useCallback } from 'react'
import * as monaco from 'monaco-editor'
import { useStore } from '../store/store'
import { useDuckDB } from '../providers/DuckDBProvider'

export function SQLEditor() {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { currentQuery, setCurrentQuery, datasets, setQueryResult, setQueryStatus, queryStatus } = useStore()
  const { worker } = useDuckDB()

  // Execute query (used by keyboard shortcut and Run button)
  const executeQuery = useCallback(async () => {
    if (!worker) {
      alert('DuckDB is not initialized')
      return
    }

    const query = editorRef.current?.getValue() || ''
    if (!query.trim()) return

    setQueryStatus({ isRunning: true, error: null })

    try {
      const result = await worker.query(query)
      setQueryResult({ data: result, columns: result.length > 0 ? Object.keys(result[0]) : [] })
      setQueryStatus({ isRunning: false, error: null })
    } catch (error) {
      console.error('Query execution failed:', error)
      setQueryStatus({ 
        isRunning: false, 
        error: error instanceof Error ? error.message : 'Query execution failed'
      })
    }
  }, [worker, setQueryStatus, setQueryResult])

  useEffect(() => {
    if (!containerRef.current) return

    // Create Monaco editor
    const editor = monaco.editor.create(containerRef.current, {
      value: currentQuery || '-- Welcome to Duckboard!\n-- Upload CSV or Parquet files and start querying.\n\nSELECT * FROM your_table LIMIT 10;',
      language: 'sql',
      theme: 'vs',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      suggestOnTriggerCharacters: true,
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      }
    })

    editorRef.current = editor

    // Add SQL keywords and table names to suggestions
    const sqlKeywords = [
      'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP', 'BY',
      'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL', 'DISTINCT', 'AS', 'AND', 'OR',
      'NOT', 'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'TRUE', 'FALSE', 'CASE',
      'WHEN', 'THEN', 'ELSE', 'END', 'CAST', 'CONVERT', 'COUNT', 'SUM', 'AVG', 'MIN',
      'MAX', 'CREATE', 'TABLE', 'VIEW', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER'
    ]

    const tableNames = datasets.map(d => d.tableName)
    const allSuggestions = [...sqlKeywords, ...tableNames]

    // Register completion provider
    const completionProvider = monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        }

        const suggestions = allSuggestions.map(keyword => ({
          label: keyword,
          kind: sqlKeywords.includes(keyword) ? 
            monaco.languages.CompletionItemKind.Keyword : 
            monaco.languages.CompletionItemKind.Variable,
          insertText: keyword,
          detail: sqlKeywords.includes(keyword) ? 'SQL Keyword' : 'Table Name',
          range: range
        }))

        return { suggestions }
      }
    })

    // Handle editor content changes
    const contentChangeListener = editor.onDidChangeModelContent(() => {
      setCurrentQuery(editor.getValue())
    })

    // Handle keyboard shortcuts
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => {
        executeQuery()
      }
    )

    // No-op: executeQuery defined via useCallback above

    return () => {
      completionProvider.dispose()
      contentChangeListener.dispose()
      editor.dispose()
    }
  }, [containerRef, datasets, worker])

  // Update editor content when currentQuery changes from outside
  useEffect(() => {
    if (editorRef.current && currentQuery !== editorRef.current.getValue()) {
      editorRef.current.setValue(currentQuery || '')
    }
  }, [currentQuery])

  return (
    <div className="panel-surface" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="header" style={{
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ fontSize: '12px' }}>
          SQL Editor
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
            Press Cmd/Ctrl+Enter to run
          </div>
          <button
            onClick={executeQuery}
            disabled={!worker || queryStatus.isRunning}
            className="btn btn-primary"
          >
            ▶ Run
          </button>
        </div>
      </div>
      <div 
        ref={containerRef} 
        style={{
          flex: 1,
          minHeight: 0
        }}
      />
    </div>
  )
}