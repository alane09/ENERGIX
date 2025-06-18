/**
 * Complete API service for the COFICAB ENERGIX Dashboard
 * Handles all backend integrations and CRUD operations
 * 
 * This file provides a comprehensive API client that covers all endpoints
 * from the Spring Boot backend including:
 * - Vehicle Records Management
 * - Regression Analysis
 * - File Upload and Processing
 * - Notifications
 * - Reports Generation
 * 
 * Usage:
 * import { api } from '@/lib/api/complete-api';
 * 
 * // Get all vehicle records
 * const records = await api.vehicles.getAll();
 * 
 * // Upload and process file
 * const sheets = await api.upload.processFile(file);
 * 
 * // Generate regression analysis
 * const result = await api.regression.analyze({ vehicleType: 'CAMION', year: '2025' });
 */

import axios, { AxiosResponse } from 'axios';

// Base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const NORMALIZED_BASE_URL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

// Toast notification helper (optional, can be replaced with your preferred notification system)
const showToast = {
  success: (message: string) => console.log(`✅ ${message}`),
  error: (message: string) => console.error(`❌ ${message}`),
  warning: (message: string) => console.warn(`⚠️ ${message}`)
};

// Try to import toast if available
try {
  if (typeof window !== 'undefined') {
    // Dynamic import for client-side only
    import('sonner').then(({ toast }) => {
      showToast.success = toast.success;
      showToast.error = toast.error;
      showToast.warning = toast.warning;
    }).catch(() => {
      // Use console fallback
    });
  }
} catch {
  // Use console fallback
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface VehicleRecord {
  id?: string;
  type: string;
  matricule: string;
  mois: string;
  year: string;
  region?: string;
  consommationL: number;
  consommationTEP: number;
  coutDT: number;
  kilometrage: number;
  produitsTonnes: number;
  ipeL100km: number;
  ipeL100TonneKm: number;
  ipeSerL100km?: number;
  ipeSerL100TonneKm?: number;
  predictedIpe?: number;
  rawValues?: Record<string, number | string>;
}

export interface RegressionResult {
  id?: string;
  type: string;
  vehicleType?: string;
  year?: string;
  region?: string;
  regressionEquation: string;
  coefficients: {
    kilometrage: number;
    tonnage: number;
  };
  intercept: number;
  rSquared: number;
  adjustedRSquared: number;
  mse: number;
  warnings?: string[];
  hasOutliers?: boolean;
  hasMulticollinearity?: boolean;
  monthlyData?: MonthlyData[];
}

export interface MonthlyData {
  month: string;
  year: string;
  consommation: number;
  kilometrage: number;
  tonnage: number;
  ipe: number;
}

export interface FileDocument {
  id: string;
  filename: string;
  contentType: string;
  uploadDate: Date;
  vehicleType: string;
  year: number;
  size: number;
  processed: boolean;
  recordCount?: number;
  availableSheets?: string[];
  metadata?: Record<string, string | number | boolean>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'ANOMALY' | 'WARNING' | 'INFO';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  read: boolean;
  vehicleId?: string;
  vehicleType?: string;
  region?: string;
  year?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface ReportRequest {
  type: string;
  vehicleType: string;
  startDate: string;
  endDate: string;
  options: {
    format: 'PDF' | 'DOCX' | 'XLSX';
    includeCharts?: boolean;
    includeRawData?: boolean;
    includeAiAnalysis?: boolean;
    includeBranding?: boolean;
    title?: string;
    templateId?: string;
  };
}

export interface UploadResponse {
  sheets: string[];
  message?: string;
}

export interface SaveDataResponse {
  success: boolean;
  message: string;
  recordCount?: number;
  fileId?: string;
}

export interface AnomalyResponse {
  anomaliesFound: number;
  message: string;
}

// ============================================================================
// API CLIENT
// ============================================================================

export const api = {
  // ========================================================================
  // VEHICLE RECORDS API (/api/records)
  // ========================================================================
  vehicles: {
    /**
     * Get all vehicle records with optional filtering
     * GET /api/records
     */
    getAll: async (params?: {
      type?: string;
      mois?: string;
      matricule?: string;
      year?: string;
    }): Promise<VehicleRecord[]> => {
      try {
        const response: AxiosResponse<VehicleRecord[]> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/records`, 
          { params }
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to fetch vehicle records');
        throw error;
      }
    },

    /**
     * Get vehicle record by ID
     * GET /api/records/{id}
     */
    getById: async (id: string): Promise<VehicleRecord> => {
      try {
        const response: AxiosResponse<VehicleRecord> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/records/${id}`
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to fetch vehicle record');
        throw error;
      }
    },

    /**
     * Create new vehicle record
     * POST /api/records
     */
    create: async (record: VehicleRecord): Promise<VehicleRecord> => {
      try {
        const response: AxiosResponse<VehicleRecord> = await axios.post(
          `${NORMALIZED_BASE_URL}/api/records`, 
          record
        );
        showToast.success('Vehicle record created successfully');
        return response.data;
      } catch (error) {
        showToast.error('Failed to create vehicle record');
        throw error;
      }
    },

    /**
     * Update vehicle record
     * PUT /api/records/{id}
     */
    update: async (id: string, record: VehicleRecord): Promise<VehicleRecord> => {
      try {
        const response: AxiosResponse<VehicleRecord> = await axios.put(
          `${NORMALIZED_BASE_URL}/api/records/${id}`, 
          record
        );
        showToast.success('Vehicle record updated successfully');
        return response.data;
      } catch (error) {
        showToast.error('Failed to update vehicle record');
        throw error;
      }
    },

    /**
     * Partially update vehicle record
     * PATCH /api/records/{id}
     */
    partialUpdate: async (id: string, record: Partial<VehicleRecord>): Promise<VehicleRecord> => {
      try {
        const response: AxiosResponse<VehicleRecord> = await axios.patch(
          `${NORMALIZED_BASE_URL}/api/records/${id}`, 
          record
        );
        showToast.success('Vehicle record updated successfully');
        return response.data;
      } catch (error) {
        showToast.error('Failed to update vehicle record');
        throw error;
      }
    },

    /**
     * Delete vehicle record
     * DELETE /api/records/{id}
     */
    delete: async (id: string): Promise<void> => {
      try {
        await axios.delete(`${NORMALIZED_BASE_URL}/api/records/${id}`);
        showToast.success('Vehicle record deleted successfully');
      } catch (error) {
        showToast.error('Failed to delete vehicle record');
        throw error;
      }
    },

    /**
     * Get monthly aggregation data
     * GET /api/records/monthly-aggregation
     */
    getMonthlyAggregation: async (params?: {
      vehicleType?: string;
      year?: string;
      dateFrom?: string;
      dateTo?: string;
    }): Promise<Record<string, unknown>[]> => {
      try {
        const response: AxiosResponse<Record<string, unknown>[]> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/records/monthly-aggregation`, 
          { params }
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to fetch monthly aggregation data');
        throw error;
      }
    },

    /**
     * Get performance data
     * GET /api/records/performance
     */
    getPerformance: async (type: string, includeSheetData: boolean = false): Promise<Record<string, unknown>[]> => {
      try {
        const response: AxiosResponse<Record<string, unknown>[]> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/records/performance`, 
          { params: { type, includeSheetData } }
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to fetch performance data');
        throw error;
      }
    },

    /**
     * Scan for anomalies
     * POST /api/records/scan-anomalies
     */
    scanAnomalies: async (): Promise<AnomalyResponse> => {
      try {
        const response: AxiosResponse<AnomalyResponse> = await axios.post(
          `${NORMALIZED_BASE_URL}/api/records/scan-anomalies`
        );
        showToast.success(`Anomaly scan completed: ${response.data.message}`);
        return response.data;
      } catch (error) {
        showToast.error('Failed to scan for anomalies');
        throw error;
      }
    },

    /**
     * Get anomalous records
     * GET /api/records/anomalies
     */
    getAnomalies: async (): Promise<VehicleRecord[]> => {
      try {
        const response: AxiosResponse<VehicleRecord[]> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/records/anomalies`
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to fetch anomalous records');
        throw error;
      }
    },

    /**
     * Get anomaly count
     * GET /api/records/anomalies/count
     */
    getAnomalyCount: async (): Promise<{ count: number }> => {
      try {
        const response: AxiosResponse<{ count: number }> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/records/anomalies/count`
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to fetch anomaly count');
        throw error;
      }
    }
  },

  // ========================================================================
  // REGRESSION ANALYSIS API (/api/regression)
  // ========================================================================
  regression: {
    /**
     * Search regression results
     * GET /api/regression/search
     */
    search: async (params: { 
      type: string; 
      year: string; 
      region?: string; 
    }): Promise<RegressionResult> => {
      try {
        const response: AxiosResponse<RegressionResult> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/regression/search`, 
          { params }
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to search regression results');
        throw error;
      }
    },

    /**
     * Get all regression results
     * GET /api/regression
     */
    getAll: async (): Promise<RegressionResult[]> => {
      try {
        const response: AxiosResponse<RegressionResult[]> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/regression`
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to fetch regression results');
        throw error;
      }
    },

    /**
     * Get regression result by ID
     * GET /api/regression/{id}
     */
    getById: async (id: string): Promise<RegressionResult> => {
      try {
        const response: AxiosResponse<RegressionResult> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/regression/${id}`
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to fetch regression result');
        throw error;
      }
    },

    /**
     * Get monthly data for regression
     * GET /api/regression/monthly-data
     */
    getMonthlyData: async (params: { 
      vehicleType: string; 
      year: string; 
      region?: string; 
    }): Promise<MonthlyData[]> => {
      try {
        const response: AxiosResponse<MonthlyData[]> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/regression/monthly-data`, 
          { params }
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to fetch monthly data');
        throw error;
      }
    },

    /**
     * Perform regression analysis
     * POST /api/regression/analyze
     */
    analyze: async (params: { 
      vehicleType: string; 
      year: string; 
      region?: string; 
    }): Promise<RegressionResult> => {
      try {
        const response: AxiosResponse<RegressionResult> = await axios.post(
          `${NORMALIZED_BASE_URL}/api/regression/analyze`, 
          null, 
          { params }
        );
        showToast.success('Regression analysis completed successfully');
        return response.data;
      } catch (error) {
        showToast.error('Failed to perform regression analysis');
        throw error;
      }
    },

    /**
     * Update regression result
     * PUT /api/regression/{id}
     */
    update: async (id: string, result: RegressionResult): Promise<RegressionResult> => {
      try {
        const response: AxiosResponse<RegressionResult> = await axios.put(
          `${NORMALIZED_BASE_URL}/api/regression/${id}`, 
          result
        );
        showToast.success('Regression result updated successfully');
        return response.data;
      } catch (error) {
        showToast.error('Failed to update regression result');
        throw error;
      }
    },

    /**
     * Delete regression result
     * DELETE /api/regression/{id}
     */
    delete: async (id: string): Promise<void> => {
      try {
        await axios.delete(`${NORMALIZED_BASE_URL}/api/regression/${id}`);
        showToast.success('Regression result deleted successfully');
      } catch (error) {
        showToast.error('Failed to delete regression result');
        throw error;
      }
    },

    /**
     * Generate sample regression data
     * POST /api/regression/generate-sample
     */
    generateSample: async (): Promise<RegressionResult[]> => {
      try {
        const response: AxiosResponse<RegressionResult[]> = await axios.post(
          `${NORMALIZED_BASE_URL}/api/regression/generate-sample`
        );
        showToast.success('Sample regression data generated successfully');
        return response.data;
      } catch (error) {
        showToast.error('Failed to generate sample regression data');
        throw error;
      }
    }
  },

  // ========================================================================
  // FILE MANAGEMENT API (/api/files)
  // ========================================================================
  files: {
    /**
     * Upload file
     * POST /api/files/upload
     */
    upload: async (file: File, vehicleType: string, year: number): Promise<FileDocument> => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('vehicleType', vehicleType);
        formData.append('year', year.toString());

        const response: AxiosResponse<FileDocument> = await axios.post(
          `${NORMALIZED_BASE_URL}/api/files/upload`, 
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        showToast.success('File uploaded successfully');
        return response.data;
      } catch (error) {
        showToast.error('Failed to upload file');
        throw error;
      }
    },

    /**
     * Get file upload history
     * GET /api/files/history
     */
    getHistory: async (): Promise<FileDocument[]> => {
      try {
        const response: AxiosResponse<FileDocument[]> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/files/history`
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to fetch file history');
        throw error;
      }
    },

    /**
     * Get file by ID
     * GET /api/files/{id}
     */
    getById: async (id: string): Promise<FileDocument> => {
      try {
        const response: AxiosResponse<FileDocument> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/files/${id}`
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to fetch file');
        throw error;
      }
    },

    /**
     * Download file
     * GET /api/files/{id}/download
     */
    download: async (id: string): Promise<Blob> => {
      try {
        const response: AxiosResponse<Blob> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/files/${id}/download`, 
          { responseType: 'blob' }
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to download file');
        throw error;
      }
    },

    /**
     * Delete file
     * DELETE /api/files/{id}/delete
     */
    delete: async (id: string): Promise<{ success: boolean }> => {
      try {
        const response: AxiosResponse<{ success: boolean }> = await axios.delete(
          `${NORMALIZED_BASE_URL}/api/files/${id}/delete`
        );
        showToast.success('File deleted successfully');
        return response.data;
      } catch (error) {
        showToast.error('Failed to delete file');
        throw error;
      }
    },

    /**
     * Get files by vehicle type
     * GET /api/files/by-vehicle/{vehicleType}
     */
    getByVehicleType: async (vehicleType: string): Promise<FileDocument[]> => {
      try {
        const response: AxiosResponse<FileDocument[]> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/files/by-vehicle/${vehicleType}`
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to fetch files by vehicle type');
        throw error;
      }
    },

    /**
     * Get files by year
     * GET /api/files/by-year/{year}
     */
    getByYear: async (year: number): Promise<FileDocument[]> => {
      try {
        const response: AxiosResponse<FileDocument[]> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/files/by-year/${year}`
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to fetch files by year');
        throw error;
      }
    }
  },

  // ========================================================================
  // DATA UPLOAD AND PROCESSING API (/api/)
  // ========================================================================
  upload: {
    /**
     * Upload and process Excel file
     * POST /api/upload
     */
    processFile: async (file: File): Promise<UploadResponse> => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response: AxiosResponse<UploadResponse> = await axios.post(
          `${NORMALIZED_BASE_URL}/api/upload`, 
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        showToast.success('File processed successfully');
        return response.data;
      } catch (error) {
        showToast.error('Failed to process file');
        throw error;
      }
    },

    /**
     * Extract data from specific sheet
     * POST /api/extract
     */
    extractData: async (file: File, sheetName: string): Promise<VehicleRecord[]> => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sheetName', sheetName);

        const response: AxiosResponse<VehicleRecord[]> = await axios.post(
          `${NORMALIZED_BASE_URL}/api/extract`, 
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        showToast.success('Data extracted successfully');
        return response.data;
      } catch (error) {
        showToast.error('Failed to extract data');
        throw error;
      }
    },

    /**
     * Save extracted data to database
     * POST /api/save
     */
    saveData: async (params: {
      file: File;
      sheetName: string;
      year: string;
      month?: string;
      replaceExisting?: boolean;
      region: string;
      vehicleType: string;
    }): Promise<SaveDataResponse> => {
      try {
        const formData = new FormData();
        formData.append('file', params.file);
        formData.append('sheetName', params.sheetName);
        formData.append('year', params.year);
        formData.append('month', params.month || 'all');
        formData.append('replaceExisting', String(params.replaceExisting || false));
        formData.append('region', params.region);
        formData.append('vehicleType', params.vehicleType);

        const response: AxiosResponse<SaveDataResponse> = await axios.post(
          `${NORMALIZED_BASE_URL}/api/save`, 
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        showToast.success('Data saved successfully');
        return response.data;
      } catch (error) {
        showToast.error('Failed to save data');
        throw error;
      }
    },

    /**
     * Get available vehicle types
     * GET /api/vehicles
     */
    getVehicleTypes: async (): Promise<{ types: string[] }> => {
      try {
        const response: AxiosResponse<{ types: string[] }> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/vehicles`
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to fetch vehicle types');
        throw error;
      }
    }
  },

  // ========================================================================
  // NOTIFICATIONS API (/api/notifications)
  // ========================================================================
  notifications: {
    /**
     * Get all notifications
     * GET /api/notifications
     */
    getAll: async (): Promise<Notification[]> => {
      try {
        const response: AxiosResponse<Notification[]> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/notifications`
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to fetch notifications');
        throw error;
      }
    },

    /**
     * Get unread notifications
     * GET /api/notifications/unread
     */
    getUnread: async (): Promise<Notification[]> => {
      try {
        const response: AxiosResponse<Notification[]> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/notifications/unread`
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to fetch unread notifications');
        throw error;
      }
    },

    /**
     * Get unread notification count
     * GET /api/notifications/unread/count
     */
    getUnreadCount: async (): Promise<number> => {
      try {
        const response: AxiosResponse<number> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/notifications/unread/count`
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to fetch unread count');
        throw error;
      }
    },

    /**
     * Mark notification as read
     * PUT /api/notifications/{id}/read
     */
    markAsRead: async (id: string): Promise<Notification> => {
      try {
        const response: AxiosResponse<Notification> = await axios.put(
          `${NORMALIZED_BASE_URL}/api/notifications/${id}/read`
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to mark notification as read');
        throw error;
      }
    },

    /**
     * Mark all notifications as read
     * PUT /api/notifications/read/all
     */
    markAllAsRead: async (): Promise<void> => {
      try {
        await axios.put(`${NORMALIZED_BASE_URL}/api/notifications/read/all`);
        showToast.success('All notifications marked as read');
      } catch (error) {
        showToast.error('Failed to mark all notifications as read');
        throw error;
      }
    },

    /**
     * Delete notification
     * DELETE /api/notifications/{id}
     */
    delete: async (id: string): Promise<void> => {
      try {
        await axios.delete(`${NORMALIZED_BASE_URL}/api/notifications/${id}`);
        showToast.success('Notification deleted successfully');
      } catch (error) {
        showToast.error('Failed to delete notification');
        throw error;
      }
    },

    /**
     * Get notifications by vehicle
     * GET /api/notifications/vehicle/{vehicleId}
     */
    getByVehicle: async (vehicleId: string): Promise<Notification[]> => {
      try {
        const response: AxiosResponse<Notification[]> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/notifications/vehicle/${vehicleId}`
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to fetch notifications by vehicle');
        throw error;
      }
    },

    /**
     * Get notifications by type
     * GET /api/notifications/type/{type}
     */
    getByType: async (type: 'ANOMALY' | 'WARNING' | 'INFO'): Promise<Notification[]> => {
      try {
        const response: AxiosResponse<Notification[]> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/notifications/type/${type}`
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to fetch notifications by type');
        throw error;
      }
    },

    /**
     * Create notification
     * POST /api/notifications
     */
    create: async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<Notification> => {
      try {
        const response: AxiosResponse<Notification> = await axios.post(
          `${NORMALIZED_BASE_URL}/api/notifications`, 
          notification
        );
        showToast.success('Notification created successfully');
        return response.data;
      } catch (error) {
        showToast.error('Failed to create notification');
        throw error;
      }
    }
  },

  // ========================================================================
  // REPORTS API (/api/reports)
  // ========================================================================
  reports: {
    /**
     * Generate report
     * POST /api/reports/generate
     */
    generate: async (request: ReportRequest): Promise<string> => {
      try {
        const response: AxiosResponse<string> = await axios.post(
          `${NORMALIZED_BASE_URL}/api/reports/generate`, 
          request
        );
        showToast.success('Report generated successfully');
        return response.data;
      } catch (error) {
        showToast.error('Failed to generate report');
        throw error;
      }
    },

    /**
     * Get all reports
     * GET /api/reports
     */
    getAll: async (): Promise<Record<string, unknown>[]> => {
      try {
        const response: AxiosResponse<Record<string, unknown>[]> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/reports`
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to fetch reports');
        throw error;
      }
    },

    /**
     * Delete report
     * DELETE /api/reports/{id}
     */
    delete: async (id: string): Promise<void> => {
      try {
        await axios.delete(`${NORMALIZED_BASE_URL}/api/reports/${id}`);
        showToast.success('Report deleted successfully');
      } catch (error) {
        showToast.error('Failed to delete report');
        throw error;
      }
    },

    /**
     * Download report
     * GET /api/reports/{id}/download
     */
    download: async (id: string): Promise<string> => {
      try {
        const response: AxiosResponse<string> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/reports/${id}/download`
        );
        return response.data;
      } catch (error) {
        showToast.error('Failed to download report');
        throw error;
      }
    },

    /**
     * Export regression results
     * GET /api/reports/regression/export
     */
    exportRegression: async (): Promise<Blob> => {
      try {
        const response: AxiosResponse<Blob> = await axios.get(
          `${NORMALIZED_BASE_URL}/api/reports/regression/export`, 
          { responseType: 'blob' }
        );
        showToast.success('Regression results exported successfully');
        return response.data;
      } catch (error) {
        showToast.error('Failed to export regression results');
        throw error;
      }
    }
  }
};

// ============================================================================
// AXIOS INTERCEPTORS
// ============================================================================

// Request interceptor
axios.interceptors.request.use(
  (config) => {
    // Add any common headers or authentication tokens here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    showToast.error(message);
    return Promise.reject(error);
  }
);

export default api;
