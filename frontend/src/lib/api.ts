/**
 * Comprehensive API service for the COFICAB ENERGIX Dashboard
 * Handles all backend integrations and CRUD operations
 */

// Dynamic toast import with better fallback for server components
let toast: { success: (message: string) => void; error: (message: string) => void; warning: (message: string) => void } = {
  success: (message: string) => console.log(`[Success]: ${message}`),
  error: (message: string) => console.error(`[Error]: ${message}`),
  warning: (message: string) => console.warn(`[Warning]: ${message}`)
};

// Only import toast in client environment
if (typeof window !== 'undefined') {
  try {
    // Use require instead of dynamic import to avoid TypeScript errors
    // This works because we've added a custom type declaration for sonner
    // @ts-ignore - Ignore TypeScript error for require
    const sonner = require('sonner');
    if (sonner && sonner.toast) {
      toast = sonner.toast;
    }
  } catch (e) {
    // Use fallback defined above
    console.warn('Failed to load toast library, using fallback');
  }
}

// No direct console logging in production
// Only log in development and only when explicitly enabled
const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true' && process.env.NODE_ENV === 'development';

// Enhanced debug logging functionality with data sanitization
const logDebug = (...args: any[]) => {
  if (!DEBUG) return;
  
  // Process and sanitize args to avoid logging sensitive data
  const sanitizedArgs = args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      // For objects, create a safe representation
      return '[Object data]';
    }
    return arg;
  });
  
  console.log('[API Debug]:', ...sanitizedArgs);
};

// Logger for sensitive data with sanitization
const logSensitiveData = (message: string, data?: any) => {
  if (!DEBUG) return;
  
  // Log the message but sanitize any data
  if (data) {
    if (Array.isArray(data)) {
      console.log(`${message}: [Array with ${data.length} items]`);
    } else if (typeof data === 'object' && data !== null) {
      console.log(`${message}: [Object]`);
    } else {
      console.log(`${message}: ${data}`);
    }
  } else {
    console.log(message);
  }
};

// Centralized error logging to avoid console pollution
const logError = (message: string, error?: any) => {
  if (DEBUG) {
    console.error(`[API Error]: ${message}`, error);
  }
  // In production, we could send this to an error tracking service instead
};

// Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

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
  rawValues?: Record<string, number>;
}

export interface RegressionResult {
  id?: string;
  type: string;
  regressionEquation: string;
  coefficients: Record<string, number>;
  intercept: number;
  rSquared: number;
  adjustedRSquared: number;
  mse: number;
  monthlyData?: Array<{
    month: string;
    year: string;
    consommation: number;
    kilometrage: number;
    tonnage: number;
    ipe: number;
  }>;
}

export interface SheetResponse {
  sheets: string[];
}

export interface UploadedFile {
  id: string;
  name: string;
  uploadDate: string;
  size: number;
}

// Configuration
// API base URL configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

// Normalize the base URL to ensure it doesn't end with a trailing slash
const NORMALIZED_BASE_URL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

// Define the working API endpoints based on testing
// The backend Spring's context-path is set to '/api', so don't duplicate it
const WORKING_ENDPOINTS = {
  RECORDS: `${NORMALIZED_BASE_URL}/records`,
  MONTHLY_AGGREGATION: `${NORMALIZED_BASE_URL}/records/monthly-aggregation`
};

// Export for direct use in components if needed
export { API_BASE_URL, WORKING_ENDPOINTS };

/**
 * Normalize the base URL to ensure consistent formatting
 * Prevents issues with double slashes or missing slashes
 */
export function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/**
 * Build a complete API URL with the endpoint
 * @param endpoint API endpoint path
 * @returns Full API URL with query parameters
 */
export const buildApiUrl = (endpoint: string): string => {
  // Ensure the endpoint starts with a slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // The backend has a context path of '/api' configured in application.properties
  // We don't need to add another '/api' prefix as the server already adds it
  
  // First, remove any '/api' prefix from the endpoint to avoid duplication
  let cleanEndpoint = normalizedEndpoint;
  while (cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.substring(4); // Remove '/api' prefix
  }
  
  // Combine the base URL with the clean endpoint (without adding /api again)
  const url = `${NORMALIZED_BASE_URL}${cleanEndpoint}`;
  
  logDebug(`Built API URL: ${url}`);
  return url;
};

