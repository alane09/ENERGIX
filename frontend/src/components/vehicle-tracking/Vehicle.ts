/**
 * Vehicle Tracking Service
 * Handles all data operations and transformations for the Vehicle Tracking Dashboard
 */

import { VehicleAPI } from "@/lib/api";
import { toast } from "sonner";

// Type definitions
export interface VehicleRecord {
  id?: string;
  type: string;
  matricule: string;
  mois: string;
  year: string;
  consommationL: number;
  consommationTEP: number;
  coutDT: number;
  kilometrage: number;
  produitsTonnes: number;
  ipeL100km: number;
  ipeL100TonneKm: number;
}

export interface ProcessedVehicleData {
  matricule: string;
  type: string;
  monthlyConsumption: Array<{
    month: string;
    value: number;
  }>;
  monthlyKilometrage: Array<{
    month: string;
    value: number;
  }>;
  monthlyCost: Array<{
    month: string;
    value: number;
  }>;
  monthlyTonnage: Array<{
    month: string;
    value: number;
  }>;
  monthlyIPE: Array<{
    month: string;
    value: number;
  }>;
  monthlyIPETonne: Array<{
    month: string;
    value: number;
  }>;
  totalConsumption: number;
  totalKilometrage: number;
  totalCost: number;
  totalTonnage: number;
  avgIPE: number;
  avgIPETonne: number;
}

export interface ComparisonData {
  matricules: string[];
  consumption: Array<{
    month: string;
    [key: string]: number | string;
  }>;
  kilometrage: Array<{
    month: string;
    [key: string]: number | string;
  }>;
  cost: Array<{
    month: string;
    [key: string]: number | string;
  }>;
  tonnage: Array<{
    month: string;
    [key: string]: number | string;
  }>;
  ipe: Array<{
    month: string;
    [key: string]: number | string;
  }>;
  ipeTonne: Array<{
    month: string;
    [key: string]: number | string;
  }>;
}

export interface VehicleFilterParams {
  type?: string;
  year?: string;
  matricule?: string;
  mois?: string;
}

// Month mapping for display
export const MONTH_NAMES: { [key: string]: string } = {
  '1': 'Janvier',
  '2': 'Février',
  '3': 'Mars',
  '4': 'Avril',
  '5': 'Mai',
  '6': 'Juin',
  '7': 'Juillet',
  '8': 'Août',
  '9': 'Septembre',
  '10': 'Octobre',
  '11': 'Novembre',
  '12': 'Décembre'
};


// Vehicle type options for filtering
export interface VehicleType {
  id: string;
  name: string;
  icon: string;
  noDataMessage: string;
  backendType: string;
}

export const VEHICLE_TYPES: VehicleType[] = [
  { id: "all", name: "Tous", icon: "Car", noDataMessage: "Aucune donnée disponible pour tous les véhicules", backendType: "" },
  { id: "voitures", name: "Voitures", icon: "Car", noDataMessage: "Aucune donnée disponible pour les voitures", backendType: "voiture" },
  { id: "camions", name: "Camions", icon: "Truck", noDataMessage: "Aucune donnée disponible pour les camions", backendType: "camion" },
  { id: "chariots", name: "Chariots", icon: "Package", noDataMessage: "Aucune donnée disponible pour les chariots", backendType: "chariot" }
];

// Year options for filtering
export interface YearOption {
  id: string;
  name: string;
}

export const YEAR_OPTIONS: YearOption[] = [
  { id: "all", name: "Toutes les années" },
  { id: "2023", name: "2023" },
  { id: "2024", name: "2024" },
  { id: "2025", name: "2025" }
];

export interface VehicleAggregateData {
  matricule: string;
  totalConsumption: number;
  totalKilometrage: number;
  totalProduitsTonnes: number;
  records: VehicleRecord[];
  avgIPE?: number;
  avgIPETonne?: number;
}

