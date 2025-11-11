import React, { useEffect } from 'react'
import { useDuckDB } from '../providers/DuckDBProvider'

interface DiagnosticsModalProps {
  open: boolean
  onClose: () => void
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({ open, onClose }) => {
  const { diagnostics, refreshDiagnostics } = useDuckDB()

  if (!open) return null

  // Helpers
  const fmtBoolChip = (val: boolean | undefined) => {
    const v = Boolean(val)
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '2px 8px', borderRadius: 999,
        backgroundColor: v ? '#e6f4ea' : '#f1f3f5',
        color: v ? '#137333' : '#495057',
        fontSize: 12, fontWeight: 600,
      }}>
        {v ? '✓' : '✗'} {v ? 'true' : 'false'}
      </span>
    )
  }

  const fmtModule = (url?: string) => {
    const text = url ?? 'unknown'
    const max = 64
    const short = text.length > max ? `${text.slice(0, 28)}…${text.slice(-28)}` : text
    return (
      <code title={text} style={{
        fontSize: 12,
        backgroundColor: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        padding: '2px 6px',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280, display: 'inline-block'
      }}>{short}</code>
    )
  }

  const fmtVersion = (v?: string) => (
    <span style={{ fontSize: 12, fontWeight: 600, color: v && v !== 'unknown' ? 'var(--text)' : '#6c757d' }}>{v ?? 'unknown'}</span>
  )

  const fmtMs = (ms?: number) => (
    <span style={{ fontSize: 12, fontWeight: 600 }}>{ms != null ? `${Math.round(ms)} ms` : '—'}</span>
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
    >
      <div
        className="panel-surface"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 520, backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>⚙️</span>
            <div style={{ fontSize: 15, fontWeight: 700 }}>DuckDB Engine Diagnostics</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ fontSize: 12 }} onClick={refreshDiagnostics}>↻ Refresh</button>
            <button className="btn" style={{ fontSize: 12 }} onClick={onClose}>Close</button>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Mirrors console logs in a clean card.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 10, columnGap: 12 }}>
          <div style={{ color: '#6c757d' }}>Cross-origin isolation</div>
          <div>{fmtBoolChip(diagnostics?.crossOriginIsolated)}</div>

          <div style={{ color: '#6c757d' }}>Threads enabled</div>
          <div>{fmtBoolChip(diagnostics?.threads)}</div>

          <div style={{ color: '#6c757d' }}>Loaded module</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {fmtModule(diagnostics?.module)}
            {diagnostics?.module && (
              <button
                className="btn"
                style={{ fontSize: 11, padding: '2px 6px' }}
                onClick={() => navigator.clipboard.writeText(diagnostics!.module!)}
                title="Copy module URL"
              >Copy</button>
            )}
          </div>

          <div style={{ color: '#6c757d' }}>SIMD supported</div>
          <div>{fmtBoolChip(diagnostics?.simd)}</div>

          <div style={{ color: '#6c757d' }}>Version</div>
          <div>{fmtVersion(diagnostics?.version)}</div>

          <div style={{ color: '#6c757d' }}>Initialization time</div>
          <div>{fmtMs(diagnostics?.initializationTimeMs)}</div>
        </div>
      </div>
    </div>
  )
}