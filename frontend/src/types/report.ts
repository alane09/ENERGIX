export interface ConsumptionData {
  date: string
  consumption: number
  distance?: number
  cost?: number
  vehicleType?: string
  vehicleId?: string
}

export interface VehicleData {
  id: string
  type: string
  matricule: string
  consumption: ConsumptionData[]
  efficiency?: number
  status?: 'active' | 'maintenance' | 'inactive'
}

export interface ReportMetadata {
  id: string
  title: string
  type: ReportType
  dateGenerated: string
  dateRange: {
    start: string
    end: string
  }
  vehicleType?: string
  format: 'pdf' | 'excel' | 'word' | 'csv'
  generatedBy?: string
}

export type ReportType = 
  | 'consumption-analysis'
  | 'efficiency-report'
  | 'cost-analysis'
  | 'environmental-impact'
  | 'maintenance-prediction'
  | 'performance-comparison'

export interface ReportSection {
  title: string
  type: 'text' | 'chart' | 'table' | 'analysis'
  content: any
  style?: ReportSectionStyle
}

export interface ReportSectionStyle {
  fontSize?: number
  fontFamily?: string
  color?: string
  backgroundColor?: string
  padding?: number
  margin?: number
  borderColor?: string
  borderWidth?: number
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  sections: {
    header: {
      logo: boolean
      title: boolean
      date: boolean
      reportType: boolean
      style?: ReportSectionStyle
    }
    summary: {
      keyMetrics: boolean
      highlights: boolean
      style?: ReportSectionStyle
    }
    dataAnalysis: {
      charts: boolean
      tables: boolean
      style?: ReportSectionStyle
    }
    aiAnalysis: {
      trends: boolean
      recommendations: boolean
      predictions: boolean
      style?: ReportSectionStyle
    }
    footer: {
      pageNumber: boolean
      companyInfo: boolean
      timestamp: boolean
      style?: ReportSectionStyle
    }
  }
  styling: {
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    fontSize: number
    spacing: number
  }
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter'
  data: any
  options: any
  width?: number
  height?: number
}

export interface TableConfig {
  headers: string[]
  rows: any[]
  style?: {
    headerColor?: string
    rowColor?: string
    alternateRowColor?: string
    borderColor?: string
    fontSize?: number
  }
}

export interface ReportGenerationOptions {
  template: ReportTemplate
  data: {
    consumption?: ConsumptionData[]
    vehicles?: VehicleData[]
    metadata: ReportMetadata
  }
  styling?: {
    colors?: {
      primary?: string
      secondary?: string
      text?: string
      background?: string
    }
    fonts?: {
      family?: string
      size?: number
    }
    spacing?: {
      margin?: number
      padding?: number
    }
  }
  sections?: {
    include?: string[]
    exclude?: string[]
  }
}

export interface GeneratedReport {
  metadata: ReportMetadata
  content: ReportSection[]
  statistics: {
    pageCount: number
    chartCount: number
    tableCount: number
    generationTime: number
  }
  downloadUrl?: string
}
