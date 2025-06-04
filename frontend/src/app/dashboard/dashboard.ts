/**
 * Dashboard API integration for the COFICAB ENERGIX Dashboard
 */

import { API } from '@/lib/api';
import {
  DashboardData,
  MonthlyData,
  VehicleRecord,
  VehicleTypeBreakdown,
  VehicleTypeMetrics,
  matchRegion,
  normalizeRegion,
  normalizeVehicleType
} from './types/dashboard';

// Process vehicle records for dashboard display
export const processRecordsForDashboard = (records: VehicleRecord[], selectedRegion: string = 'all'): DashboardData | null => {
  if (!records || records.length === 0) return null;

  try {
    // Extract monthly data
    const monthsMap: Record<string, MonthlyData> = {};
    const vehicleTypeCount: Record<string, number> = {};
    
    // Track metrics by vehicle type
    const vehicleTypeMetrics: Record<string, VehicleTypeMetrics> = {
      'camions': {
        count: 0,
        consommation: 0,
        kilometrage: 0,
        tonnage: 0,
        cost: 0,
        ipe: 0,
        ipeTonne: 0
      },
      'voitures': {
        count: 0,
        consommation: 0,
        kilometrage: 0,
        tonnage: 0,
        cost: 0,
        ipe: 0,
        ipeTonne: 0
      },
      'chariots': {
        count: 0,
        consommation: 0,
        kilometrage: 0,
        tonnage: 0,
        cost: 0,
        ipe: 0,
        ipeTonne: 0
      }
    };
    
    let totalConsommation = 0;
    let totalKilometrage = 0;
    let totalTonnage = 0;
    let totalCost = 0;
    const totalVehicles = new Set<string>();
    
    // Process each record - fetch all data regardless of vehicle type
    records.forEach(record => {
      const month = record.mois || 'Unknown';
      const consommation = record.consommationL || 0;
      const kilometrage = record.kilometrage || 0;
      const tonnage = record.produitsTonnes || 0;
      const cost = record.coutDT || 0;
      const vehicleType = normalizeVehicleType(record.type) || 'Unknown';
      const matricule = record.matricule || 'Unknown';
      
      // Add all data for all vehicle types to ensure complete data fetching
      totalConsommation += consommation;
      totalKilometrage += kilometrage;
      totalTonnage += tonnage;
      totalCost += cost;
      totalVehicles.add(matricule);
      
      // Count vehicle types
      vehicleTypeCount[vehicleType] = (vehicleTypeCount[vehicleType] || 0) + 1;
      
      // Track metrics by vehicle type
      if (vehicleTypeMetrics[vehicleType]) {
        vehicleTypeMetrics[vehicleType].count++;
        vehicleTypeMetrics[vehicleType].consommation += consommation;
        vehicleTypeMetrics[vehicleType].kilometrage += kilometrage;
        vehicleTypeMetrics[vehicleType].tonnage += tonnage;
        vehicleTypeMetrics[vehicleType].cost += cost;
      }
      
      // Aggregate monthly data - collect all data regardless of vehicle type
      if (!monthsMap[month]) {
        monthsMap[month] = {
          month,
          consommation: 0,
          kilometrage: 0,
          ipe: 0,
          produitsTonnes: 0,
          ipeTonne: 0,
          count: 0,
          camions_consommation: 0,
          camions_kilometrage: 0,
          camions_produitsTonnes: 0,
          camions_ipe: 0,
          camions_ipeTonne: 0,
          voitures_consommation: 0,
          voitures_kilometrage: 0,
          voitures_produitsTonnes: 0,
          voitures_ipe: 0,
          voitures_ipeTonne: 0,
          chariots_consommation: 0,
          chariots_kilometrage: 0,
          chariots_produitsTonnes: 0,
          chariots_ipe: 0,
          chariots_ipeTonne: 0,
          camions_cost: 0,
          voitures_cost: 0,
          chariots_cost: 0,
          cost: 0
        } as any;
      }
      
      // Add all data for all vehicle types
      monthsMap[month].consommation += consommation;
      monthsMap[month].kilometrage += kilometrage;
      monthsMap[month].produitsTonnes = (monthsMap[month].produitsTonnes || 0) + tonnage;
      monthsMap[month].cost = (monthsMap[month].cost || 0) + cost;
      monthsMap[month].count = (monthsMap[month].count || 0) + 1;
      
      // Add data for specific vehicle type
      if (vehicleType === 'camions') {
        monthsMap[month].camions_consommation = (monthsMap[month].camions_consommation || 0) + consommation;
        monthsMap[month].camions_kilometrage = (monthsMap[month].camions_kilometrage || 0) + kilometrage;
        monthsMap[month].camions_produitsTonnes = (monthsMap[month].camions_produitsTonnes || 0) + tonnage;
        monthsMap[month].camions_cost = (monthsMap[month].camions_cost || 0) + cost;
      } else if (vehicleType === 'voitures') {
        monthsMap[month].voitures_consommation = (monthsMap[month].voitures_consommation || 0) + consommation;
        monthsMap[month].voitures_kilometrage = (monthsMap[month].voitures_kilometrage || 0) + kilometrage;
        monthsMap[month].voitures_produitsTonnes = (monthsMap[month].voitures_produitsTonnes || 0) + tonnage;
        monthsMap[month].voitures_cost = (monthsMap[month].voitures_cost || 0) + cost;
      } else if (vehicleType === 'chariots') {
        monthsMap[month].chariots_consommation = (monthsMap[month].chariots_consommation || 0) + consommation;
        monthsMap[month].chariots_kilometrage = (monthsMap[month].chariots_kilometrage || 0) + kilometrage;
        monthsMap[month].chariots_produitsTonnes = (monthsMap[month].chariots_produitsTonnes || 0) + tonnage;
        monthsMap[month].chariots_cost = (monthsMap[month].chariots_cost || 0) + cost;
      }
    });
    
    // Calculate averages and finalize monthly data
    const monthlyData = Object.values(monthsMap).map(data => {
      // Calculate overall IPE and IPE/Tonne
      data.ipe = data.kilometrage > 0 ? (data.consommation / data.kilometrage) * 100 : 0;
      data.ipeTonne = data.produitsTonnes && data.produitsTonnes > 0 && data.kilometrage > 0 
        ? (data.consommation / (data.produitsTonnes * data.kilometrage / 100)) 
        : 0;
      
      // Calculate IPE for each vehicle type
      const camKm = data.camions_kilometrage || 0;
      const camCons = data.camions_consommation || 0;
      data.camions_ipe = camKm > 0 ? (camCons / camKm) * 100 : 0;
      
      const voitKm = data.voitures_kilometrage || 0;
      const voitCons = data.voitures_consommation || 0;
      data.voitures_ipe = voitKm > 0 ? (voitCons / voitKm) * 100 : 0;
      
      const charKm = data.chariots_kilometrage || 0;
      const charCons = data.chariots_consommation || 0;
      data.chariots_ipe = charKm > 0 ? (charCons / charKm) * 100 : 0;
      
      // Calculate IPE/Tonne for each vehicle type
      const camTon = data.camions_produitsTonnes || 0;
      data.camions_ipeTonne = camTon > 0 && camKm > 0 
        ? (camCons / (camTon * camKm / 100)) 
        : 0;
      
      const voitTon = data.voitures_produitsTonnes || 0;
      data.voitures_ipeTonne = voitTon > 0 && voitKm > 0 
        ? (voitCons / (voitTon * voitKm / 100)) 
        : 0;
      
      const charTon = data.chariots_produitsTonnes || 0;
      data.chariots_ipeTonne = charTon > 0 && charKm > 0 
        ? (charCons / (charTon * charKm / 100)) 
        : 0;
      
      // Add specific data keys for charts
      data.camions_consumption = camCons;
      data.voitures_consumption = voitCons;
      data.chariots_consumption = charCons;
      
      data.camions_kilometrage = camKm;
      data.voitures_kilometrage = voitKm;
      data.chariots_kilometrage = charKm;
      
      data.camions_tonnage = camTon;
      data.voitures_tonnage = voitTon;
      data.chariots_tonnage = charTon;
      
      // Add cost data for charts
      data.camions_cost = data.camions_cost || 0;
      data.voitures_cost = data.voitures_cost || 0;
      data.chariots_cost = data.chariots_cost || 0;
      
      return data;
    });
    
    // Sort months chronologically
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    monthlyData.sort((a, b) => {
      const [monthA, yearA] = a.month.split('/');
      const [monthB, yearB] = b.month.split('/');
      
      if (yearA !== yearB) {
        return parseInt(yearA) - parseInt(yearB);
      }
      
      return months.indexOf(monthA) - months.indexOf(monthB);
    });
    
    // Calculate average IPE and IPE/Tonne
    const avgIPE = totalKilometrage > 0 ? (totalConsommation / totalKilometrage) * 100 : 0;
    const avgIPETonne = totalTonnage > 0 && totalKilometrage > 0 
      ? (totalConsommation / (totalTonnage * totalKilometrage / 100)) 
      : 0;
    
    // Format vehicle type breakdown
    const vehicleTypeBreakdown: VehicleTypeBreakdown[] = Object.entries(vehicleTypeCount).map(([name, value]) => ({
      name,
      value
    }));
    
    // Calculate IPE and IPE/Tonne for each vehicle type
    Object.keys(vehicleTypeMetrics).forEach(type => {
      const metrics = vehicleTypeMetrics[type];
      if (metrics.kilometrage > 0) {
        metrics.ipe = (metrics.consommation / metrics.kilometrage) * 100;
      }
      if (metrics.kilometrage > 0 && metrics.tonnage > 0) {
        metrics.ipeTonne = metrics.consommation / (metrics.tonnage * metrics.kilometrage / 100);
      }
    });
    
    return {
      totalVehicles: totalVehicles.size,
      totalConsommation,
      totalKilometrage,
      totalTonnage,
      totalCost,
      avgIPE,
      avgIPETonne,
      monthlyData,
      vehicleTypeBreakdown,
      vehicleTypeMetrics
    };
  } catch (error) {
    console.error("Error processing records:", error);
    return null;
  }
};

