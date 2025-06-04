import { apiRequest } from "@/lib/api"
import { ConsumptionData, ReportMetadata, ReportTemplate, VehicleData } from "@/types/report"
import { toast } from "sonner"

interface SavedReport {
  id: string
  name: string
  type: string
  format: string
  dateGenerated: string
  downloadUrl: string
}

export const ReportsAPI = {
  /**
   * Get all saved reports
   */
  async getReports(): Promise<SavedReport[]> {
    try {
      const { data, error } = await apiRequest<SavedReport[]>("/reports")

      if (error) {
        toast.error(`Erreur lors de la récupération des rapports: ${error}`)
        throw new Error(error)
      }

      return data || []
    } catch (error) {
      console.error("Error fetching reports:", error)
      return []
    }
  },

  /**
   * Generate a report with the specified options
   */
  async generateReport(params: {
    type: string
    startDate: string
    endDate: string
    format: 'pdf' | 'excel' | 'word'
    consumption?: ConsumptionData[]
    vehicles?: VehicleData[]
  } & {
    [key: string]: any  // Allow additional properties
  }): Promise<string | undefined> {
    try {
      const { data, error } = await apiRequest<string>("/reports/generate", {
        method: "POST",
        body: params
      })

      if (error) {
        toast.error(`Erreur lors de la génération du rapport: ${error}`)
        throw new Error(error)
      }

      return data!
    } catch (error) {
      console.error("Error generating report:", error)
      throw error
    }
  },

  /**
   * Save report metadata after generation
   */
  async saveReportMetadata(metadata: ReportMetadata): Promise<void> {
    try {
      const { error } = await apiRequest<void>("/reports/metadata", {
        method: "POST",
        body: metadata
      })

      if (error) {
        toast.error(`Erreur lors de l'enregistrement des métadonnées: ${error}`)
        throw new Error(error)
      }
    } catch (error) {
      console.error("Error saving report metadata:", error)
      throw error
    }
  },

  /**
   * Get all report templates
   */
  async getTemplates(): Promise<ReportTemplate[]> {
    try {
      const { data, error } = await apiRequest<ReportTemplate[]>("/reports/templates")

      if (error) {
        toast.error(`Erreur lors de la récupération des modèles: ${error}`)
        throw new Error(error)
      }

      return data || []
    } catch (error) {
      console.error("Error fetching templates:", error)
      return []
    }
  },

  /**
   * Get a specific template by ID
   */
  async getTemplate(id: string): Promise<ReportTemplate | null> {
    try {
      const { data, error } = await apiRequest<ReportTemplate>(`/reports/templates/${id}`)

      if (error) {
        toast.error(`Erreur lors de la récupération du modèle: ${error}`)
        throw new Error(error)
      }

      return data
    } catch (error) {
      console.error("Error fetching template:", error)
      return null
    }
  },

  /**
   * Save or update a template
   */
  async saveTemplate(template: ReportTemplate): Promise<ReportTemplate> {
    try {
      const { data, error } = await apiRequest<ReportTemplate>("/reports/templates", {
        method: template.id ? "PUT" : "POST",
        body: template
      })

      if (error) {
        toast.error(`Erreur lors de l'enregistrement du modèle: ${error}`)
        throw new Error(error)
      }

      return data!
    } catch (error) {
      console.error("Error saving template:", error)
      throw error
    }
  },

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      const { error } = await apiRequest<void>(`/reports/templates/${id}`, {
        method: "DELETE"
      })

      if (error) {
        toast.error(`Erreur lors de la suppression du modèle: ${error}`)
        throw new Error(error)
      }
    } catch (error) {
      console.error("Error deleting template:", error)
      throw error
    }
  }
}