/**
 * Generic API request function with improved error handling
 * Implements robust error handling and fallback mechanisms
 */
export async function apiRequest<T>(
  endpoint: string, 
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    useCache?: boolean;
    timeout?: number;
    fallbackData?: T | null;
    retries?: number;
  } = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    headers = {},
    useCache = false,
    timeout = 30000, // 30 seconds default timeout
    fallbackData = null,
    retries = 1
  } = options;
  
  // Construct the full URL using the same method as buildApiUrl
  // This ensures consistency across all API calls
  const url = buildApiUrl(endpoint);
  logDebug(`Request: ${method} ${url}`);
  
  // Set up request options with proper typing
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    // Only include body for non-GET requests
    ...(method !== 'GET' && body ? { body: JSON.stringify(body) } : {}),
    // Add cache control
    cache: useCache ? 'default' : 'no-cache',
    // Add credentials to handle CORS properly
    credentials: 'include'
  };

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  requestOptions.signal = controller.signal;

  let lastError: any = null;
  let attemptCount = 0;

  while (attemptCount <= retries) {
    try {
      attemptCount++;
      
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId); // Clear the timeout
      
      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        logError(`Request failed with status ${response.status}`, errorText);
        
        // For 5xx errors, retry if we have attempts left
        if (response.status >= 500 && attemptCount <= retries) {
          lastError = `Server error: ${response.status}`;
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attemptCount) * 200));
          continue;
        }
        
        return {
          data: fallbackData,
          error: `Error ${response.status}: ${errorText || response.statusText}`
        };
      }
      
      // Parse the response
      let data;
      try {
        // Check if the response is empty first
        const contentLength = response.headers.get('content-length');
        if (contentLength === '0') {
          return { data: null as any, error: null };
        }
        
        data = await response.json();
      } catch (parseError) {
        // Handle empty or non-JSON responses
        logDebug("Response parsing error", parseError);
        return {
          data: fallbackData,
          error: 'Invalid response format'
        };
      }
      
      return { data, error: null };
    } catch (error) {
      clearTimeout(timeoutId); // Clear the timeout
      lastError = error;
      
      // If this is a timeout or network error and we have retries left
      if (attemptCount <= retries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attemptCount) * 200));
        continue;
      }
      
      // We've exhausted our retries or it's a non-retriable error
      logError(`Request failed after ${attemptCount} attempts`, error);
      
      // Check if the error is likely due to backend not running
      const isConnectionError = 
        error instanceof TypeError && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('Network request failed'));
      
      if (isConnectionError) {
        console.warn('Backend connection error - server may not be running');
        // Return a more user-friendly error message
        return {
          data: fallbackData,
          error: 'Could not connect to the server. Please ensure the backend is running.'
        };
      }
      
      return {
        data: fallbackData,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // If we've exhausted all retries
  return {
    data: fallbackData,
    error: lastError instanceof Error ? lastError.message : String(lastError)
  };
}

/**
 * Vehicle API for handling vehicle records and statistics
 * VehicleController is mapped to /records in the backend
 * So the full path is /api/records
 */
