import { useState, useEffect, useMemo } from 'react'
import * as vega from 'vega'
import * as vegaLite from 'vega-lite'
import { useStore } from '../store/store'

export function ChartBuilder() {
  const { queryResult, chartConfig, setChartConfig } = useStore()
  const [selectedChart, setSelectedChart] = useState<'bar' | 'line' | 'scatter' | 'histogram'>(chartConfig?.type || 'bar')
  const [xField, setXField] = useState<string>(chartConfig?.xField || '')
  const [yField, setYField] = useState<string>(chartConfig?.yField || '')
  const [colorField, setColorField] = useState<string>(chartConfig?.colorField || '')
  const [chartContainer, setChartContainer] = useState<HTMLDivElement | null>(null)

  const { data, columns } = queryResult

  // Auto-populate fields when data changes
  useEffect(() => {
    if (columns.length > 0) {
      if (!xField) {
        setXField(columns[0])
      }
      // Only auto-set yField if the second column is quantitative
      if (!yField && columns.length > 1) {
        const second = columns[1]
        const type = getFieldType(data, second)
        if (type === 'quantitative') {
          setYField(second)
        }
      }
    }
  }, [columns, xField, yField, data])

  // Save chart config to store
  useEffect(() => {
    if (xField) {
      setChartConfig({
        type: selectedChart,
        xField,
        yField: yField || undefined,
        colorField: colorField || undefined
      })
    }
  }, [selectedChart, xField, yField, colorField, setChartConfig])

  // Generate Vega-Lite specification
  const vegaLiteSpec = useMemo(() => {
    if (!data || data.length === 0 || !xField) return null

    let spec: any = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: data },
      width: 'container',
      height: 'container',
      background: 'transparent'
    }

    switch (selectedChart) {
      case 'bar': {
        spec.mark = 'bar'
        const xEnc = { field: xField, type: getFieldType(data, xField) }
        let yEnc: any
        if (yField) {
          const yType = getFieldType(data, yField)
          // For non-numeric y, default to count; for numeric y, sum values
          yEnc = yType === 'quantitative'
            ? { field: yField, type: yType, aggregate: 'sum' }
            : { aggregate: 'count' }
        } else {
          yEnc = { aggregate: 'count' }
        }
        spec.encoding = { x: xEnc, y: yEnc }
        break
      }

      case 'line':
        spec.mark = 'line'
        spec.encoding = {
          x: { field: xField, type: getFieldType(data, xField) },
          y: yField ? { field: yField, type: getFieldType(data, yField) } : { aggregate: 'count' }
        }
        break

      case 'scatter':
        spec.mark = 'point'
        spec.encoding = {
          x: { field: xField, type: getFieldType(data, xField) },
          y: yField ? { field: yField, type: getFieldType(data, yField) } : { aggregate: 'count' }
        }
        break

      case 'histogram':
        spec.mark = 'bar'
        spec.encoding = {
          x: { 
            bin: true,
            field: xField, 
            type: getFieldType(data, xField) 
          },
          y: { aggregate: 'count' }
        }
        break
    }

    // Add color encoding if specified
    if (colorField && colorField !== xField && colorField !== yField) {
      spec.encoding.color = { field: colorField, type: getFieldType(data, colorField) }
    }

    // Add tooltip
    spec.encoding.tooltip = [
      { field: xField, type: getFieldType(data, xField) }
    ]
    if (yField && getFieldType(data, yField) === 'quantitative') {
      spec.encoding.tooltip.push({ field: yField, type: 'quantitative' })
    }

    return spec
  }, [data, selectedChart, xField, yField, colorField])

  // Render chart
  useEffect(() => {
    if (!chartContainer || !vegaLiteSpec) return

    try {
      // Compile Vega-Lite to Vega
      const vegaSpec = vegaLite.compile(vegaLiteSpec).spec
      
      // Create Vega view
      const view = new vega.View(vega.parse(vegaSpec), {
        renderer: 'canvas',
        container: chartContainer,
        hover: true
      })

      view.runAsync()

      return () => {
        view.finalize()
      }
    } catch (error) {
      console.error('Error rendering chart:', error)
    }
  }, [chartContainer, vegaLiteSpec])

  if (!data || data.length === 0) {
    return (
      <div style={{
        height: '100%',
        padding: '16px',
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          color: '#6c757d',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>📊 No data available</div>
          <div style={{ fontSize: '12px' }}>Run a query to create charts</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: '100%',
      padding: '16px',
      backgroundColor: '#fff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #dee2e6',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
            Chart Type
          </label>
          <select 
            value={selectedChart} 
            onChange={(e) => setSelectedChart(e.target.value as any)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="scatter">Scatter Plot</option>
            <option value="histogram">Histogram</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              X Field
            </label>
            <select 
              value={xField} 
              onChange={(e) => setXField(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="">Select field...</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              Y Field
            </label>
            <select 
              value={yField} 
              onChange={(e) => setYField(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value="">Select field...</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
            Color Field (Optional)
          </label>
          <select 
            value={colorField} 
            onChange={(e) => setColorField(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            <option value="">None</option>
            {columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
      </div>

      <div 
        ref={setChartContainer}
        style={{
          flex: 1,
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          overflow: 'hidden'
        }}
      />
    </div>
  )
}

// Helper function to determine field type
function getFieldType(data: any[], field: string): 'quantitative' | 'ordinal' | 'nominal' | 'temporal' {
  if (!data || data.length === 0) return 'nominal'
  
  const sampleValues = data.slice(0, 10).map(row => row[field]).filter(v => v !== null && v !== undefined)
  
  // Check if all values are numeric
  const allNumeric = sampleValues.every(v => !isNaN(Number(v)) && v !== '')
  if (allNumeric) return 'quantitative'
  
  // Check if values look like dates
  const allDates = sampleValues.every(v => !isNaN(Date.parse(v)))
  if (allDates) return 'temporal'
  
  // Check if values are categorical with few unique values
  const uniqueValues = new Set(sampleValues)
  if (uniqueValues.size <= 10) return 'ordinal'
  
  return 'nominal'
}