export interface MonthlyDataPoint {
  month: string;
  value: number;
}

export interface MonthlyData {
  consumption: MonthlyDataPoint[];
  kilometrage: MonthlyDataPoint[];
  ipe: MonthlyDataPoint[];
  ipeTonne?: MonthlyDataPoint[];
  cost: MonthlyDataPoint[];
  tonnage?: MonthlyDataPoint[];
  emissions: MonthlyDataPoint[];
}

export interface Vehicle {
  monthlyData: MonthlyData;
  matricule: string;
  type: VehicleType;
  region?: string;
  totalConsumption: number;
  totalKilometrage: number;
  avgIPE: number;
  totalCost: number;
  totalTonnage?: number;
  avgIPETonne?: number;
  totalEmissions: number;
}

export type VehicleType = 'camions' | 'voitures' | 'chariots' | 'all';

export interface VehicleTypeOption {
  id: VehicleType;
  name: string;
  icon: string;
}

export interface VehicleRecord {
  id?: string;
  type: VehicleType;
  mois: string;
  matricule: string;
  consommationL: number;
  consommationTEP: number;
  coutDT: number;
  kilometrage: number;
  produitsTonnes?: number;
  ipeL100km: number;
  ipeL100TonneKm?: number;
  rawValues?: Record<string, any>;
}

export interface MetricDefinition {
  id: string;
  title: string;
  tabTitle: string;
  unit: string;
  description: string;
  icon: string;
  vehicleTypes: VehicleType[];
}

export const METRICS: Record<string, MetricDefinition> = {
  ipe: {
    id: 'ipe',
    title: 'Indice de Performance Énergétique',
    tabTitle: 'IPE',
    unit: 'L/100km',
    description: 'Mesure la consommation de carburant par distance parcourue',
    icon: 'fuel',
    vehicleTypes: ['all', 'camions', 'voitures', 'chariots']
  },
  ipeTonne: {
    id: 'ipeTonne',
    title: 'IPE par Tonne',
    tabTitle: 'IPE/Tonne',
    unit: 'L/100km·T',
    description: 'IPE ajusté selon le tonnage (uniquement pour les camions)',
    icon: 'truck',
    vehicleTypes: ['camions']
  },
  consumption: {
    id: 'consumption',
    title: 'Consommation de Carburant',
    tabTitle: 'Consommation',
    unit: 'L',
    description: 'Volume total de carburant consommé',
    icon: 'droplet',
    vehicleTypes: ['all', 'camions', 'voitures', 'chariots']
  },
  kilometrage: {
    id: 'kilometrage',
    title: 'Kilométrage',
    tabTitle: 'Kilométrage',
    unit: 'km',
    description: 'Distance totale parcourue',
    icon: 'map-pin',
    vehicleTypes: ['all', 'camions', 'voitures', 'chariots']
  },
  tonnage: {
    id: 'tonnage',
    title: 'Tonnage',
    tabTitle: 'Tonnage',
    unit: 'T',
    description: 'Poids total transporté',
    icon: 'package',
    vehicleTypes: ['camions']
  },
  emissions: {
    id: 'emissions',
    title: 'Émissions CO₂',
    tabTitle: 'CO₂',
    unit: 'kg',
    description: 'Émissions totales de CO₂',
    icon: 'cloud',
    vehicleTypes: ['all', 'camions', 'voitures', 'chariots']
  },
  cost: {
    id: 'cost',
    title: 'Coût',
    tabTitle: 'Coût',
    unit: 'TND',
    description: 'Coût total du carburant',
    icon: 'dollar-sign',
    vehicleTypes: ['all', 'camions', 'voitures', 'chariots']
  }
};

export interface FilterState {
  vehicleType: VehicleType;
  selectedMatricules: string[];
  year: string;
  dateRange?: DateRange;
  region: string;
}

export interface RegionOption {
  id: string;
  name: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }>;
}

export interface ApiError {
  message: string;
  code?: string;
  retry?: () => void;
}
