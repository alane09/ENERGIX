
declare module "@tremor/react" {
  interface ValueFormatter {
    x?: (value: number) => string
    y?: (value: number) => string
  }

  interface ChartProps {
    data: any[]
    index?: string
    categories?: string[]
    colors?: string[]
    valueFormatter?: ((value: number) => string) | ValueFormatter
    showLegend?: boolean
    yAxisWidth?: number
    className?: string
  }

  interface ScatterChartProps extends ChartProps {
    x: string
    y: string
    category: string
  }

  interface LineChartProps extends ChartProps {
    index: string
    categories: string[]
  }

  export const ScatterChart: React.FC<ScatterChartProps>
  export const LineChart: React.FC<LineChartProps>
}
