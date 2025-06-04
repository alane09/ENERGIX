import axios from 'axios';

// Define the base URL for API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Ensure the base URL doesn't have a trailing slash
const normalizedBaseUrl = API_BASE_URL.endsWith('/')
  ? API_BASE_URL.slice(0, -1)
  : API_BASE_URL;

// Report generation parameters interface
export interface ReportParams {
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
  content?: string;
}

// Report template interface
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  content?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// AI Analysis interface
export interface AIAnalysis {
  summary: string;
  insights: string[];
  recommendations: string[];
  metrics: Record<string, any>;
  trends: Record<string, any>;
  anomalies: Record<string, any>;
}

// Reports API service
export const ReportsAPI = {
  /**
   * Generate a report based on the provided parameters
   * @param params Report generation parameters
   * @returns Report ID
   */
  async generateReport(params: ReportParams): Promise<string> {
    try {
      // Ensure format is set
      if (!params.options.format) {
        params.options.format = 'PDF';
      }
      
      // Ensure branding settings are applied
      if (params.options.includeBranding !== false) {
        params.options.includeBranding = true;
      }
      
      const response = await axios.post(`${normalizedBaseUrl}/api/reports/generate`, params);
      return response.data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  },

  /**
   * Get all saved reports
   * @returns List of saved reports
   */
  async getReports(): Promise<any[]> {
    try {
      const response = await axios.get(`${normalizedBaseUrl}/api/reports`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },

  /**
   * Download a report by ID
   * @param id Report ID
   * @returns Download URL
   */
  async downloadReport(id: string): Promise<string> {
    try {
      const response = await axios.get(`${normalizedBaseUrl}/api/reports/${id}/download`);
      return response.data;
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  },

  /**
   * Delete a report by ID
   * @param id Report ID
   */
  async deleteReport(id: string): Promise<void> {
    try {
      await axios.delete(`${normalizedBaseUrl}/api/reports/${id}`);
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  },

  /**
   * Generate a preview of a report
   * @param params Report generation parameters
   * @returns Preview content as a Blob
   */
  async generatePreview(params: ReportParams): Promise<Blob> {
    try {
      const response = await axios.post(`${normalizedBaseUrl}/api/reports/preview`, params, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error generating preview:', error);
      throw error;
    }
  },

  /**
   * Get all available report templates
   * @returns List of templates
   */
  async getTemplates(): Promise<ReportTemplate[]> {
    try {
      const response = await axios.get(`${normalizedBaseUrl}/api/reports/templates`);
      return response.data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  },

  /**
   * Get a specific template by ID
   * @param id Template ID
   * @returns Template details
   */
  async getTemplate(id: string): Promise<ReportTemplate> {
    try {
      const response = await axios.get(`${normalizedBaseUrl}/api/reports/templates/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching template:', error);
      throw error;
    }
  },

  /**
   * Save a template
   * @param template Template to save
   * @returns Saved template
   */
  async saveTemplate(template: Partial<ReportTemplate>): Promise<ReportTemplate> {
    try {
      const response = await axios.post(`${normalizedBaseUrl}/api/reports/templates`, template);
      return response.data;
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  },

  /**
   * Delete a template
   * @param id Template ID
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      await axios.delete(`${normalizedBaseUrl}/api/reports/templates/${id}`);
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },

  /**
   * Generate AI analysis for report data
   * @param data Data to analyze
   * @returns AI-generated analysis
   */
  async generateAiAnalysis(data: any): Promise<AIAnalysis> {
    try {
      const response = await axios.post(`${normalizedBaseUrl}/api/reports/ai/analyze`, data);
      return response.data;
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      throw error;
    }
  },

  /**
   * Export a report to a specific format
   * @param params Report parameters
   * @param format Export format
   * @returns Exported file as a Blob
   */
  async exportReport(params: ReportParams, format: 'PDF' | 'DOCX' | 'XLSX'): Promise<Blob> {
    try {
      // Set the format in the options
      params.options.format = format;
      
      const response = await axios.post(`${normalizedBaseUrl}/api/reports/export`, params, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Error exporting report as ${format}:`, error);
      throw error;
    }
  }
};
