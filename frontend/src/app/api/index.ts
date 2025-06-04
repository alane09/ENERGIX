/**
 * Comprehensive API client for the Carburant application
 * This file contains all the endpoints from the backend controllers
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// Types and interfaces for API responses and requests

export interface VehicleRecord {
  id?: string;
  type: string;             // Vehicle type (sheet name: Camions, Voitures, etc.)
  matricule: string;        // Vehicle registration number
  mois: string;             // Month (from merged cells)
  year: string;             // Year of the record
  region?: string;          // Region (geographical area)
  consommationL: number;    // Consumption in L
  consommationTEP: number;  // Consumption in TEP
  coutDT: number;           // Cost in DT
  kilometrage: number;      // Distance in Km
  produitsTonnes?: number;  // Transported products in Tons (for trucks)
  ipeL100km?: number;       // Energy Performance Index in L/100km (for utility vehicles)
  ipeL100TonneKm?: number;  // Energy Performance Index in L/Tonne.100Km (for trucks)
  rawValues?: Record<string, number>; // Raw values for any additional metrics
}

export interface RegressionResult {
  id?: string;
  type: string;             // Vehicle type
  regressionEquation?: string; // Formatted equation (e.g., "Y = 0.1468*X1 + 0.2412*X2 + 305.0161")
  equation?: string;        // Alternative name for regression equation
  coefficients: Record<string, number>; // Map of variable names to coefficients
  intercept: number;        // Y-intercept
  rSquared: number;         // R-squared value
  adjustedRSquared?: number; // Adjusted R-squared
  mse?: number;             // Mean Squared Error
}

export interface FileDTO {
  id: string;
  name: string;
  filename: string;
  contentType: string;
  size: number;
  uploadDate: string;
  year: number;
  vehicleType: string;
  sheetName?: string;
  processed: boolean;
  recordCount: number;
  availableSheets?: string[];
}

export interface MonthlyData {
  month: string;
  consommation: number;
  kilometrage: number;
  tonnage?: number;
  referenceConsommation: number;
  targetConsommation: number;
}

export interface ReportParams {
  type: string;
  startDate: string;
  endDate: string;
  format?: string;
}

export interface Report {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  format: string;
  createdAt: number;
  name: string;
}

// Helper functions for API requests

async function fetchWithErrorHandling(url: string, options: RequestInit = {}) {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`API error (${response.status}): ${errorText}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
}

// Vehicle API

const VehicleAPI = {
  /**
   * Get all vehicle records with optional filtering
   * @param params Optional filter parameters
   */
  getAllRecords: async (params?: {
    type?: string;
    year?: string | number;
    matricule?: string;
    region?: string;
    mois?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const url = `${API_BASE_URL}/records${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return fetchWithErrorHandling(url) as Promise<VehicleRecord[]>;
  },
  
  /**
   * Get a single vehicle record by ID
   * @param id Record ID
   */
  getRecordById: async (id: string) => {
    return fetchWithErrorHandling(`${API_BASE_URL}/records/${id}`) as Promise<VehicleRecord>;
  },
  
  /**
   * Create a new vehicle record
   * @param record Vehicle record data
   */
  createRecord: async (record: VehicleRecord) => {
    return fetchWithErrorHandling(`${API_BASE_URL}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    }) as Promise<VehicleRecord>;
  },
  
  /**
   * Update an existing vehicle record
   * @param id Record ID
   * @param record Updated vehicle record data
   */
  updateRecord: async (id: string, record: Partial<VehicleRecord>) => {
    return fetchWithErrorHandling(`${API_BASE_URL}/records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    }) as Promise<VehicleRecord>;
  },
  
  /**
   * Partially update a vehicle record
   * @param id Record ID
   * @param updates Partial updates for the record
   */
  patchRecord: async (id: string, updates: Partial<VehicleRecord>) => {
    return fetchWithErrorHandling(`${API_BASE_URL}/records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }) as Promise<VehicleRecord>;
  },
  
  /**
   * Delete a vehicle record
   * @param id Record ID
   */
  deleteRecord: async (id: string) => {
    return fetchWithErrorHandling(`${API_BASE_URL}/records/${id}`, {
      method: 'DELETE',
    }) as Promise<void>;
  },
  
  /**
   * Get summary statistics for vehicle records
   * @param type Vehicle type
   * @param year Year filter
   */
  getStatistics: async (type?: string, year?: string | number) => {
    const queryParams = new URLSearchParams();
    if (type) queryParams.append('type', type);
    if (year) queryParams.append('year', String(year));
    
    const url = `${API_BASE_URL}/records/statistics${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return fetchWithErrorHandling(url) as Promise<any>;
  },
  
  /**
   * Get all unique vehicle types
   */
  getVehicleTypes: async () => {
    return fetchWithErrorHandling(`${API_BASE_URL}/records/types`) as Promise<string[]>;
  },

  /**
   * Get all unique regions
   */
  getRegions: async () => {
    return fetchWithErrorHandling(`${API_BASE_URL}/records/regions`) as Promise<string[]>;
  },

  /**
   * Get all unique vehicle registration numbers (matricules)
   * @param type Optional vehicle type filter
   */
  getMatricules: async (type?: string) => {
    const queryParams = new URLSearchParams();
    if (type) queryParams.append('type', type);
    
    const url = `${API_BASE_URL}/records/matricules${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return fetchWithErrorHandling(url) as Promise<string[]>;
  },
};