// Fetch dashboard data with filtering
export const fetchDashboardData = async (
  vehicleType: string = 'all',
  year: string = 'all',
  region: string = 'all'
): Promise<DashboardData | null> => {
  try {
    // Build API params
    const params: Record<string, string> = {};
    if (year !== 'all') {
      params.year = year;
    }
    // Note: We'll handle vehicle type filtering client-side to ensure consistent handling
    // Note: We handle region filtering client-side for now
    // If the backend supports region filtering, uncomment this:
    // if (region !== 'all') {
    //   params.region = normalizeRegion(region);
    // }
    
    // Fetch records from API
    const records = await API.Vehicle.getRecords(params);
    if (!records || records.length === 0) {
      return null;
    }
    
    // Apply client-side filtering for vehicle type and region
    let filteredRecords = records;
    
    // Filter by vehicle type if specified
    if (vehicleType !== 'all') {
      const normalizedType = normalizeVehicleType(vehicleType);
      console.log(`Filtering by vehicle type: ${vehicleType} (normalized: ${normalizedType})`);
      
      filteredRecords = filteredRecords.filter(record => {
        const recordType = normalizeVehicleType(record.type);
        console.log(`Record type: ${record.type} (normalized: ${recordType})`);
        return recordType === normalizedType;
      });
      
      console.log(`After vehicle type filtering: ${filteredRecords.length} records`);
      
      // If no records match the vehicle type filter, return null
      if (filteredRecords.length === 0) {
        console.log(`No records found for vehicle type: ${vehicleType}`);
        return null;
      }
    }
    
    // Filter by region if specified
    if (region !== 'all') {
      const normalizedRegion = normalizeRegion(region);
      filteredRecords = filteredRecords.filter(record => {
        // If record has region field, use it for filtering
        // Using type assertion here since we updated the VehicleRecord interface
        const recordRegion = (record as any).region;
        if (recordRegion) {
          return matchRegion(recordRegion) === normalizedRegion;
        }
        // If no region field, assume it belongs to the default region (Tunis)
        return normalizedRegion === 'tunis';
      });
      
      // If no records match the region filter, return null
      if (filteredRecords.length === 0) {
        console.log(`No records found for region: ${region}`);
        return null;
      }
    }
    
    // Process records for dashboard with region filtering
    return processRecordsForDashboard(filteredRecords, region);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return null;
  }
};

// Get dashboard data for a specific vehicle type
export const getVehicleTypeData = async (
  vehicleType: string,
  year: string = 'all',
  region: string = 'all'
): Promise<DashboardData | null> => {
  return fetchDashboardData(vehicleType, year, region);
};

// Get dashboard data for all vehicle types
export const getAllVehicleTypesData = async (
  year: string = 'all',
  region: string = 'all'
): Promise<DashboardData | null> => {
  return fetchDashboardData('all', year, region);
};
