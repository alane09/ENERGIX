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

// API Services
export const api = {
  // Vehicle Records API
  vehicles: {
    getAll: async (params?: {
      type?: string;
      mois?: string;
      matricule?: string;
      year?: string;
    }): Promise<VehicleRecord[]> => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/records`, { params });
      return response.data;
    },

    getById: async (id: string): Promise<VehicleRecord> => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/records/${id}`);
      return response.data;
    },

    create: async (record: VehicleRecord): Promise<VehicleRecord> => {
      const response = await axios.post(`${NORMALIZED_BASE_URL}/api/records`, record);
      return response.data;
    },

    update: async (id: string, record: VehicleRecord): Promise<VehicleRecord> => {
      const response = await axios.put(`${NORMALIZED_BASE_URL}/api/records/${id}`, record);
      return response.data;
    },

    delete: async (id: string): Promise<void> => {
      await axios.delete(`${NORMALIZED_BASE_URL}/api/records/${id}`);
    }
  },

  // File Upload and Management API
  files: {
    upload: async (file: File, vehicleType: string, year: number): Promise<FileDocument> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('vehicleType', vehicleType);
      formData.append('year', year.toString());

      const response = await axios.post(`${NORMALIZED_BASE_URL}/api/files/upload`, formData);
      return response.data;
    },

    getHistory: async (): Promise<FileDocument[]> => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/files/history`);
      return response.data;
    },

    getById: async (id: string): Promise<FileDocument> => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/files/${id}`);
      return response.data;
    },

    download: async (id: string): Promise<Blob> => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/files/${id}/download`, {
        responseType: 'blob'
      });
      return response.data;
    },

    delete: async (id: string): Promise<{ success: boolean }> => {
      const response = await axios.delete(`${NORMALIZED_BASE_URL}/api/files/${id}/delete`);
      return response.data;
    }
  },

  // Notifications API
  notifications: {
    getAll: async (): Promise<Notification[]> => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/notifications`);
      return response.data;
    },

    getUnread: async (): Promise<Notification[]> => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/notifications/unread`);
      return response.data;
    },

    getUnreadCount: async (): Promise<number> => {
      const response = await axios.get(`${NORMALIZED_BASE_URL}/api/notifications/unread/count`);
      return response.data;
    },

    markAsRead: async (id: string): Promise<Notification> => {
      const response = await axios.put(`${NORMALIZED_BASE_URL}/api/notifications/${id}/read`);
      return response.data;
    },

    markAllAsRead: async (): Promise<void> => {
      await axios.put(`${NORMALIZED_BASE_URL}/api/notifications/read/all`);
    },

    delete: async (id: string): Promise<void> => {
      await axios.delete(`${NORMALIZED_BASE_URL}/api/notifications/${id}`);
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
