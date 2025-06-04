import { API_BASE_URL } from "@/config";
import { MonthlyData, RegressionResult } from "../types";

type VehicleType = "VOITURE" | "CAMION";

export const regressionAPI = {
  getMonthlyData: async (vehicleType: VehicleType, year: string, region?: string): Promise<MonthlyData[]> => {
    const params = new URLSearchParams({
      vehicleType,
      year,
      ...(region && { region })
    });
    
    const response = await fetch(
      `${API_BASE_URL}/api/regression/monthly-data?${params.toString()}`
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch monthly data");
    }
    
    return response.json();
  },

  analyzeAndSave: async (vehicleType: VehicleType, year: string, region?: string): Promise<RegressionResult> => {
    const params = new URLSearchParams({
      vehicleType,
      year,
      ...(region && { region })
    });

    const response = await fetch(
      `${API_BASE_URL}/api/regression/analyze?${params.toString()}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to perform regression analysis: ${error}`);
    }

    return response.json();
  },

  updateResults: async (id: string, result: RegressionResult): Promise<RegressionResult> => {
    const response = await fetch(
      `${API_BASE_URL}/api/regression/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(result)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update regression results: ${error}`);
    }

    return response.json();
  },

  getResults: async (vehicleType: VehicleType, year: string, region?: string): Promise<RegressionResult | null> => {
    const params = new URLSearchParams({
      type: vehicleType,
      year,
      ...(region && { region })
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/regression/search?${params.toString()}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error("Failed to fetch regression results");
      }

      return response.json();
    } catch (error) {
      console.error("Error fetching regression results:", error);
      return null;
    }
  },

  deleteResults: async (id: string): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/api/regression/${id}`,
      {
        method: "DELETE"
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete regression results");
    }
  }
};
