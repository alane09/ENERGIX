// Vehicle record interface
export interface VehicleRecord {
  id?: string
  consommationL?: number
  consommationTEP?: number
  kilometrage?: number
  produitsTonnes?: number
  date?: string
  vehicleId?: string
  vehicleType?: string
  [key: string]: any
}

// Dashboard stats interface - consolidated from multiple implementations
export interface DashboardStats {
  // Core metrics
  totalVehicles?: number
  vehicleCount?: number
  
  // Consumption metrics
  totalConsumption?: number
  totalConsommation?: number // French spelling variant for backward compatibility
  totalConsommationTEP?: number
  averageConsumption?: number
  avgConsumption?: number
  consumptionChange?: number
  
  // Additional metrics
  avgIPE?: number
  totalKilometrage?: number
  totalTonnage?: number
  co2Emissions?: number
  costSavings?: number
  
  // Raw data collections
  allVehiclesData?: VehicleRecord[]
  vehicleData?: VehicleRecord[]
  serData?: any
  
  // Data breakdowns
  vehicleTypes?: Array<{ name: string; value: number }>
  vehicleTypeBreakdown?: Array<{ name: string; value: number } | { type: string; count: number }>
  
  // Time series data
  monthlyConsumption?: Array<{ month: string; value: number }>
  monthlyData?: Array<{
    month: string;
    consommation?: number;
    consumption?: number;
    kilometrage?: number;
    distance?: number;
    ipe?: number;
    tonnage?: number;
    [key: string]: any;
  }>
}

// Dashboard filters interface
export interface DashboardFilters {
  vehicleType?: string
  year?: string
  dateFrom?: string
  dateTo?: string
  [key: string]: string | undefined
}

// SER Regression results interface
export interface RegressionResults {
  kilometrageRegression?: {
    coefficient: number
    intercept: number
    rSquared: number
  }
  tonnageRegression?: {
    coefficient: number
    intercept: number
    rSquared: number
  }
  dataPoints?: Array<{
    x: number
    y: number
    z: number
  }>
}

// Chart data point interface
export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: any
}

// Monthly data interface for charts
export interface MonthlyData {
  month: string;
  year: string;
  consommation: number;
  kilometrage: number;
  tonnage: number;
  ipe: number;
  ipeTonne: number;
}

// Vehicle type breakdown interface
export interface VehicleTypeBreakdown {
  name: string;
  value: number;
}

// Vehicle type state interface
export interface VehicleTypeState {
  types: string[];
  isLoading: boolean;
  error: string | null;
}
