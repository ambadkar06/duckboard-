import { z } from 'zod'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as vega from 'vega'
import * as vegaLite from 'vega-lite'

// Dataset schema
export const DatasetSchema = z.object({
  id: z.string(),
  name: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  uploadedAt: z.string(),
  tableName: z.string(),
  columnCount: z.number()
})

// Query result schema
export const QueryResultSchema = z.object({
  data: z.array(z.record(z.any())),
  columns: z.array(z.string())
})

// Query status schema
export const QueryStatusSchema = z.object({
  isRunning: z.boolean(),
  error: z.string().optional(),
  executionTime: z.number().optional()
})

// Chart configuration schema
export const ChartConfigSchema = z.object({
  type: z.enum(['bar', 'line', 'scatter', 'histogram']),
  xField: z.string(),
  yField: z.string().optional(),
  colorField: z.string().optional()
})

// Bundle schema for export/import
export const DuckboardBundleSchema = z.object({
  version: z.literal('1.0.0'),
  createdAt: z.string(),
  metadata: z.object({
    name: z.string(),
    description: z.string().optional(),
    totalQueries: z.number().optional(),
    totalDatasets: z.number().optional()
  }),
  datasets: z.array(DatasetSchema),
  currentQuery: z.string().optional(),
  queryResult: QueryResultSchema.optional(),
  queryStatus: QueryStatusSchema.optional(),
  chartConfig: ChartConfigSchema.optional(),
  activePanel: z.enum(['sql', 'results', 'charts']).optional()
})

// Types
export type Dataset = z.infer<typeof DatasetSchema>
export type QueryResult = z.infer<typeof QueryResultSchema>
export type QueryStatus = z.infer<typeof QueryStatusSchema>
export type ChartConfig = z.infer<typeof ChartConfigSchema>
export type DuckboardBundle = z.infer<typeof DuckboardBundleSchema>

// PDF export options and checklist
export interface BundlePdfOptions {
  includeMetadata?: boolean
  includeQuery?: boolean
  includeDatasets?: boolean
  includeResults?: boolean
  includeCharts?: boolean
  maxResultRows?: number
  optimizeWideTables?: boolean
  includeCover?: boolean
  includeTOC?: boolean
  includeChartCaptions?: boolean
}

// Validation function
export function validateBundle(data: unknown): DuckboardBundle {
  return DuckboardBundleSchema.parse(data)
}

// Bundle utilities
export function createBundle(
  name: string,
  store: any,
  description?: string
): DuckboardBundle {
  return {
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    metadata: {
      name,
      description,
      totalQueries: store.queryResult.data.length > 0 ? 1 : 0,
      totalDatasets: store.datasets.length
    },
    datasets: store.datasets,
    currentQuery: store.currentQuery,
    queryResult: store.queryResult.data.length > 0 ? store.queryResult : undefined,
    queryStatus: store.queryStatus,
    chartConfig: store.chartConfig,
    activePanel: store.activePanel
  }
}

