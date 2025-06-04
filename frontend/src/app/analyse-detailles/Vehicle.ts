import VehiclesAPI, { type VehicleRecord as ApiVehicleRecord } from "./api-vehicles";
import { MonthlyData, MonthlyDataPoint, Vehicle, VehicleRecord, VehicleType } from "./types";

export interface ProcessedVehicleData extends Vehicle {
  monthlyData: {
    consumption: MonthlyDataPoint[];
    kilometrage: MonthlyDataPoint[];
    ipe: MonthlyDataPoint[];
    ipeTonne?: MonthlyDataPoint[];
    cost: MonthlyDataPoint[];
    tonnage?: MonthlyDataPoint[];
    emissions: MonthlyDataPoint[];
  };
}

export const VEHICLE_TYPES = [
  { id: 'all' as VehicleType, name: 'Tous', icon: 'Car' },
  { id: 'voitures' as VehicleType, name: 'Voitures', icon: 'Car' },
  { id: 'camions' as VehicleType, name: 'Camions', icon: 'Truck' },
  { id: 'chariots' as VehicleType, name: 'Chariots', icon: 'Package' }
];

export const YEAR_OPTIONS = [
  { id: '2025', name: '2025' },
  { id: '2024', name: '2024' },
  { id: '2023', name: '2023' },
  { id: '2022', name: '2022' },
  { id: 'all', name: 'Tous' }
];

export const hasVehicleTonnageData = (vehicleType?: string): boolean => {
  if (!vehicleType) return true;
  const normalizedType = normalizeVehicleType(vehicleType);
  return normalizedType === 'camions';
};

export const hasVehicleKilometrageData = (vehicleType?: string): boolean => {
  if (!vehicleType) return true;
  const normalizedType = vehicleType.toLowerCase();
  return normalizedType !== 'chariots';
};

export const getVehicleTypeName = (type: string): string => {
  const vehicleType = VEHICLE_TYPES.find(vt => vt.id === type);
  return vehicleType?.name || type;
};

export const formatVehicleValue = (value: number | undefined, metric: string): string => {
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
      return `${value.toFixed(0)} TND`;
    case 'ipe':
      return `${value.toFixed(1)} L/100km`;
    case 'ipeTonne':
      return `${value.toFixed(4)} L/100km·T`;
    case 'emissions':
      return `${value.toFixed(1)} kg`;
    default:
      return value.toFixed(1);
  }
};

export function normalizeVehicleType(type: string): VehicleType {
  if (!type || type === 'all') return 'all';
  
  const normalized = type.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  switch (normalized) {
    case 'camion':
    case 'camions':
      return 'camions';
    case 'voiture':
    case 'voitures':
      return 'voitures';
    case 'chariot':
    case 'chariots':
      return 'chariots';
    default:
      return 'all';
  }
}

function transformVehicleRecord(records: VehicleRecord[]): Vehicle {
  if (!records.length) {
    throw new Error('No records provided for transformation');
  }

  console.log('Transforming records:', records);

  const firstRecord = records[0];
  const monthlyData: MonthlyData = {
    consumption: [],
    kilometrage: [],
    ipe: [],
    cost: [],
    emissions: [],
    ipeTonne: firstRecord.type === 'camions' ? [] : undefined,
    tonnage: firstRecord.type === 'camions' ? [] : undefined,
  };

  let totalConsumption = 0;
  let totalKilometrage = 0;
  let totalIPE = 0;
  let totalCost = 0;
  let totalTonnage = 0;
  let totalIPETonne = 0;
  let validIPECount = 0;
  let validIPETonneCount = 0;

  // Sort records by month to ensure consistent order
  const sortedRecords = [...records].sort((a, b) => {
    const monthOrder = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return monthOrder.indexOf(a.mois) - monthOrder.indexOf(b.mois);
  });

  // Initialize monthly data arrays with all months
  const allMonths = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  
  allMonths.forEach(month => {
    monthlyData.consumption.push({ month, value: 0 });
    monthlyData.kilometrage.push({ month, value: 0 });
    monthlyData.ipe.push({ month, value: 0 });
    monthlyData.cost.push({ month, value: 0 });
    monthlyData.emissions.push({ month, value: 0 });
    if (firstRecord.type === 'camions') {
      monthlyData.ipeTonne?.push({ month, value: 0 });
      monthlyData.tonnage?.push({ month, value: 0 });
    }
  });

  // Update values for months that have data
  sortedRecords.forEach(record => {
    const monthIndex = allMonths.indexOf(record.mois);
    if (monthIndex === -1) return;
    
    // Accumulate totals
    totalConsumption += record.consommationL || 0;
    totalKilometrage += record.kilometrage || 0;
    totalCost += record.coutDT || 0;
    
    if (record.ipeL100km) {
      totalIPE += record.ipeL100km;
      validIPECount++;
    }

    if (record.type === 'camions' && record.ipeL100TonneKm && record.produitsTonnes) {
      totalIPETonne += record.ipeL100TonneKm;
      totalTonnage += record.produitsTonnes;
      validIPETonneCount++;
    }

    // Update monthly data points
    monthlyData.consumption[monthIndex].value = record.consommationL || 0;
    monthlyData.kilometrage[monthIndex].value = record.kilometrage || 0;
    monthlyData.ipe[monthIndex].value = record.ipeL100km || 0;
    monthlyData.cost[monthIndex].value = record.coutDT || 0;
    monthlyData.emissions[monthIndex].value = (record.consommationTEP || 0) * 3.1;

    if (record.type === 'camions') {
      if (monthlyData.ipeTonne && monthlyData.tonnage) {
        monthlyData.ipeTonne[monthIndex].value = record.ipeL100TonneKm || 0;
        monthlyData.tonnage[monthIndex].value = record.produitsTonnes || 0;
      }
    }
  });

  const vehicle: Vehicle = {
    matricule: firstRecord.matricule,
    type: normalizeVehicleType(firstRecord.type) as VehicleType,
    region: firstRecord.rawValues?.region as string | undefined,
    totalConsumption,
    totalKilometrage,
    avgIPE: validIPECount > 0 ? totalIPE / validIPECount : 0,
    totalCost,
    totalTonnage: firstRecord.type === 'camions' ? totalTonnage : undefined,
    avgIPETonne: firstRecord.type === 'camions' && validIPETonneCount > 0 
      ? totalIPETonne / validIPETonneCount 
      : undefined,
    totalEmissions: totalConsumption * 3.1, // Approximate CO2 emissions
    monthlyData
  };

  console.log('Transformed vehicle:', vehicle);
  return vehicle;
}

