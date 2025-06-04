import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Saisie Manuelle des Données | COFICAB ENERGIX",
  description: "Interface pour la saisie manuelle des données des véhicules et la gestion des paramètres",
}

export async function getVehicleConfig() {
  try {
    // This would connect to your real API in production
    // In a real implementation, you would use server-side data fetching here
    return {
      vehicleTypes: ["CAMION", "VOITURE", "CHARIOT"],
      regions: ["Tunis", "Sfax", "Sousse", "Autre"],
      apiEndpoint: "/api"
    }
  } catch (error) {
    console.error("Error fetching vehicle configuration:", error)
    // Return default values in case of error
    return {
      vehicleTypes: ["CAMION", "VOITURE", "CHARIOT"],
      regions: ["Tunis", "Sfax", "Sousse", "Autre"],
      apiEndpoint: "/api"
    }
  }
}
