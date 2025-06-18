import { API_BASE_URL } from '@/config/api';

// Types
export type VehicleType = 'CAMION' | 'VOITURE';
export type Region = string;

export interface RegressionCoefficients {
  kilometrage: number;
  tonnage?: number;
}

export interface RegressionResult {
  id: string;
  type: string;
  regressionEquation: string;
  coefficients: RegressionCoefficients;
  intercept: number;
  
  // Validation Results
  warnings: string[];
  hasOutliers: boolean;
  hasMulticollinearity: boolean;
  varianceInflationFactors: number[];
  
  // Regression Statistics
  multipleR: number;
  rSquared: number;
  adjustedRSquared: number;
  standardError: number;
  observations: number;
  mse: number;
  rmse: number;
  mae: number;
  aic: number;
  bic: number;
  
  // ANOVA
  degreesOfFreedom: number;
  sumOfSquares: number;
  meanSquare: number;
  fStatistic: number;
  significanceF: number;
  
  // Coefficient Statistics
  standardErrors: number[];
  tStats: number[];
  pValues: number[];
  lowerConfidence: number[];
  upperConfidence: number[];
  
  // Residual Output
  predictedValues: number[];
  residuals: number[];
  
  // Additional fields
  year: string;
  vehicleType: string;
  region?: string;
}

export interface VehicleRecord {
  id: string;
  type: string;
  matricule: string;
  mois: string;
  year: string;
  region: string;
  consommationL: number;
  consommationTEP: number;
  coutDT: number;
  kilometrage: number;
  produitsTonnes: number;
  ipeL100km: number;
  ipeL100TonneKm: number;
  predictedIpe?: number;
  ipeSerL100km?: number;
  ipeSerL100TonneKm?: number;
  rawValues: Record<string, number>;
}

export interface MonthlyData {
  month: string;
  totalKilometrage: number;
  totalConsommation: number;
  totalTonnage?: number;
  averageIpe: number;
  averageIpeSer: number;
  vehicleCount: number;
}

// API Parameters
export interface GetRegressionParams {
  type: VehicleType;
  year: string;
  region?: Region;
}

export interface GetVehicleDetailsParams {
  vehicleType: VehicleType;
  year: string;
  region?: Region;
}

export interface GetMonthlyDataParams {
  vehicleType: VehicleType;
  year: string;
  region?: Region;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | undefined;
  error?: {
    message: string;
    code?: string;
  };
}

// API Service
class SERApi {
  private async fetchWithError<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      console.log('Fetching URL:', url);
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('No data found (404)');
          return { data: undefined };
        }

        let errorMessage: string;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || response.statusText;
        } catch {
          try {
            errorMessage = await response.text();
          } catch {
            errorMessage = response.statusText;
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Received data:', data);
      return { data };
    } catch (error) {
      console.error('API Error:', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Une erreur est survenue',
        },
      };
    }
  }

  // Regression Analysis
  async getRegressionResult(params: GetRegressionParams): Promise<ApiResponse<RegressionResult>> {
    const queryParams = new URLSearchParams({
      type: params.type,
      year: params.year,
      ...(params.region && { region: params.region }),
    });

    return this.fetchWithError<RegressionResult>(
      `${API_BASE_URL}/regression/search?${queryParams.toString()}`
    );
  }

  async performRegressionAnalysis(params: GetRegressionParams): Promise<ApiResponse<RegressionResult>> {
    const queryParams = new URLSearchParams({
      vehicleType: params.type,
      year: params.year,
      ...(params.region && { region: params.region }),
    });

    return this.fetchWithError<RegressionResult>(
      `${API_BASE_URL}/regression/analyze?${queryParams.toString()}`,
      {
        method: 'POST',
      }
    );
  }

  // Vehicle Details
  async getVehicleDetails(params: GetVehicleDetailsParams): Promise<ApiResponse<VehicleRecord[]>> {
    const queryParams = new URLSearchParams({
      type: params.vehicleType,
      year: params.year,
      ...(params.region && { region: params.region }),
    });

    return this.fetchWithError<VehicleRecord[]>(
      `${API_BASE_URL}/records?${queryParams.toString()}`
    );
  }

  // Monthly Data
  async getMonthlyData(params: GetMonthlyDataParams): Promise<ApiResponse<MonthlyData[]>> {
    const queryParams = new URLSearchParams({
      vehicleType: params.vehicleType,
      year: params.year,
      ...(params.region && { region: params.region }),
    });

    return this.fetchWithError<MonthlyData[]>(
      `${API_BASE_URL}/regression/monthly-data?${queryParams.toString()}`
    );
  }

  // All Regression Results
  async getAllRegressionResults(): Promise<ApiResponse<RegressionResult[]>> {
    return this.fetchWithError<RegressionResult[]>(`${API_BASE_URL}/regression`);
  }

  // Get Regression Result by ID
  async getRegressionResultById(id: string): Promise<ApiResponse<RegressionResult>> {
    return this.fetchWithError<RegressionResult>(`${API_BASE_URL}/regression/${id}`);
  }

  // Update Regression Result
  async updateRegressionResult(id: string, data: RegressionResult): Promise<ApiResponse<RegressionResult>> {
    return this.fetchWithError<RegressionResult>(
      `${API_BASE_URL}/regression/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  // Delete Regression Result
  async deleteRegressionResult(id: string): Promise<ApiResponse<void>> {
    return this.fetchWithError<void>(
      `${API_BASE_URL}/regression/${id}`,
      {
        method: 'DELETE',
      }
    );
  }
}

export const serApi = new SERApi(); 