function convertApiRecord(record: ApiVehicleRecord): VehicleRecord {
  console.log('Converting API record:', record);
  return {
    ...record,
    type: normalizeVehicleType(record.type) as VehicleType
  };
}

export async function getAvailableMatricules(type: string, year: string): Promise<Vehicle[]> {
  try {
    console.log('Getting available matricules:', { type, year });
    const apiRecords = await VehiclesAPI.getVehiclesByType(
      normalizeVehicleType(type),
      year !== 'all' ? year : undefined
    );
    
    console.log('API records received:', apiRecords.length);
    const records = apiRecords.map(convertApiRecord);
    
    // Group records by matricule
    const recordsByMatricule = records.reduce((acc, record) => {
      if (!acc[record.matricule]) {
        acc[record.matricule] = [];
      }
      acc[record.matricule].push(record);
      return acc;
    }, {} as Record<string, VehicleRecord[]>);

    // Transform each group into a Vehicle object
    const vehicles = Object.values(recordsByMatricule).map(transformVehicleRecord);
    console.log('Transformed vehicles:', vehicles.length);
    return vehicles;
  } catch (error) {
    console.error('Error fetching available matricules:', error);
    throw error;
  }
}

export async function getVehicleData(matricule: string, year: string): Promise<Vehicle | null> {
  try {
    const apiRecords = await VehiclesAPI.getVehiclesByMatricule(
      matricule,
      year !== 'all' ? year : undefined
    );
    
    if (apiRecords.length === 0) return null;
    
    const records = apiRecords.map(convertApiRecord);
    return transformVehicleRecord(records);
  } catch (error) {
    console.error('Error fetching vehicle data:', error);
    throw error;
  }
}

export async function getVehiclesByTypeAndMatricule(
  type: VehicleType,
  matricule: string,
  year?: string
): Promise<Vehicle | null> {
  try {
    const apiRecords = await VehiclesAPI.getVehiclesByTypeAndMatricule(type, matricule, year);
    if (apiRecords.length === 0) return null;
    
    const records = apiRecords.map(convertApiRecord);
    return transformVehicleRecord(records);
  } catch (error) {
    console.error('Error fetching vehicle data by type and matricule:', error);
    throw error;
  }
}

export function processVehicleData(vehicle: Vehicle): ProcessedVehicleData {
  if (!vehicle) {
    throw new Error('No vehicle data provided for processing');
  }

  // If the vehicle already has monthlyData in the new format, return as is
  if ('monthlyData' in vehicle && vehicle.monthlyData) {
    return vehicle as ProcessedVehicleData;
  }

  // Create new processed vehicle data
  const processed: ProcessedVehicleData = {
    ...vehicle,
    monthlyData: {
      consumption: [],
      kilometrage: [],
      ipe: [],
      cost: [],
      emissions: [],
      ipeTonne: vehicle.type === 'camions' ? [] : undefined,
      tonnage: vehicle.type === 'camions' ? [] : undefined,
    }
  };

  return processed;
}
