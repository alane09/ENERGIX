/**
 * Dashboard data types for the COFICAB ENERGIX Dashboard
 */

// Vehicle type options
export const VEHICLE_TYPES = [
  { id: 'all', name: 'Véhicules', icon: 'Car' },
  { id: 'camions', name: 'Camions', icon: 'Truck' },
  { id: 'voitures', name: 'Voitures', icon: 'Car' },
  { id: 'chariots', name: 'Chariots', icon: 'Package' }
] as const;

export type VehicleType = typeof VEHICLE_TYPES[number]['id'];

// Region options for filtering
export const REGION_OPTIONS = [
  { id: 'all', name: 'Tous les sites', icon: 'Globe' },
  { id: 'tunis', name: 'Tunis', icon: 'Building' },
  { id: 'mjez', name: 'Mjez El Beb', icon: 'Factory' }
] as const;

export type RegionType = typeof REGION_OPTIONS[number]['id'];

// Year options for filtering
export const YEAR_OPTIONS = [
  { id: '2025', name: '2025' },
  { id: '2024', name: '2024' },
  { id: '2023', name: '2023' },
  { id: '2022', name: '2022' },
  { id: 'all', name: 'Tous' }
];

// Monthly data structure
export interface MonthlyData {
  month: string;
  consommation: number;
  kilometrage: number;
  ipe: number;
  produitsTonnes?: number;
  ipeTonne?: number;
  count?: number;
  cost?: number;
  
  // Vehicle type specific properties
  camions_consommation?: number;
  camions_kilometrage?: number;
  camions_produitsTonnes?: number;
  camions_ipe?: number;
  camions_ipeTonne?: number;
  camions_cost?: number;
  camions_consumption?: number;
  camions_tonnage?: number;
  
  voitures_consommation?: number;
  voitures_kilometrage?: number;
  voitures_produitsTonnes?: number;
  voitures_ipe?: number;
  voitures_ipeTonne?: number;
  voitures_cost?: number;
  voitures_consumption?: number;
  voitures_tonnage?: number;
  
  chariots_consommation?: number;
  chariots_kilometrage?: number;
  chariots_produitsTonnes?: number;
  chariots_ipe?: number;
  chariots_ipeTonne?: number;
  chariots_cost?: number;
  chariots_consumption?: number;
  chariots_tonnage?: number;
}

// Vehicle type breakdown for pie charts
export interface VehicleTypeBreakdown {
  name: string;
  value: number;
}

// Vehicle type metrics structure
export interface VehicleTypeMetrics {
  count: number;
  consommation: number;
  kilometrage: number;
  tonnage: number;
  cost: number;
  ipe: number;
  ipeTonne: number;
}

// Dashboard data structure
export interface DashboardData {
  totalVehicles: number;
  totalConsommation: number;
  avgIPE: number;
  totalKilometrage: number;
  totalTonnage?: number;
  totalCost?: number;
  avgIPETonne?: number;
  monthlyData: MonthlyData[];
  vehicleTypeBreakdown: VehicleTypeBreakdown[];
  vehicleTypeMetrics?: Record<string, VehicleTypeMetrics>;
}

// Chart data structure
export interface ChartData {
  title: string;
  type: 'pie' | 'bar' | 'line' | 'histogram';
  dataKey: string;
  height?: number;
  color?: string;
}

// Chart section structure
export interface ChartSection {
  id: string;
  title: string;
  icon: string;
  charts: ChartData[];
}

// Vehicle record structure
export interface VehicleRecord {
  id?: string;
  type: string;
  matricule: string;
  mois: string;
  year: string;
  region?: string;
  consommationL: number;
  consommationTEP: number;
  coutDT: number;
  kilometrage: number;
  produitsTonnes: number;
  ipeL100km: number;
  ipeL100TonneKm: number;
  rawValues?: Record<string, number>;
}

// Function to determine if a vehicle type has tonnage data
export const hasVehicleTonnageData = (vehicleType?: string): boolean => {
  if (!vehicleType) return true;
  const normalizedType = vehicleType.toLowerCase();
  // Only camions have tonnage data
  return normalizedType === 'camion';
};

