// API response and request types
export type VehicleType = "VOITURE" | "CAMION";

export interface GetVehicleDetailsParams {
  vehicleType: VehicleType;
  year: string;
  region?: string;
}

export interface VehicleDetailsResponse {
  matricule: string;
  kilometrage: number;
  consommation: number;
  tonnage?: number;
  ipeL100km: number;
  region?: string;
  month: string;
}

export interface ApiError {
  status: number;
  message: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}