export class VehicleService {
  /**
   * Aggregate vehicle data by month
   * @param records Array of vehicle records
   * @returns Aggregated monthly data
   */
  static aggregateMonthlyData(records: VehicleRecord[]): Array<{
    month: string;
    consommation: number;
    kilometrage: number;
    produitsTonnes: number;
    ipe: number;
    ipeTonne: number;
    count: number;
  }> {
    const monthlyData: Record<string, {
      month: string;
      consommation: number;
      kilometrage: number;
      produitsTonnes: number;
      ipe: number;
      ipeTonne: number;
      count: number;
    }> = {};

    records.forEach((record: VehicleRecord) => {
      const month = record.mois || 'Unknown';
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          consommation: 0,
          kilometrage: 0,
          produitsTonnes: 0,
          ipe: 0,
          ipeTonne: 0,
          count: 0
        };
      }

      monthlyData[month].consommation += record.consommationL || 0;
      monthlyData[month].kilometrage += record.kilometrage || 0;
      monthlyData[month].produitsTonnes += record.produitsTonnes || 0;
      monthlyData[month].count++;
    });

    // Calculate averages and IPE
    return Object.values(monthlyData).map(month => {
      const ipe = month.kilometrage > 0 ? (month.consommation / month.kilometrage) * 100 : 0;
      const ipeTonne = month.kilometrage > 0 && month.produitsTonnes > 0
        ? (month.consommation / (month.kilometrage * month.produitsTonnes)) * 100
        : 0;

      return {
        ...month,
        ipe,
        ipeTonne
      };
    });
  }

  static aggregateByVehicle(records: VehicleRecord[]): VehicleAggregateData[] {
    const vehicleData: Record<string, VehicleAggregateData> = {};

    records.forEach((record: VehicleRecord) => {
      if (!vehicleData[record.matricule]) {
        vehicleData[record.matricule] = {
          matricule: record.matricule,
          totalConsumption: 0,
          totalKilometrage: 0,
          totalProduitsTonnes: 0,
          records: [],
          avgIPE: 0,
          avgIPETonne: 0
        };
      }

      const data = vehicleData[record.matricule];
      data.totalConsumption += record.consommationL || 0;
      data.totalKilometrage += record.kilometrage || 0;
      data.totalProduitsTonnes += record.produitsTonnes || 0;
      data.records.push(record);
    });

    return Object.values(vehicleData).map(data => {
      const avgIPE = data.totalKilometrage > 0 
        ? (data.totalConsumption / data.totalKilometrage) * 100
        : 0;

      const avgIPETonne = data.totalKilometrage > 0 && data.totalProduitsTonnes > 0
        ? (data.totalConsumption / (data.totalKilometrage * data.totalProduitsTonnes)) * 100
        : 0;

      return {
        ...data,
        avgIPE: avgIPE,
        avgIPETonne: avgIPETonne
      };
    });
  }

  static calculateRegression(data: Array<{ kilometrage: number; tonnage: number }>) {
    // Simple linear regression
    const n = data.length;
    if (n < 2) return [];

    // Calculate means
    const meanX = data.reduce((sum: number, p) => sum + p.kilometrage, 0) / n;
    const meanY = data.reduce((sum: number, p) => sum + p.tonnage, 0) / n;

    // Calculate coefficients
    const numerator = data.reduce((sum: number, p) => {
      return sum + (p.kilometrage - meanX) * (p.tonnage - meanY);
    }, 0);

    const denominator = data.reduce((sum: number, p) => {
      return sum + Math.pow(p.kilometrage - meanX, 2);
    }, 0);

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = meanY - slope * meanX;

    // Generate points for the regression line
    const minX = Math.min(...data.map(p => p.kilometrage));
    const maxX = Math.max(...data.map(p => p.kilometrage));
    const step = (maxX - minX) / 20;

    return Array.from({ length: 21 }, (_, i) => {
      const x = minX + i * step;
      return {
        kilometrage: x,
        tonnage: slope * x + intercept
      };
    });
  }

  /**
   * Fetch available vehicle matricules based on selected category
   * @param category Vehicle category
   * @returns Array of available matricules
   */
  static async getAvailableMatricules(category: string): Promise<string[]> {
    try {
      // Prepare params for the API call
      const params: VehicleFilterParams = {};
      
      // Handle category filtering - make sure we're using the right type name
      // that matches what's in the database
      if (category !== 'all') {
        // Convert plural to singular if needed to match database format
        // Some databases might store 'camion' instead of 'camions'
        params.type = category.toLowerCase();
        
        // Try both plural and singular forms for better matching
        if (category === 'camions') {
          console.log('Fetching camions/camion vehicles');
        }
      }

      // Fetch records to get available matricules
      const records = await VehicleAPI.getRecords(params);
      console.log('Fetched records:', records);
      
      if (records && Array.isArray(records)) {
        // Extract unique matricules
        const matricules = Array.from(new Set(records.map(record => record.matricule)));
        console.log('Available matricules:', matricules);
        return matricules;
      } else {
        console.log('No records found or invalid response');
        return [];
      }
    } catch (error) {
      console.error("Error fetching available matricules:", error);
      toast.error("Erreur lors de la récupération des véhicules disponibles");
      return [];
    }
  }

  /**
   * Fetch vehicle data for selected matricules
   * @param matricules Array of selected matricules
   * @param year Selected year filter
   * @param month Selected month filter
   * @returns Processed vehicle data for visualization
   */
  static async getVehicleData(
    matricules: string[], 
    year?: string, 
    month?: string
  ): Promise<{ 
    rawData: VehicleRecord[], 
    processedData: ProcessedVehicleData[],
    comparisonData: ComparisonData | null 
  }> {
    if (matricules.length === 0) {
      return { 
        rawData: [], 
        processedData: [],
        comparisonData: null 
      };
    }

    try {
      // Prepare params for the API call
      const params: VehicleFilterParams = {};
      
      // Add year filter if selected
      if (year && year !== 'all') {
        params.year = year;
      }
      
      // Add month filter if selected
      if (month && month !== 'all') {
        params.mois = month;
      }

      // Fetch data for each selected matricule
      const allData: VehicleRecord[] = [];
      
      for (const matricule of matricules) {
        // Map the frontend vehicle type to backend type
        const selectedType = VEHICLE_TYPES.find(t => t.id === params.type);
        const matriculeParams = { 
          ...params, 
          matricule,
          type: selectedType?.backendType || params.type // Use mapped backend type or original type as fallback
        };
        
        try {
          const records = await VehicleAPI.getRecords(matriculeParams);
          
          if (records && Array.isArray(records)) {
            // Filter records to ensure they match the requested type
            const matchingRecords = records.filter(record => 
              !params.type || record.type.toLowerCase() === params.type.toLowerCase()
            );
            allData.push(...matchingRecords);
          }
        } catch (error) {
          console.error(`Error fetching data for matricule ${matricule}:`, error);
          toast.error(`Erreur lors de la récupération des données pour ${matricule}`);
        }
      }
      
      // Process the data for visualization
      if (allData.length > 0) {
        const processed = this.processVehicleData(allData);
        
        // Generate comparison data if multiple matricules are selected
        const comparison = matricules.length > 1 ? 
          this.generateComparisonData(processed) : null;
        
        return {
          rawData: allData,
          processedData: processed,
          comparisonData: comparison
        };
      } else {
        return {
          rawData: [],
          processedData: [],
          comparisonData: null
        };
      }
    } catch (error) {
      console.error("Error fetching vehicle data:", error);
      toast.error("Erreur lors de la récupération des données des véhicules");
      return {
        rawData: [],
        processedData: [],
        comparisonData: null
      };
    }
  }

  /**
   * Process raw vehicle data into a format suitable for visualization
   * @param data Raw vehicle data
   * @returns Processed data for charts and metrics
   */
  static processVehicleData(data: VehicleRecord[]): ProcessedVehicleData[] {
    // Group data by matricule
    const matriculeGroups: { [key: string]: VehicleRecord[] } = {};
    
    data.forEach(record => {
      if (!matriculeGroups[record.matricule]) {
        matriculeGroups[record.matricule] = [];
      }
      matriculeGroups[record.matricule].push(record);
    });
    // Process each matricule group
    return Object.entries(matriculeGroups).map(([matricule, records]): ProcessedVehicleData => {
      // Sort records by month
      records.sort((a, b) => {
        const monthA = parseInt(a.mois);
        const monthB = parseInt(b.mois);
        return monthA - monthB;
      });

      // Extract type from the first record
      const type = records[0]?.type || "";

      // Initialize monthly data arrays
      const monthlyConsumption: Array<{ month: string; value: number }> = [];
      const monthlyKilometrage: Array<{ month: string; value: number }> = [];
      const monthlyCost: Array<{ month: string; value: number }> = [];
      const monthlyTonnage: Array<{ month: string; value: number }> = [];
      const monthlyIPE: Array<{ month: string; value: number }> = [];
      const monthlyIPETonne: Array<{ month: string; value: number }> = [];

      // Calculate totals
      let totalConsumption = 0;
      let totalKilometrage = 0;
      let totalCost = 0;
      let totalTonnage = 0;

      // Process each record
      records.forEach(record => {
        const month = MONTH_NAMES[record.mois] || record.mois;
        
        // Add monthly data
        monthlyConsumption.push({ month, value: record.consommationL });
        monthlyKilometrage.push({ month, value: record.kilometrage });
        monthlyCost.push({ month, value: record.coutDT });
        monthlyTonnage.push({ month, value: record.produitsTonnes });
        monthlyIPE.push({ month, value: record.ipeL100km });
        monthlyIPETonne.push({ month, value: record.ipeL100TonneKm });

        // Update totals
        totalConsumption += record.consommationL;
        totalKilometrage += record.kilometrage;
        totalCost += record.coutDT;
        totalTonnage += record.produitsTonnes;
      });

      // Calculate averages
      const avgIPE = totalKilometrage > 0 ? (totalConsumption / totalKilometrage) * 100 : 0;
      const avgIPETonne = (totalKilometrage > 0 && totalTonnage > 0) ? 
        (totalConsumption / (totalKilometrage * totalTonnage)) * 100 : 0;

      return {
        matricule,
        type,
        monthlyConsumption,
        monthlyKilometrage,
        monthlyCost,
        monthlyTonnage,
        monthlyIPE,
        monthlyIPETonne,
        totalConsumption,
        totalKilometrage,
        totalCost,
        totalTonnage,
        avgIPE,
        avgIPETonne
      };
    });
  }

  /**
   * Generate comparison data for multiple vehicles
   * @param data Processed vehicle data
   * @returns Formatted comparison data for charts
   */
  static generateComparisonData(data: ProcessedVehicleData[]): ComparisonData {
    const matricules = data.map(d => d.matricule);
    
    // Get all unique months across all vehicles
    const allMonths = new Set<string>();
    data.forEach(vehicle => {
      vehicle.monthlyConsumption.forEach(item => allMonths.add(item.month));
    });
    
    // Sort months
    const sortedMonths = Array.from(allMonths).sort((a, b) => {
      const monthOrder = Object.values(MONTH_NAMES);
      return monthOrder.indexOf(a) - monthOrder.indexOf(b);
    });

    // Initialize comparison data arrays
    const consumption: Array<{ month: string; [key: string]: number | string }> = [];
    const kilometrage: Array<{ month: string; [key: string]: number | string }> = [];
    const cost: Array<{ month: string; [key: string]: number | string }> = [];
    const tonnage: Array<{ month: string; [key: string]: number | string }> = [];
    const ipe: Array<{ month: string; [key: string]: number | string }> = [];
    const ipeTonne: Array<{ month: string; [key: string]: number | string }> = [];

    // Populate comparison data
    sortedMonths.forEach(month => {
      const consumptionItem: { month: string; [key: string]: number | string } = { month };
      const kilometrageItem: { month: string; [key: string]: number | string } = { month };
      const costItem: { month: string; [key: string]: number | string } = { month };
      const tonnageItem: { month: string; [key: string]: number | string } = { month };
      const ipeItem: { month: string; [key: string]: number | string } = { month };
      const ipeTonneItem: { month: string; [key: string]: number | string } = { month };

      data.forEach(vehicle => {
        // Find the data for this month
        const consumptionData = vehicle.monthlyConsumption.find(item => item.month === month);
        const kilometrageData = vehicle.monthlyKilometrage.find(item => item.month === month);
        const costData = vehicle.monthlyCost.find(item => item.month === month);
        const tonnageData = vehicle.monthlyTonnage.find(item => item.month === month);
        const ipeData = vehicle.monthlyIPE.find(item => item.month === month);
        const ipeTonneData = vehicle.monthlyIPETonne.find(item => item.month === month);

        // Add data to comparison items
        consumptionItem[vehicle.matricule] = consumptionData?.value || 0;
        kilometrageItem[vehicle.matricule] = kilometrageData?.value || 0;
        costItem[vehicle.matricule] = costData?.value || 0;
        tonnageItem[vehicle.matricule] = tonnageData?.value || 0;
        ipeItem[vehicle.matricule] = ipeData?.value || 0;
        ipeTonneItem[vehicle.matricule] = ipeTonneData?.value || 0;
      });

      consumption.push(consumptionItem);
      kilometrage.push(kilometrageItem);
      cost.push(costItem);
      tonnage.push(tonnageItem);
      ipe.push(ipeItem);
      ipeTonne.push(ipeTonneItem);
    });

    return {
      matricules,
      consumption,
      kilometrage,
      cost,
      tonnage,
      ipe,
      ipeTonne
    };
  }

  /**
   * Check if a vehicle type has tonnage data
   * @param type Vehicle type
   * @returns Boolean indicating if the vehicle type has tonnage data
   */
  static hasVehicleTonnageData(type: string): boolean {
    return type.toLowerCase() === 'camions' || type.toLowerCase() === 'camion' || 
           type.toLowerCase() === 'chariots' || type.toLowerCase() === 'chariot';
  }

  /**
   * Export vehicle data to CSV or Excel
   * @param matricules Selected matricules
   * @param year Selected year
   * @param month Selected month
   * @param format Export format (csv, excel, pdf)
   * @returns URL to download the exported file
   */
  static async exportVehicleData(
    matricules: string[], 
    year?: string, 
    month?: string,
    format: 'csv' | 'excel' | 'pdf' = 'excel'
  ): Promise<string | null> {
    try {
      if (matricules.length === 0) {
        toast.error("Veuillez sélectionner au moins un véhicule");
        return null;
      }

      // Use the first matricule for export (API limitation)
      // TODO: Enhance backend to support multiple matricule export
      const matricule = matricules[0];
      
      const params: {
        matricule: string;
        format: 'csv' | 'excel' | 'pdf';
        year?: string;
        mois?: string;
      } = {
        matricule,
        format
      };
      
      if (year && year !== 'all') {
        params.year = year;
      }
      
      if (month && month !== 'all') {
        params.mois = month;
      }
      
      const exportUrl = await VehicleAPI.exportRecords(params);
      
      if (exportUrl) {
        toast.success("Exportation réussie");
        return exportUrl;
      } else {
        toast.error("Erreur lors de l'exportation");
        return null;
      }
    } catch (error) {
      console.error("Error exporting vehicle data:", error);
      toast.error("Erreur lors de l'exportation des données");
      return null;
    }
  }
}

export default VehicleService;