export const VehicleAPI = {
  /**
   * Get available vehicle types
   * Endpoint: /records?type=all
   */
  async getVehicleTypes(): Promise<string[]> {
    try {
      // Use the directly fixed endpoint without 'api' prefix - apiRequest will add it
      const { data, error } = await apiRequest<VehicleRecord[]>('/records?type=all');
      
      if (error) {
        logError("Error fetching vehicle types:", error);
        return ['VOITURE', 'CAMION', 'CHARIOT']; // Return default types on error
      }
      
      // Extract unique vehicle types from the records
      if (Array.isArray(data)) {
        const types = Array.from(new Set(data.map(record => record.type)));
        // Filter out any undefined/null/empty values and 'Sheet1'
        return types.filter(type => Boolean(type) && type !== 'Sheet1' && type !== 'sheet1');
      }
      
      return ['VOITURE', 'CAMION', 'CHARIOT']; // Default fallback
    } catch (error) {
      logError("Error in getVehicleTypes:", error);
      return ['VOITURE', 'CAMION', 'CHARIOT']; // Default fallback on exception
    }
  },
  
  /**
   * Get all vehicle records with optional filtering and pagination
   * Endpoint: /api/records
   */
  async getRecords(params?: { 
    type?: string; 
    mois?: string; 
    matricule?: string;
    year?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<VehicleRecord[]> {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      
      const queryString = queryParams.toString();
      // Use the correct endpoint path without '/api' prefix - buildApiUrl will add it
      const endpoint = `records${queryString ? `?${queryString}` : ''}`;
      
      const { data, error } = await apiRequest<VehicleRecord[]>(endpoint);
      
      if (error) {
        logError(`Error fetching records for params ${JSON.stringify(params)}:`, error);
        toast.error(`Erreur lors de la récupération des données: ${error}`);
        return [];
      }
      
      if (!data || data.length === 0) {
        logDebug(`No records found for params:`, params);
      }
      
      return data || [];
    } catch (error) {
      logError("Error in getRecords:", error);
      return [];
    }
  },
  
  /**
   * Get a vehicle record by ID
   * Endpoint: /api/records/{id}
   */
  async getRecordById(id: string): Promise<VehicleRecord | null> {
    try {
      const { data, error } = await apiRequest<VehicleRecord>(`/records/${id}`);
      
      if (error) {
        logError(`Error fetching record ${id}:`, error);
        return null;
      }
      
      return data;
    } catch (error) {
      logError("Error in getRecordById:", error);
      return null;
    }
  },
  
  /**
   * Get dashboard statistics and aggregated data
   * This is used for the main dashboard page
   * NOTE: This method is deprecated. Use getDashboardStats from api-dashboard.ts instead.
   * Endpoint: /records/monthly-aggregation
   */
  async getDashboardStats(params?: {
    year?: string;
    month?: string;
    vehicleType?: string;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.year) queryParams.append('year', params.year);
      if (params?.month) queryParams.append('month', params.month);
      
      // Always include type parameter, default to 'all' if not provided
      const type = params?.vehicleType || 'all';
      queryParams.append('type', type);
      
      // Fix the endpoint path - don't include /api/ prefix as apiRequest will add it
      const endpoint = `/records/monthly-aggregation${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      logDebug(`Fetching dashboard stats from: ${endpoint}`);
      
      const { data, error } = await apiRequest(endpoint);
      
      if (error) {
        logError("Error fetching dashboard stats", error);
        toast.error(`Failed to load dashboard stats: ${error}`);
        throw new Error(`Failed to load dashboard stats: ${error}`);
      }
      
      return data || { totalVehicles: 0, totalConsommation: 0, avgIPE: 0, totalKilometrage: 0 };
    } catch (error) {
      logError("Error in getDashboardStats", error);
      toast.error(`Failed to load dashboard stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  },
  
  /**
   * Get performance data for vehicles
   * Endpoint: /records/performance
   */
  async getPerformanceData(params?: {
    year?: string;
    month?: string;
    vehicleType?: string;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.year) queryParams.append('year', params.year);
      if (params?.month) queryParams.append('month', params.month);
      
      // Always include type parameter, default to 'all' if not provided
      const type = params?.vehicleType || 'all';
      queryParams.append('type', type);
      
      // Fix the endpoint path - don't include /api/ prefix as apiRequest will add it
      const endpoint = `/records/performance${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      logDebug(`Fetching performance data from: ${endpoint}`);
      
      const { data, error } = await apiRequest(endpoint);
      
      if (error) {
        logError("Error fetching performance data", error);
        toast.error(`Failed to load performance data: ${error}`);
        throw new Error(`Failed to load performance data: ${error}`);
      }
      
      return data || [];
    } catch (error) {
      logError("Error in getPerformanceData", error);
      toast.error(`Failed to load performance data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  },
  
  /**
   * Get monthly aggregation data for charts
   * Endpoint: /records/monthly-aggregation
   */
  async getMonthlyAggregation(params?: {
    vehicleType?: string;
    year?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      
      // Always include type parameter, default to 'all' if not provided
      // This is required by the backend VehicleController.getMonthlyAggregatedData method
      const type = params?.vehicleType || 'all';
      queryParams.append('type', type);
      
      // Add other parameters if provided
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (key !== 'vehicleType' && value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      
      // Add includeSheetData parameter when type is 'all'
      if (type === 'all') {
        queryParams.append('includeSheetData', 'true');
      }
      
      // Remove leading slash to prevent duplicate '/api/' in URL
      const endpoint = `records/monthly-aggregation?${queryParams.toString()}`;
      logDebug(`Making monthly aggregation API request to: ${endpoint}`);
      
      const { data, error } = await apiRequest<any>(endpoint);
      
      if (error) {
        logError("Error fetching monthly aggregation data", error);
        return [];
      }
      
      // Log sanitized summary instead of the full data
      if (DEBUG && data) {
        if (Array.isArray(data)) {
          logDebug(`Received array of length ${data.length} for monthly aggregation`);
        } else if (data.monthlyData && Array.isArray(data.monthlyData)) {
          logDebug(`Received monthly data with ${data.monthlyData.length} entries`);
        }
      }
      
      // Handle different response formats and ensure we always return an array
      if (data && data.monthlyData && Array.isArray(data.monthlyData)) {
        return data.monthlyData;
      } else if (Array.isArray(data)) {
        return data;
      }
      
      return []; // Return empty array as fallback
    } catch (error) {
      logError("Error in getMonthlyAggregation", error);
      return [];
    }
  },

  /**
   * Export vehicle records to a file
   * Endpoint: /records/export
   */
  async exportRecords(params?: {
    type?: string;
    mois?: string;
    matricule?: string;
    year?: string;
    format?: 'csv' | 'excel' | 'pdf';
  }): Promise<string | null> {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      
      // Default format to excel if not specified
      if (!queryParams.has('format')) {
        queryParams.append('format', 'excel');
      }
      
      // Remove leading slash to prevent duplicate '/api/' in URL
      const endpoint = `records/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      logDebug(`Exporting records with endpoint: ${endpoint}`);
      
      const { data, error } = await apiRequest<string>(endpoint);
      
      if (error) {
        logError("Error exporting records:", error);
        toast.error(`Erreur lors de l'exportation des données: ${error}`);
        return null;
      }
      
      toast.success("Exportation des données réussie");
      return data;
    } catch (error) {
      logError("Error in exportRecords:", error);
      toast.error(`Erreur lors de l'exportation des données: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  },
  
  /**
   * Get vehicle type breakdown for statistics
   * Endpoint: /records/vehicle-type-breakdown
   */
  async getVehicleTypeBreakdown(params?: {
    year?: string;
    month?: string;
  }): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.year) queryParams.append('year', params.year);
      if (params?.month) queryParams.append('month', params.month);
      
      // Remove leading slash to prevent duplicate '/api/' in URL
      const endpoint = `records/vehicle-type-breakdown${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      logDebug(`Getting vehicle type breakdown with endpoint: ${endpoint}`);
      
      const { data, error } = await apiRequest<any[]>(endpoint);
      
      if (error) {
        logError("Error fetching vehicle type breakdown:", error);
        return [];
      }
      
      return Array.isArray(data) ? data : [];
    } catch (error) {
      logError("Error in getVehicleTypeBreakdown:", error);
      return [];
    }
  }
};

/**
 * Regression API for handling regression analysis
 * RegressionController is mapped to /regression in the backend
 * With the context path /api, the full path becomes /api/regression
 */
export const RegressionAPI = {
  /**
   * Get regression data for a specific vehicle type
   * Endpoint: /regression/monthly-totals/{type}
   */
  async getRegressionData(type: string): Promise<Record<string, any>> {
    try {
      const endpoint = `/regression/monthly-totals/${encodeURIComponent(type)}`;
      
      const { data, error } = await apiRequest<Record<string, any>>(endpoint);
      
      if (error) {
        logError(`Error fetching regression data for type ${type}`, error);
        return {};
      }
      
      return data || {};
    } catch (error) {
      logError(`Error fetching regression data for type ${type}`, error);
      return {};
    }
  },
  
  /**
   * Get regression result for a specific vehicle type
   * Endpoint: /regression/type/{type}
   */
  async getRegressionResultByType(type: string): Promise<RegressionResult | null> {
    try {
      // Remove leading slash to prevent duplicate '/api/' in URL
      const endpoint = `regression/type/${encodeURIComponent(type)}`;
      
      const { data, error } = await apiRequest<RegressionResult>(endpoint);
      
      if (error) {
        logError(`Error fetching regression result for type ${type}`, error);
        return null;
      }
      
      return data;
    } catch (error) {
      logError(`Error fetching regression result for type ${type}`, error);
      return null;
    }
  },
  
  /**
   * Get monthly totals for regression analysis
   * Endpoint: /regression/monthly-totals/{type}
   */
  async getMonthlyTotalsForRegression(type: string): Promise<Record<string, Record<string, number>> | null> {
    try {
      const endpoint = `/regression/monthly-totals/${encodeURIComponent(type)}`;
      
      const { data, error } = await apiRequest<Record<string, Record<string, number>>>(endpoint);
      
      if (error) {
        logError(`Error fetching monthly totals for regression for type ${type}`, error);
        return null;
      }
      
      return data;
    } catch (error) {
      logError(`Error fetching monthly totals for regression for type ${type}`, error);
      return null;
    }
  },
  
  /**
   * Perform regression analysis for a specific vehicle type
   * Endpoint: /regression/perform/{type}
   */
  async performRegression(type: string): Promise<RegressionResult | null> {
    try {
      // Remove leading slash to prevent duplicate '/api/' in URL
      const endpoint = `regression/perform/${encodeURIComponent(type)}`;
      
      const { data, error } = await apiRequest<RegressionResult>(endpoint, {
        method: 'POST'
      });
      
      if (error) {
        logError(`Error performing regression for type ${type}`, error);
        return null;
      }
      
      return data;
    } catch (error) {
      logError(`Error performing regression for type ${type}`, error);
      return null;
    }
  },
  
  /**
   * Save manual regression result for a specific vehicle type
   * Endpoint: /regression/save-manual
   */
  async saveManualRegressionResult(regressionData: Partial<RegressionResult>): Promise<RegressionResult | null> {
    try {
      // Remove leading slash to prevent duplicate '/api/' in URL
      const endpoint = `regression/save-manual`;
      
      const { data, error } = await apiRequest<RegressionResult>(endpoint, {
        method: 'POST',
        body: regressionData
      });
      
      if (error) {
        logError(`Error saving manual regression result`, error);
        return null;
      }
      
      return data;
    } catch (error) {
      logError(`Error saving manual regression result`, error);
      return null;
    }
  }
};

/**
 * Upload API for handling file uploads and data extraction
 * UploadController is mapped to root path "/" in the backend with context path /api
 * So the full path is /api/
 */
export const UploadAPI = {
  /**
   * Upload an Excel file and get available sheet names
   * Endpoint: /upload
   */
  async uploadFile(file: File): Promise<string[]> {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Make the request - UploadController is mapped to root path
      // Remove leading slash to prevent duplicate '/api/' in URL
      const url = buildApiUrl('upload');
      logDebug(`Uploading file to: ${url}`);
      
      // We need to use fetch directly for file uploads as apiRequest doesn't support FormData
      const response = await fetch(url, {
        method: 'POST',
        body: formData
        // Don't set Content-Type header for multipart/form-data
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logError(`Upload Error (${response.status})`, errorText);
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      logSensitiveData('Upload response received', data);
      
      // Return the list of sheet names
      return data.sheets || [];
    } catch (error) {
      logError('Error uploading file', error);
      toast.error('Erreur lors du téléchargement du fichier');
      throw error;
    }
  },
  
  /**
   * Extract data from a specific sheet in the uploaded Excel file
   * Endpoint: /extract
   */
  async extractData(file: File, sheetName: string): Promise<VehicleRecord[]> {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sheetName', sheetName);
      
      // Make the request - UploadController is mapped to root path
      // Remove leading slash to prevent duplicate '/api/' in URL
      const url = buildApiUrl('extract');
      logDebug(`Extracting data from: ${url}`);
      
      // We need to use fetch directly for file uploads as apiRequest doesn't support FormData
      const response = await fetch(url, {
        method: 'POST',
        body: formData
        // Don't set Content-Type header for multipart/form-data
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logError(`Extraction Error (${response.status})`, errorText);
        throw new Error(`Extraction failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      logSensitiveData('Extraction response received', data);
      
      // Return the extracted data
      return Array.isArray(data) ? data : [];
    } catch (error) {
      logError('Error extracting data', error);
      toast.error('Erreur lors de l\'extraction des données');
      throw error;
    }
  },
  
  /**
   * Save extracted data to the database
   * Endpoint: /save
   */
  async saveData(
    file: File, 
    sheetName: string, 
    year: string, 
    month: string = 'all', 
    replaceExisting: boolean = false,
    vehicleType?: string,  // Add explicit vehicle type parameter
    region?: string        // Add region parameter
  ): Promise<boolean> {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sheetName', sheetName);
      formData.append('year', year);
      formData.append('month', month);
      formData.append('replaceExisting', String(replaceExisting));
      
      // Add vehicleType parameter - use sheetName as fallback if not provided
      formData.append('vehicleType', vehicleType || sheetName);
      
      // Add region parameter - use default region if not provided
      formData.append('region', region || 'Default Region');
      
      // Make the request - UploadController is mapped to root path
      // Remove leading slash to prevent duplicate '/api/' in URL
      const url = buildApiUrl('save');
      logDebug(`Saving data to: ${url}`);
      
      // We need to use fetch directly for file uploads as apiRequest doesn't support FormData
      const response = await fetch(url, {
        method: 'POST',
        body: formData
        // Don't set Content-Type header for multipart/form-data
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logError(`Save Error (${response.status})`, errorText);
        toast.error(`Erreur lors de l'enregistrement des données: ${response.statusText}`);
        return false;
      }
      
      const result = await response.json();
      logSensitiveData('Save response received', result);
      
      toast.success('Données enregistrées avec succès');
      return result.success || false;
    } catch (error) {
      logError('Error saving data', error);
      toast.error(`Erreur lors de l'enregistrement des données: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  },
  
  /**
   * Get available vehicle types
   * Endpoint: /vehicles
   */
  async getVehicleTypes(): Promise<string[]> {
    try {
      const { data, error } = await apiRequest<string[]>('/vehicles');
      
      if (error) {
        logError('Error fetching vehicle types', error);
        return ['VOITURE', 'CAMION', 'CHARIOT']; // Default fallback
      }
      
      return Array.isArray(data) ? data : [];
    } catch (error) {
      logError('Error fetching vehicle types', error);
      return ['VOITURE', 'CAMION', 'CHARIOT']; // Default fallback
    }
  }
};

/**
 * File History API for handling uploaded files history
 * FileController is mapped to /files in the backend
 * So the full path is /api/files
 */
export const FileHistoryAPI = {
  /**
   * Get all uploaded file history
   * Endpoint: /api/files/history
   */
  async getUploadHistory(): Promise<UploadedFile[]> {
    try {
      const { data, error } = await apiRequest<UploadedFile[]>('/files/history');
      
      if (error) {
        logError("Error fetching upload history:", error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      logError("Error in getUploadHistory:", error);
      return [];
    }
  },

  /**
   * Get a specific file's history by ID
   * Endpoint: /api/files/{id}
   */
  async getFileById(id: string): Promise<UploadedFile | null> {
    try {
      const { data, error } = await apiRequest<UploadedFile>(`/files/${id}`);
      
      if (error) {
        logError(`Error fetching file ${id}:`, error);
        return null;
      }
      
      return data;
    } catch (error) {
      logError("Error in getFileById:", error);
      return null;
    }
  },

  /**
   * Download an uploaded file by ID
   * Endpoint: /api/files/{id}/download
   */
  async downloadFile(id: string): Promise<string | null> {
    try {
      // This is a direct download URL, not a JSON response
      const url = buildApiUrl(`/files/${id}/download`);
      
      // Return the URL to be used in a download link or window.open
      return url;
    } catch (error) {
      logError(`Error preparing download URL for file ${id}:`, error);
      return null;
    }
  },

  /**
   * Delete an uploaded file by ID
   * Endpoint: /api/files/{id}/delete
   */
  async deleteFile(id: string): Promise<boolean> {
    try {
      const { data, error } = await apiRequest<{ success: boolean }>(`/files/${id}/delete`, {
        method: 'DELETE'
      });
      
      if (error) {
        logError(`Error deleting file ${id}:`, error);
        toast.error('Erreur lors de la suppression du fichier');
        return false;
      }
      
      toast.success('Fichier supprimé avec succès');
      return data?.success || false;
    } catch (error) {
      logError("Error in deleteFile:", error);
      toast.error('Erreur lors de la suppression du fichier');
      return false;
    }
  }
};

/**
 * Reports API for handling report generation and management
 */
export const ReportsAPI = {
  /**
   * Generate a report
   * Endpoint: /api/reports/generate (internally calls `/reports/generate`)
   */
  async generateReport(params: {
    type: string;
    startDate: string;
    endDate: string;
    format?: 'pdf' | 'excel' | 'word';
  }): Promise<string | null> {
    try {
      const { data, error } = await apiRequest<string>(`/reports/generate`, {
        method: 'POST',
        body: params,
        fallbackData: null
      });
      
      if (error) {
        logError(`Error generating report`, error);
        toast.error(`Erreur lors de la génération du rapport`);
        return null;
      }
      
      toast.success(`Rapport généré avec succès`);
      return data;
    } catch (error) {
      logError("Error in generateReport:", error);
      toast.error(`Erreur lors de la génération du rapport`);
      return null;
    }
  },

  /**
   * Get all reports
   * Endpoint: /api/reports (internally calls `/reports`)
   */
  async getReports(): Promise<any[]> {
    try {
      const { data, error } = await apiRequest<any[]>(`/reports`, {
        method: 'GET',
        fallbackData: []
      });
      
      if (error) {
        logError(`Error getting reports`, error);
        toast.error(`Erreur lors de la récupération des rapports`);
        return [];
      }
      
      // Use sanitized logging for report data
      if (DEBUG && Array.isArray(data)) {
        logDebug(`Retrieved ${data.length} reports`);
      }
      
      return data || [];
    } catch (error) {
      logError("Error in getReports:", error);
      toast.error(`Erreur lors de la récupération des rapports`);
      return [];
    }
  },

  /**
   * Delete a report
   * Endpoint: /api/reports/{id} (internally calls `/reports/${id}`)
   */
  async deleteReport(id: string): Promise<boolean> {
    try {
      const { data, error } = await apiRequest<boolean>(`/reports/${id}`, {
        method: 'DELETE',
        fallbackData: false
      });
      
      if (error) {
        logError(`Error deleting report ${id}`, error);
        toast.error(`Erreur lors de la suppression du rapport`);
        return false;
      }
      
      toast.success(`Rapport supprimé avec succès`);
      return true;
    } catch (error) {
      logError("Error in deleteReport:", error);
      toast.error(`Erreur lors de la suppression du rapport`);
      return false;
    }
  },

  /**
   * Download a report
   * Endpoint: /api/reports/{id}/download (internally calls `/reports/${id}/download`)
   */
  async downloadReport(id: string): Promise<string | null> {
    try {
      const { data, error } = await apiRequest<string>(`/reports/${id}/download`, {
        method: 'GET',
        fallbackData: null
      });
      
      if (error) {
        logError(`Error downloading report ${id}`, error);
        toast.error(`Erreur lors du téléchargement du rapport`);
        return null;
      }
      
      return data;
    } catch (error) {
      logError("Error in downloadReport:", error);
      toast.error(`Erreur lors du téléchargement du rapport`);
      return null;
    }
  }
};

// Export all APIs as a single object for convenience
export const API = {
  Vehicle: VehicleAPI,
  Upload: UploadAPI,
  FileHistory: FileHistoryAPI,
  Reports: ReportsAPI,
  Regression: RegressionAPI
};