// Regression API

const RegressionAPI = {
  /**
   * Get regression analysis results
   * @param type Vehicle type
   * @param year Year
   */
  getRegressionAnalysis: async (type: string, year: string | number) => {
    return fetchWithErrorHandling(
      `${API_BASE_URL}/regression/analysis?type=${encodeURIComponent(type)}&year=${year}`
    ) as Promise<RegressionResult>;
  },
  
  /**
   * Get monthly data with reference and target consumption
   * @param type Vehicle type
   * @param year Year
   */
  getMonthlyData: async (type: string, year: string | number) => {
    return fetchWithErrorHandling(
      `${API_BASE_URL}/regression/monthly?type=${encodeURIComponent(type)}&year=${year}`
    ) as Promise<MonthlyData[]>;
  },
  
  /**
   * Calculate reference consumption based on parameters
   * @param type Vehicle type
   * @param kilometrage Kilometrage value
   * @param tonnage Optional tonnage value for trucks
   */
  calculateReference: async (type: string, kilometrage: number, tonnage?: number) => {
    const queryParams = new URLSearchParams({
      type,
      kilometrage: String(kilometrage),
    });
    
    if (tonnage !== undefined) {
      queryParams.append('tonnage', String(tonnage));
    }
    
    return fetchWithErrorHandling(
      `${API_BASE_URL}/regression/calculate?${queryParams.toString()}`
    ) as Promise<{ referenceConsommation: number }>;
  },
  
  /**
   * Get regression analysis variables
   * @param type Vehicle type
   */
  getRegressionVariables: async (type: string) => {
    return fetchWithErrorHandling(
      `${API_BASE_URL}/regression/variables?type=${encodeURIComponent(type)}`
    ) as Promise<string[]>;
  },

  /**
   * Run custom regression analysis with selected variables
   * @param type Vehicle type
   * @param year Year
   * @param variables List of variables to include in regression
   */
  runCustomRegression: async (type: string, year: string | number, variables: string[]) => {
    return fetchWithErrorHandling(`${API_BASE_URL}/regression/custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, year, variables }),
    }) as Promise<RegressionResult>;
  },
};

// Upload API

const UploadAPI = {
  /**
   * Upload a vehicle data file
   * @param file File to upload
   * @param vehicleType Vehicle type associated with the file
   * @param year Year associated with the file
   */
  uploadFile: async (file: File, vehicleType: string, year: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('vehicleType', vehicleType);
    formData.append('year', String(year));
    
    return fetchWithErrorHandling(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    }) as Promise<{
      success: boolean;
      fileId?: string;
      fileName?: string;
      availableSheets?: string[];
      message?: string;
    }>;
  },
  
  /**
   * Extract data from an uploaded file
   * @param fileId File ID
   * @param sheetName Sheet name to extract
   * @param headers Headers mapping to use
   */
  extractData: async (fileId: string, sheetName: string, headers?: Record<string, string>) => {
    return fetchWithErrorHandling(`${API_BASE_URL}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, sheetName, headers }),
    }) as Promise<{
      success: boolean;
      recordCount?: number;
      message?: string;
    }>;
  },
  
  /**
   * Save extracted data to database
   * @param fileId File ID
   * @param sheetName Sheet name to save
   */
  saveData: async (fileId: string, sheetName: string) => {
    return fetchWithErrorHandling(`${API_BASE_URL}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, sheetName }),
    }) as Promise<{
      success: boolean;
      recordCount?: number;
      message?: string;
    }>;
  },
};

// Files API

const FilesAPI = {
  /**
   * Upload a file
   * @param file File to upload
   * @param vehicleType Vehicle type associated with the file
   * @param year Year associated with the file
   */
  uploadFile: async (file: File, vehicleType: string, year: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('vehicleType', vehicleType);
    formData.append('year', String(year));
    
    return fetchWithErrorHandling(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      body: formData,
    }) as Promise<{
      success: boolean;
      fileId?: string;
      fileName?: string;
      availableSheets?: string[];
      message?: string;
    }>;
  },
  
  /**
   * Get file upload history
   */
  getFileHistory: async () => {
    return fetchWithErrorHandling(`${API_BASE_URL}/files/history`) as Promise<FileDTO[]>;
  },
  
  /**
   * Get file by ID
   * @param id File ID
   */
  getFileById: async (id: string) => {
    return fetchWithErrorHandling(`${API_BASE_URL}/files/${id}`) as Promise<FileDTO>;
  },
  
  /**
   * Download file by ID
   * @param id File ID
   */
  downloadFile: async (id: string) => {
    // This returns a URL that can be used to download the file
    window.open(`${API_BASE_URL}/files/${id}/download`, '_blank');
  },
  
  /**
   * Delete file by ID
   * @param id File ID
   */
  deleteFile: async (id: string) => {
    return fetchWithErrorHandling(`${API_BASE_URL}/files/${id}/delete`, {
      method: 'DELETE',
    }) as Promise<{ success: boolean }>;
  },
  
  /**
   * Get files by vehicle type
   * @param vehicleType Vehicle type
   */
  getFilesByVehicleType: async (vehicleType: string) => {
    return fetchWithErrorHandling(`${API_BASE_URL}/files/by-vehicle/${encodeURIComponent(vehicleType)}`) as Promise<FileDTO[]>;
  },
  
  /**
   * Get files by year
   * @param year Year
   */
  getFilesByYear: async (year: number) => {
    return fetchWithErrorHandling(`${API_BASE_URL}/files/by-year/${year}`) as Promise<FileDTO[]>;
  },
};

// Reports API

const ReportsAPI = {
  /**
   * Generate a report
   * @param params Report parameters
   */
  generateReport: async (params: ReportParams) => {
    return fetchWithErrorHandling(`${API_BASE_URL}/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }) as Promise<string>; // Returns the report ID
  },
  
  /**
   * Get all reports
   */
  getReports: async () => {
    return fetchWithErrorHandling(`${API_BASE_URL}/reports`) as Promise<Report[]>;
  },
  
  /**
   * Delete a report
   * @param id Report ID
   */
  deleteReport: async (id: string) => {
    return fetchWithErrorHandling(`${API_BASE_URL}/reports/${id}`, {
      method: 'DELETE',
    }) as Promise<void>;
  },
  
  /**
   * Download a report
   * @param id Report ID
   */
  downloadReport: async (id: string) => {
    // This returns a download URL
    const downloadUrl = await fetchWithErrorHandling(`${API_BASE_URL}/reports/${id}/download`) as string;
    window.open(`${API_BASE_URL}${downloadUrl}`, '_blank');
  },
};

