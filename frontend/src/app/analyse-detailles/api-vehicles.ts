import { VehicleType } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface VehicleRecord {
  id?: string;
  type: string;
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

interface GetRecordsParams {
  type?: VehicleType;
  year?: string;
  mois?: string;
  matricule?: string;
}

interface GetMonthlyAggregationParams {
  vehicleType?: VehicleType;
  year?: string;
  dateFrom?: string;
  dateTo?: string;
}

class VehiclesAPI {
  private static async fetchWithRetry(url: string, options?: RequestInit, retries = 3): Promise<any> {
    try {
      console.log('Fetching:', url);
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          response: responseText
        });

        if (response.status === 429 && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.fetchWithRetry(url, options, retries - 1);
        }

        throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
      }

      try {
        const data = JSON.parse(responseText);
        console.log('API Response:', {
          url,
          data: Array.isArray(data) ? `${data.length} items` : 'object'
        });
        return data;
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        throw new Error('Invalid JSON response from server');
      }
    } catch (error) {
      console.error('API Request Failed:', {
        url,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  }

  static async getRecords(params: GetRecordsParams): Promise<VehicleRecord[]> {
    const queryParams = new URLSearchParams();
    
    if (params.type && params.type !== 'all') {
      queryParams.append('type', params.type);
    }
    if (params.year && params.year !== 'all') {
      queryParams.append('year', params.year);
    }
    if (params.mois) {
      queryParams.append('mois', params.mois);
    }
    if (params.matricule) {
      queryParams.append('matricule', params.matricule);
    }

    // Ensure at least one parameter is set to avoid empty response
    if (queryParams.toString() === '') {
      queryParams.append('year', '2024'); // Default to current year if no filters
    }

    const url = `${API_BASE_URL}/records${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const data = await this.fetchWithRetry(url);
    
    if (!Array.isArray(data)) {
      console.error('Invalid API Response:', data);
      throw new Error('Invalid API response format');
    }

    return data;
  }

  static async getMonthlyAggregation(params: GetMonthlyAggregationParams) {
    const queryParams = new URLSearchParams();
    
    if (params.vehicleType && params.vehicleType !== 'all') {
      queryParams.append('vehicleType', params.vehicleType);
    }
    if (params.year && params.year !== 'all') {
      queryParams.append('year', params.year);
    }
    if (params.dateFrom) {
      queryParams.append('dateFrom', params.dateFrom);
    }
    if (params.dateTo) {
      queryParams.append('dateTo', params.dateTo);
    }

    // Ensure at least one parameter is set
    if (queryParams.toString() === '') {
      queryParams.append('year', '2024');
    }

    const url = `${API_BASE_URL}/records/monthly-aggregation${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.fetchWithRetry(url);
  }

  static async getVehiclesByType(type: VehicleType, year?: string): Promise<VehicleRecord[]> {
    // Always include a year parameter to avoid empty response
    const effectiveYear = year || '2024';
    return this.getRecords({ type, year: effectiveYear });
  }

  static async getVehiclesByMatricule(matricule: string, year?: string): Promise<VehicleRecord[]> {
    return this.getRecords({ matricule, year: year || '2024' });
  }

  static async getVehiclesByTypeAndMatricule(type: VehicleType, matricule: string, year?: string): Promise<VehicleRecord[]> {
    return this.getRecords({ type, matricule, year: year || '2024' });
  }

  static async getVehiclesByMonth(mois: string, type?: VehicleType): Promise<VehicleRecord[]> {
    return this.getRecords({ mois, type, year: '2024' });
  }
}

class APIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'APIError';
  }
}

class RateLimitError extends APIError {
  constructor(message = 'Rate limit exceeded. Please try again later.') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

export default VehiclesAPI;
export { APIError, RateLimitError };
export type { VehicleRecord };

