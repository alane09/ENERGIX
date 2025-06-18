export interface UploadedFile {
  id: string;
  filename: string;
  name?: string;
  uploadDate: string;
  size: number;
  type: string;
  vehicleType?: string;
  year?: string;
  recordCount?: number;
  processed?: boolean;
}

export interface VehicleTableRecord {
  id: string;
  date?: string;
  vehicleId?: string;
  vehicleType?: string;
  distance?: number;
  fuelConsumption?: number;
  tonnage?: number;
  region?: string;
  efficiency?: number;
  ipeL100km?: number;
  ipeL100TonneKm?: number;
  predictedIpe?: number;
  ipeSerL100km?: number;
  ipeSerL100TonneKm?: number;
  consommationTEP?: number;
  coutDT?: number;
  type?: string;
  matricule?: string;
  mois?: string;
  year?: string | number;
  annee?: string | number;
  kilometrage?: number;
  consommationL?: number;
  produitsTonnes?: number;
  driver?: string;
  rawValues?: Record<string, number>;
  sourceFile?: string;
  uploadDate?: string;
}

export interface VehicleRecord {
  id: string;
  type?: string;
  matricule?: string;
  mois?: string;
  year?: string | number;
  annee?: string | number;
  kilometrage?: number;
  consommationL?: number;
  produitsTonnes?: number;
  region?: string;
  driver?: string;
  ipeL100km?: number;
  consommationTEP?: number;
  coutDT?: number;
  ipeL100TonneKm?: number;
  predictedIpe?: number;
  ipeSerL100km?: number;
  ipeSerL100TonneKm?: number;
  rawValues?: Record<string, number>;
  sourceFile?: string;
  uploadDate?: string;
  vehicleType?: string;
  vehicleId?: string;
  date?: string;
  efficiency?: number;
  distance?: number;
  fuelConsumption?: number;
  tonnage?: number;
}

export interface HistoricalRecord extends VehicleTableRecord {
  year: string | number;
  mois: string;
  rawValues?: Record<string, number>;
  sourceFile?: string;
  uploadDate?: string;
}

// Export VehicleType as a union type if it's not defined elsewhere
// Assuming VehicleType is meant to be a union of the possible vehicle types
export type VehicleType = "CAMION" | "VOITURE" | "CHARIOT";