export function downloadBundle(bundle: DuckboardBundle, filename?: string) {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: 'application/json'
  })
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `${bundle.metadata.name}.duckboard`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Export bundle contents as a PDF document
export async function downloadBundlePdf(
  bundle: DuckboardBundle,
  filename?: string,
  options: BundlePdfOptions = {}
) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Duckboard Export', 40, 40)

  // Defaults
  const {
    includeMetadata = true,
    includeQuery = true,
    includeDatasets = true,
    includeResults = true,
    includeCharts = true,
    maxResultRows = 50,
    optimizeWideTables = true,
    includeCover = false,
    includeTOC = false,
    includeChartCaptions = true
  } = options

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  let y = 60

  // Optional cover section
  if (includeCover) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text(bundle.metadata.name || 'Duckboard Report', 40, y)
    y += 24
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    const dateStr = new Date(bundle.createdAt).toLocaleString()
    doc.text(`Created: ${dateStr}`, 40, y)
    y += 16
    if (bundle.metadata.description) {
      const descLines = doc.splitTextToSize(String(bundle.metadata.description), 515)
      doc.text(descLines, 40, y)
      y += descLines.length * 14
    }
    y += 10
  }

  // Checklist section summarizing selected items
  const checklist: { item: string; included: boolean }[] = [
    { item: 'Export metadata', included: includeMetadata },
    { item: 'Current SQL query', included: includeQuery && !!bundle.currentQuery },
    { item: 'Datasets table', included: includeDatasets && bundle.datasets.length > 0 },
    { item: 'Results table', included: includeResults && !!bundle.queryResult },
    { item: 'Charts section', included: includeCharts && !!bundle.chartConfig }
  ]
  doc.setFont('helvetica', 'bold')
  doc.text(includeTOC ? 'Table of Contents' : 'Checklist', 40, y)
  y += 12
  autoTable(doc, {
    startY: y,
    head: [['Item', 'Included']],
    body: checklist.map(c => [c.item, c.included ? 'Yes' : 'No']),
    styles: { fontSize: 10 },
    columnStyles: { 1: { halign: 'center' } }
  })
  y = (doc as any).lastAutoTable.finalY + 20

  // Metadata
  if (includeMetadata) {
    doc.setFont('helvetica', 'bold')
    doc.text('Export Metadata', 40, y)
    y += 12
    doc.setFont('helvetica', 'normal')
    const metaLines = [
      `Name: ${bundle.metadata.name}`,
      `Created: ${new Date(bundle.createdAt).toLocaleString()}`,
      `Datasets: ${bundle.metadata.totalDatasets ?? bundle.datasets.length}`,
      `Queries: ${bundle.metadata.totalQueries ?? (bundle.queryResult ? 1 : 0)}`
    ]
    metaLines.forEach((line) => {
      doc.text(line, 40, y)
      y += 16
    })
    y += 10
  }

  // Current Query
  if (includeQuery && bundle.currentQuery) {
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.text('Current Query', 40, y)
    y += 12
    doc.setFont('courier', 'normal')
    const queryLines = doc.splitTextToSize(bundle.currentQuery, 515)
    doc.text(queryLines, 40, y)
    y += queryLines.length * 14 + 10
  }

  // Datasets table
  if (includeDatasets && bundle.datasets && bundle.datasets.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Name', 'File', 'Size (MB)', 'Table', 'Columns']],
      body: bundle.datasets.map((d) => [
        d.name,
        d.fileName,
        (d.fileSize / (1024 * 1024)).toFixed(2),
        d.tableName,
        String(d.columnCount)
      ]),
      margin: { left: 40, right: 40 },
      styles: { fontSize: 10, overflow: 'linebreak', cellPadding: 3 },
      headStyles: { fontSize: 10 }
    })
    y = (doc as any).lastAutoTable.finalY + 20
  }

  // Results table (limit rows for readability)
  if (includeResults && bundle.queryResult && bundle.queryResult.data && bundle.queryResult.columns) {
    const columns = bundle.queryResult.columns
    const rowsAll = bundle.queryResult.data.slice(0, maxResultRows)

    // If too many columns, render in landscape and chunk columns for readability
    const groupSize = optimizeWideTables ? 6 : columns.length
    const needsLandscape = optimizeWideTables && columns.length > groupSize

    if (needsLandscape) {
      doc.addPage('a4', 'landscape')
      y = 40
    }

    for (let i = 0; i < columns.length; i += groupSize) {
      const groupCols = columns.slice(i, i + groupSize)
      const groupRows = rowsAll.map((row) => groupCols.map((c) => String((row as any)[c] ?? '')))

      // Heading per group
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text(`Results ${i + 1}–${Math.min(i + groupSize, columns.length)} of ${columns.length}`, 40, y)
      y += 14

      autoTable(doc, {
        startY: y,
        head: [groupCols],
        body: groupRows,
        margin: { left: 40, right: 40 },
        styles: { fontSize: 9, overflow: 'linebreak', cellPadding: 3, minCellWidth: 70 },
        headStyles: { fontSize: 9 }
      })
      y = (doc as any).lastAutoTable.finalY + 20
    }
  }

  // Charts section
  if (includeCharts && bundle.chartConfig) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Charts', 40, y)
    y += 14

    // Determine aggregate based on yField type (numeric → sum, otherwise count)
    const inferQuantitative = (rows: any[], field?: string) => {
      if (!field) return false
      const sample = rows.slice(0, 10)
        .map((r) => r[field as string])
        .filter((v) => v !== undefined && v !== null)
      if (sample.length === 0) return false
      return sample.every((v) => !isNaN(Number(v)) && v !== '')
    }

    const rows = bundle.queryResult?.data || []
    const chartType = bundle.chartConfig.type
    const yIsQuant = inferQuantitative(rows, bundle.chartConfig.yField)
    let aggregate: 'sum' | 'count' | undefined
    let yFieldDisplay: string

    switch (chartType) {
      case 'bar': {
        aggregate = bundle.chartConfig.yField && yIsQuant ? 'sum' : 'count'
        yFieldDisplay = bundle.chartConfig.yField && yIsQuant ? (bundle.chartConfig.yField as string) : '(count)'
        break
      }
      case 'line':
      case 'scatter': {
        if (bundle.chartConfig.yField) {
          aggregate = undefined
          yFieldDisplay = bundle.chartConfig.yField
        } else {
          aggregate = 'count'
          yFieldDisplay = '(count)'
        }
        break
      }
      case 'histogram': {
        aggregate = 'count'
        yFieldDisplay = '(count)'
        break
      }
    }

    // Brief table view with aggregate
    autoTable(doc, {
      startY: y,
      head: [['Type', 'xField', 'yField', 'Aggregate', 'colorField']],
      body: [[
        bundle.chartConfig.type,
        bundle.chartConfig.xField,
        yFieldDisplay,
        aggregate ?? '',
        bundle.chartConfig.colorField || ''
      ]],
      margin: { left: 40, right: 40 },
      styles: { fontSize: 10 }
    })
    y = (doc as any).lastAutoTable.finalY + 12

    // Derived config JSON for clarity in PDF
    doc.setFont('courier', 'normal')
    doc.setFontSize(10)
    // Determine effective chart type for PDF image (avoid line on nominal x)
    const xTypeForDerived = (() => {
      const sample = rows.slice(0, 10).map(r => r[bundle.chartConfig!.xField])
      const allNumeric = sample.filter(v => v !== null && v !== undefined).every(v => !isNaN(Number(v)))
      if (allNumeric) return 'quantitative'
      const allDates = sample.filter(v => v !== null && v !== undefined).every(v => !isNaN(Date.parse(v)))
      if (allDates) return 'temporal'
      const unique = new Set(sample)
      return unique.size <= 10 ? 'ordinal' : 'nominal'
    })()
    const derived: any = {
      type: bundle.chartConfig.type,
      xField: bundle.chartConfig.xField,
      yField: yFieldDisplay,
    }
    if (aggregate) {
      derived.aggregate = aggregate
    }
    if (bundle.chartConfig.colorField) {
      derived.colorField = bundle.chartConfig.colorField
    }
    const json = JSON.stringify(derived, null, 2)
    // Compute available width based on current page size to avoid orientation assumptions
    const pageWidth = (doc as any).internal?.pageSize?.getWidth
      ? (doc as any).internal.pageSize.getWidth()
      : (doc as any).internal?.pageSize?.width || 595
    const contentWidth = pageWidth - 80 // 40pt margins on both sides
    const pageHeight = (doc as any).internal?.pageSize?.getHeight
      ? (doc as any).internal.pageSize.getHeight()
      : (doc as any).internal?.pageSize?.height || 842
    const bottomMargin = 40
    const jsonLines = doc.splitTextToSize(json, contentWidth)
    const jsonBlockHeight = jsonLines.length * 12
    if (y + jsonBlockHeight > pageHeight - bottomMargin) {
      doc.addPage()
      y = 40
      doc.setFont('courier', 'normal')
      doc.setFontSize(10)
    }
    doc.text(jsonLines, 40, y)
    y += jsonBlockHeight

    // Render chart image using Vega-Lite and embed into PDF
    try {
      const chartData = bundle.queryResult?.data || []
      const getFieldType = (rows: any[], field: string): 'quantitative' | 'ordinal' | 'nominal' | 'temporal' => {
        if (!rows || rows.length === 0) return 'nominal'
        const sample = rows.slice(0, 10).map(r => r[field]).filter(v => v !== null && v !== undefined)
        const allNumeric = sample.length > 0 && sample.every(v => !isNaN(Number(v)) && v !== '')
        if (allNumeric) return 'quantitative'
        const allDates = sample.length > 0 && sample.every(v => !isNaN(Date.parse(v)))
        if (allDates) return 'temporal'
        const unique = new Set(sample)
        if (unique.size <= 10) return 'ordinal'
        return 'nominal'
      }

      const cfg = bundle.chartConfig
      const xType = getFieldType(chartData, cfg.xField)
      const yType = cfg.yField ? getFieldType(chartData, cfg.yField) : undefined
      const aggregateVL = yType === 'quantitative' ? 'sum' : 'count'

      const vlSpec: any = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        data: { values: chartData },
        width: 720,
        height: 360,
        background: 'white'
      }
      switch (cfg.type) {
        case 'bar':
          vlSpec.mark = 'bar'
          vlSpec.encoding = {
            x: { field: cfg.xField, type: xType },
            y: cfg.yField && yType === 'quantitative'
              ? { field: cfg.yField, type: yType, aggregate: 'sum' }
              : { aggregate: 'count' }
          }
          break
        case 'line':
          vlSpec.mark = 'line'
          vlSpec.encoding = {
            x: { field: cfg.xField, type: xType },
            y: cfg.yField
              ? { field: cfg.yField, type: yType || 'nominal' }
              : { aggregate: 'count' }
          }
          break
        case 'scatter':
          vlSpec.mark = 'point'
          vlSpec.encoding = {
            x: { field: cfg.xField, type: xType },
            y: cfg.yField
              ? { field: cfg.yField, type: yType || 'nominal' }
              : { aggregate: 'count' }
          }
          break
        case 'histogram':
          vlSpec.mark = 'bar'
          vlSpec.encoding = {
            x: { bin: true, field: cfg.xField, type: xType },
            y: { aggregate: 'count' }
          }
          break
      }

      if (cfg.colorField && cfg.colorField !== cfg.xField && cfg.colorField !== cfg.yField) {
        vlSpec.encoding.color = { field: cfg.colorField, type: getFieldType(chartData, cfg.colorField) }
      }

      const vegaSpec = vegaLite.compile(vlSpec).spec
      const view = new vega.View(vega.parse(vegaSpec), { renderer: 'canvas' })
      const canvas = await view.toCanvas()
      const dataUrl = canvas.toDataURL('image/png')

      // Fit image within content width
      const imgWidth = contentWidth
      const imgHeight = (canvas.height / canvas.width) * imgWidth
      y += 10
      // Page break before image if needed
      if (y + imgHeight > pageHeight - bottomMargin) {
        doc.addPage()
        y = 40
      }
      doc.addImage(dataUrl, 'PNG', 40, y, imgWidth, imgHeight)
      // Optional chart caption
      if (includeChartCaptions) {
        const caption = `Figure: ${cfg.type} chart of ${cfg.xField}${cfg.yField ? ` vs ${cfg.yField}` : ''}`
        const captionY = y + imgHeight + 12
        // Page-break guard for caption
        if (captionY > pageHeight - bottomMargin) {
          doc.addPage()
          y = 40
          doc.setFont('helvetica', 'italic')
          doc.setFontSize(10)
          doc.text(caption, 40, y)
          y += 12
          doc.setFont('helvetica', 'normal')
        } else {
          doc.setFont('helvetica', 'italic')
          doc.setFontSize(10)
          doc.text(caption, 40, captionY)
          doc.setFont('helvetica', 'normal')
          y = captionY + 10
        }
      } else {
        y += imgHeight + 10
      }
    } catch (e) {
      // If chart rendering fails, continue without image
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(10)
      doc.text('Chart image unavailable.', 40, y)
      y += 14
    }
  }

  const outName = filename || `${bundle.metadata.name}.pdf`
  doc.save(outName)
}

export async function loadBundle(file: File): Promise<DuckboardBundle> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsed = JSON.parse(content)
        const bundle = validateBundle(parsed)
        resolve(bundle)
      } catch (error) {
        reject(new Error(`Failed to load bundle: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}