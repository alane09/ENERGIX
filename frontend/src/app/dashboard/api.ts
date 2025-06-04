import { RegressionAPI } from "@/lib/api"

export const API = {
  ...RegressionAPI,
  
  // Add dashboard-specific API methods here
  getDashboardData: async () => {
    const response = await fetch('/api/dashboard')
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data')
    }
    return response.json()
  },

  getVehicleTypes: async () => {
    const response = await fetch('/api/vehicles/types')
    if (!response.ok) {
      throw new Error('Failed to fetch vehicle types')
    }
    return response.json()
  }
}