// Function to determine if a vehicle type has kilometrage data
export const hasVehicleKilometrageData = (vehicleType?: string): boolean => {
  if (!vehicleType) return true;
  const normalizedType = vehicleType.toLowerCase();
  // Chariots should not display kilometrage data
  return normalizedType !== 'chariots';
};

// Function to get available metrics for a specific vehicle type
export const getVehicleMetrics = (vehicleType?: string) => {
  if (!vehicleType) return ['consumption', 'cost', 'kilometrage', 'ipe', 'tonnage', 'ipeTonne'];
  
  const normalizedType = vehicleType.toLowerCase();
  
  // For Chariots, only show consumption in the UI
  // But we still need to fetch all metrics for data integrity
  if (normalizedType === 'chariots') {
    return ['consumption'];
  }
  
  // For voitures, show all metrics except tonnage and ipeTonne
  if (normalizedType === 'voitures') {
    return ['consumption', 'cost', 'kilometrage', 'ipe'];
  }
  
  // For camions, show all metrics
  if (normalizedType === 'camions') {
    return ['consumption', 'cost', 'kilometrage', 'ipe', 'tonnage', 'ipeTonne'];
  }
  
  // Default metrics for all vehicle types
  const baseMetrics = ['consumption', 'cost'];
  const additionalMetrics = [];

  if (hasVehicleKilometrageData(vehicleType)) {
    additionalMetrics.push('kilometrage', 'ipe');
  }

  if (hasVehicleTonnageData(vehicleType)) {
    additionalMetrics.push('tonnage', 'ipeTonne');
  }

  return [...baseMetrics, ...additionalMetrics];
};

// Function to normalize vehicle type
export const normalizeVehicleType = (vehicleType?: string): string => {
  if (!vehicleType) return 'all';
  
  const normalized = vehicleType.toLowerCase().trim();
  
  // Handle singular/plural variations
  if (normalized === 'camion' || normalized === 'camions') return 'camions';
  if (normalized === 'voiture' || normalized === 'voitures') return 'voitures';
  if (normalized === 'chariot' || normalized === 'chariots') return 'chariots';
  
  return normalized === 'all' || normalized === 'tous' ? 'all' : normalized;
};

// Function to normalize region names for consistent handling
export const normalizeRegion = (region?: string): string => {
  if (!region) return 'all';
  
  const normalized = region.toLowerCase().trim();
  
  // Handle different variations of region names
  if (normalized.includes('tunis') || normalized.includes('tun')) return 'tunis';
  if (normalized.includes('mjez') || normalized.includes('mjaz') || normalized.includes('beb')) return 'mjez';
  
  return normalized === 'all' || normalized === 'tous' ? 'all' : normalized;
};

// Function to match region from database with our frontend types
export const matchRegion = (databaseRegion?: string): string => {
  if (!databaseRegion) return 'unknown';
  
  // Convert to lowercase for case-insensitive matching
  const region = databaseRegion.toLowerCase().trim();
  
  // Match database regions to our frontend types
  if (region.includes('tunis')) return 'tunis';
  if (region.includes('mjez') || region.includes('mjaz') || region.includes('beb')) return 'mjez';
  
  // For debugging
  console.log(`Unmatched region: ${databaseRegion} -> defaulting to 'unknown'`);
  
  return 'unknown';
};

// Function to format metric values with appropriate units
export const formatMetricValue = (value: number, metric: string): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'N/A';
  }
  
  switch (metric) {
    case 'consumption':
      return `${value.toFixed(1)} L`;
    case 'kilometrage':
      return `${value.toFixed(0)} km`;
    case 'tonnage':
      return `${value.toFixed(1)} T`;
    case 'cost':
      return `${value.toFixed(0)} DT`;
    case 'ipe':
      return `${value.toFixed(1)} L/100km`;
    case 'ipeTonne':
      return `${value.toFixed(4)} L/100km.T`;
    default:
      return value.toFixed(1);
  }
};
