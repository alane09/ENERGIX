// Backend integration for manual entry (saisie manuelle)

import { FormulaConfig, defaultFormulaConfig } from "./formula-config"

export interface VehicleTypeConfig {
  vehicleTypes: string[];
  regions: string[];
}

export interface VehicleInfo {
  matricule: string;
  type: string;
  region: string;
}

export interface VehicleRecord {
  id?: string;
  type: string;
  matricule: string;
  mois: string;
  year: string;
  region: string;
  consommationL: number;
  consommationTEP?: number;
  coutDT?: number;
  kilometrage?: number;
  produitsTonnes?: number;
  ipeL100km?: number;
  ipeL100TonneKm?: number;
  [key: string]: unknown;
}

// New interface for Chariot daily records
export interface ChariotDailyRecord {
  id?: string;
  matricule: string;
  date: string;  // YYYY-MM-DD
  consommationL: number;
  month: string;
  year: string;
}

const API_BASE = "http://localhost:8080/api";

// Fetch vehicle types and regions
export async function fetchVehicleTypeConfig(): Promise<VehicleTypeConfig> {
  const res = await fetch(`${API_BASE}/config/vehicle-types`);
  if (!res.ok) throw new Error("Failed to fetch vehicle types and regions");
  const data = await res.json();
  return {
    vehicleTypes: data.vehicleTypes || [],
    regions: data.regions || [],
  };
}

// Fetch all vehicles (matricule, type, region)
export async function fetchVehicles(): Promise<VehicleInfo[]> {
  const res = await fetch(`${API_BASE}/config/vehicles`);
  if (!res.ok) throw new Error("Failed to fetch vehicles");
  return await res.json();
}

// Fetch vehicle records (with optional filters)
export async function fetchVehicleRecords(params?: {
  type?: string;
  mois?: string;
  matricule?: string;
  year?: string;
}): Promise<VehicleRecord[]> {
  const url = new URL(`${API_BASE}/records`, API_BASE);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch vehicle records");
  return await res.json();
}

// Fetch Chariot daily records
export async function fetchChariotDailyRecords(params?: {
  matricule?: string;
  month?: string;
  year?: string;
  date?: string;
}): Promise<ChariotDailyRecord[]> {
  const url = new URL(`${API_BASE}/chariot-daily`, API_BASE);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch Chariot daily records");
  return await res.json();
}

// Save (create) a new vehicle record
export async function createVehicleRecord(record: VehicleRecord): Promise<VehicleRecord> {
  const res = await fetch(`${API_BASE}/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error("Failed to create vehicle record");
  return await res.json();
}

// Update an existing vehicle record
export async function updateVehicleRecord(id: string, record: VehicleRecord): Promise<VehicleRecord> {
  const res = await fetch(`${API_BASE}/records/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error("Failed to update vehicle record");
  return await res.json();
}

// Save (create) a new Chariot daily record
export async function createChariotDailyRecord(record: ChariotDailyRecord): Promise<ChariotDailyRecord> {
  const res = await fetch(`${API_BASE}/chariot-daily`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error("Failed to create Chariot daily record");
  return await res.json();
}

// Update an existing Chariot daily record
export async function updateChariotDailyRecord(id: string, record: ChariotDailyRecord): Promise<ChariotDailyRecord> {
  const res = await fetch(`${API_BASE}/chariot-daily/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error("Failed to update Chariot daily record");
  return await res.json();
}

// Aggregate Chariot daily records into monthly record
export async function aggregateChariotMonthlyRecord(matricule: string, month: string, year: string): Promise<VehicleRecord> {
  const res = await fetch(`${API_BASE}/chariot-daily/aggregate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matricule, month, year }),
  });
  if (!res.ok) throw new Error("Failed to aggregate Chariot monthly record");
  return await res.json();
}

export function calculateValues(record: VehicleRecord, formulaConfig: FormulaConfig = defaultFormulaConfig): VehicleRecord {
  const { consommationL, kilometrage, produitsTonnes } = record;
  
  // Calculate TEP
  if (consommationL) {
    record.consommationTEP = consommationL * formulaConfig.tepFactor;
  }
  
  // Calculate cost
  if (consommationL) {
    record.coutDT = consommationL * formulaConfig.costFactor;
  }
  
  // Calculate IPE
  if (consommationL && kilometrage) {
    try {
      const formula = new Function('consommationL', 'kilometrage', `return ${formulaConfig.ipeFormula}`);
      record.ipeL100km = formula(consommationL, kilometrage);
    } catch (error) {
      console.error('Error calculating IPE:', error);
      record.ipeL100km = (consommationL * 100) / kilometrage; // Fallback to default formula
    }
  }
  
  // Calculate IPE per tonne
  if (consommationL && kilometrage && produitsTonnes) {
    try {
      const formula = new Function('consommationL', 'kilometrage', 'produitsTonnes', `return ${formulaConfig.ipeTonneFormula}`);
      record.ipeL100TonneKm = formula(consommationL, kilometrage, produitsTonnes);
    } catch (error) {
      console.error('Error calculating IPE per tonne:', error);
      record.ipeL100TonneKm = (consommationL * 100) / (kilometrage * produitsTonnes); // Fallback to default formula
    }
  }
  
  return record;
} 