// Health Check API

const HealthAPI = {
  /**
   * Check API health
   */
  healthCheck: async () => {
    return fetchWithErrorHandling(`${API_BASE_URL}/api/health`) as Promise<string>;
  },
};

// Test API for development/debugging

const TestAPI = {
  /**
   * List all MongoDB collections
   */
  listCollections: async () => {
    return fetchWithErrorHandling(`${API_BASE_URL}/api/test/collections`) as Promise<{
      collections: string[];
      counts: Record<string, number>;
      status: string;
    }>;
  },
  
  /**
   * Test insert functionality
   */
  testInsert: async () => {
    return fetchWithErrorHandling(`${API_BASE_URL}/api/test/test-insert`) as Promise<{
      status: string;
      message: string;
    }>;
  },
};

// SER (Suivi Énergétique de Référence) API
// Combine relevant endpoints from RegressionAPI specifically for SER functionality

const SERAPI = {
  /**
   * Get regression analysis for SER
   * @param vehicleType Vehicle type
   * @param year Year
   */
  getRegressionAnalysis: async (vehicleType: string, year: string | number) => {
    return RegressionAPI.getRegressionAnalysis(vehicleType, year);
  },
  
  /**
   * Get monthly data for SER
   * @param vehicleType Vehicle type
   * @param year Year
   */
  getMonthlyData: async (vehicleType: string, year: string | number) => {
    return RegressionAPI.getMonthlyData(vehicleType, year);
  },
  
  /**
   * Calculate reference consumption for SER
   * @param vehicleType Vehicle type
   * @param kilometrage Kilometrage value
   * @param tonnage Optional tonnage value for trucks
   */
  calculateReference: async (vehicleType: string, kilometrage: number, tonnage?: number) => {
    return RegressionAPI.calculateReference(vehicleType, kilometrage, tonnage);
  },
};

export {
    FilesAPI, HealthAPI, RegressionAPI, ReportsAPI, SERAPI, TestAPI, UploadAPI, VehicleAPI
};

