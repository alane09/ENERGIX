import axios from 'axios';
import { toast } from 'sonner';

// Base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const NORMALIZED_BASE_URL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

// Types
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
  monthlyData?: Array<{
    month: string;
    year: string;
    consommation: number;
    kilometrage: number;
    tonnage: number;
    ipe: number;
  }>;
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
  metadata?: Record<string, any>;
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
  metadata?: Record<string, any>;
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

// API Services
export const api = {
  // Vehicle Records API
  vehicles: {
    getAll: async (params?: {
      type?: string;
      mois?: string;
      matricule?: string;
      year?: string;
    }) => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/records`, { params });
      return response.data;
    },

    getById: async (id: string) => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/records/${id}`);
      return response.data;
    },

    create: async (record: VehicleRecord) => {
      const response = await axios.post(`${NORMALIZED_BASE_URL}/api/records`, record);
      return response.data;
    },

    update: async (id: string, record: VehicleRecord) => {
      const response = await axios.put(`${NORMALIZED_BASE_URL}/api/records/${id}`, record);
      return response.data;
    },

    delete: async (id: string) => {
      await axios.delete(`${NORMALIZED_BASE_URL}/api/records/${id}`);
    },

    getMonthlyAggregation: async (params?: {
      vehicleType?: string;
      year?: string;
      dateFrom?: string;
      dateTo?: string;
    }) => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/records/monthly-aggregation`, { params });
      return response.data;
    },

    getPerformance: async (type: string, includeSheetData: boolean = false) => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/records/performance`, {
        params: { type, includeSheetData }
      });
      return response.data;
    },

    scanAnomalies: async () => {
      const response = await axios.post(`${NORMALIZED_BASE_URL}/api/records/scan-anomalies`);
      return response.data;
    },

    getAnomalies: async () => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/records/anomalies`);
      return response.data;
    }
  },

  // Regression Analysis API
  regression: {
    search: async (params: { type: string; year: string; region?: string }) => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/regression/search`, { params });
      return response.data;
    },

    getAll: async () => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/regression`);
      return response.data;
    },

    getById: async (id: string) => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/regression/${id}`);
      return response.data;
    },

    getMonthlyData: async (params: { vehicleType: string; year: string; region?: string }) => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/regression/monthly-data`, { params });
      return response.data;
    },

    analyze: async (params: { vehicleType: string; year: string; region?: string }) => {
      const response = await axios.post(`${NORMALIZED_BASE_URL}/api/regression/analyze`, null, { params });
      return response.data;
    },

    update: async (id: string, result: RegressionResult) => {
      const response = await axios.put(`${NORMALIZED_BASE_URL}/api/regression/${id}`, result);
      return response.data;
    },

    delete: async (id: string) => {
      await axios.delete(`${NORMALIZED_BASE_URL}/api/regression/${id}`);
    }
  },

  // File Upload and Management API
  files: {
    upload: async (file: File, vehicleType: string, year: number) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('vehicleType', vehicleType);
      formData.append('year', year.toString());

      const response = await axios.post(`${NORMALIZED_BASE_URL}/api/files/upload`, formData);
      return response.data;
    },

    getHistory: async () => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/files/history`);
      return response.data;
    },

    getById: async (id: string) => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/files/${id}`);
      return response.data;
    },

    download: async (id: string) => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/files/${id}/download`, {
        responseType: 'blob'
      });
      return response.data;
    },

    delete: async (id: string) => {
      const response = await axios.delete(`${NORMALIZED_BASE_URL}/api/files/${id}/delete`);
      return response.data;
    },

    getByVehicleType: async (vehicleType: string) => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/files/by-vehicle/${vehicleType}`);
      return response.data;
    },

    getByYear: async (year: number) => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/files/by-year/${year}`);
      return response.data;
    }
  },

  // Data Upload and Processing API
  upload: {
    processFile: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(`${NORMALIZED_BASE_URL}/api/upload`, formData);
      return response.data;
    },

    extractData: async (file: File, sheetName: string) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sheetName', sheetName);
      const response = await axios.post(`${NORMALIZED_BASE_URL}/api/extract`, formData);
      return response.data;
    },

    saveData: async (params: {
      file: File;
      sheetName: string;
      year: string;
      month?: string;
      replaceExisting?: boolean;
      region: string;
      vehicleType: string;
    }) => {
      const formData = new FormData();
      formData.append('file', params.file);
      formData.append('sheetName', params.sheetName);
      formData.append('year', params.year);
      formData.append('month', params.month || 'all');
      formData.append('replaceExisting', String(params.replaceExisting || false));
      formData.append('region', params.region);
      formData.append('vehicleType', params.vehicleType);

      const response = await axios.post(`${NORMALIZED_BASE_URL}/api/save`, formData);
      return response.data;
    },

    getVehicleTypes: async () => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/vehicles`);
      return response.data;
    }
  },

  // Notifications API
  notifications: {
    getAll: async () => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/notifications`);
      return response.data;
    },

    getUnread: async () => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/notifications/unread`);
      return response.data;
    },

    getUnreadCount: async () => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/notifications/unread/count`);
      return response.data;
    },

    markAsRead: async (id: string) => {
      const response = await axios.put(`${NORMALIZED_BASE_URL}/api/notifications/${id}/read`);
      return response.data;
    },

    markAllAsRead: async () => {
      await axios.put(`${NORMALIZED_BASE_URL}/api/notifications/read/all`);
    },

    delete: async (id: string) => {
      await axios.delete(`${NORMALIZED_BASE_URL}/api/notifications/${id}`);
    },

    getByVehicle: async (vehicleId: string) => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/notifications/vehicle/${vehicleId}`);
      return response.data;
    },

    getByType: async (type: 'ANOMALY' | 'WARNING' | 'INFO') => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/notifications/type/${type}`);
      return response.data;
    },

    create: async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const response = await axios.post(`${NORMALIZED_BASE_URL}/api/notifications`, notification);
      return response.data;
    }
  },

  // Reports API
  reports: {
    generate: async (request: ReportRequest) => {
      const response = await axios.post(`${NORMALIZED_BASE_URL}/api/reports/generate`, request);
      return response.data;
    },

    getAll: async () => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/reports`);
      return response.data;
    },

    delete: async (id: string) => {
      await axios.delete(`${NORMALIZED_BASE_URL}/api/reports/${id}`);
    },

    download: async (id: string) => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/reports/${id}/download`, {
        responseType: 'blob'
      });
      return response.data;
    },

    exportRegression: async () => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/reports/regression/export`, {
        responseType: 'blob'
      });
      return response.data;
    }
  }
};

// Error handling interceptor
axios.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    toast.error(message);
    return Promise.reject(error);
  }
);

export default api;
