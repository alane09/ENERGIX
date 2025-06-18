import { NotificationsAPI } from "@/app/api/notifications";
import { API_BASE_URL } from "@/config";
import { MonthlyData, RegressionResult, VehicleData } from "../types";
import { ApiResponse, GetVehicleDetailsParams, VehicleDetailsResponse, VehicleType } from "../types/api";

// API calls use relative URLs to leverage Next.js API route proxying
// This avoids CORS issues by having requests originate from the same origin
// See next.config.ts for the proxy configuration

// Helper interfaces for type safety
interface RegressionCoefficients {
  a: number;
  b: number;
  c?: number;
}

interface RegressionData {
  equation: string;
  coefficients: RegressionCoefficients;
}

export const regressionAPI = {
  getMonthlyData: async (vehicleType: VehicleType, year: string, region?: string): Promise<MonthlyData[]> => {
    const params = new URLSearchParams({
      vehicleType,
      year,
      ...(region && { region })
    });
    
    const response = await fetch(
      `${API_BASE_URL}/regression/monthly-data?${params.toString()}`,
      {
        // Add CORS headers to request
        headers: {
          'Content-Type': 'application/json'
        }
      }
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
      `${API_BASE_URL}/regression/analyze?${params.toString()}`,
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

    const result: RegressionResult = await response.json();

    // Create notifications for regression analysis warnings
    try {
      if (result.warnings && result.warnings.length > 0) {
        await NotificationsAPI.create({
          title: "Avertissements d'Analyse de Régression",
          message: `L'analyse de régression pour ${vehicleType} (${year}) a généré ${result.warnings.length} avertissement(s)`,
          type: "WARNING",
          severity: "MEDIUM",
          timestamp: new Date().toISOString(),
          vehicleId: "SYSTEM",
          vehicleType: vehicleType,
          region: region || "ALL",
          year: year,
          metadata: {}
        });
      }

      // Create notification for poor model fit
      if (result.rSquared < 0.5) {
        await NotificationsAPI.create({
          title: "Qualité du Modèle de Régression Faible",
          message: `Le modèle de régression pour ${vehicleType} (${year}) a un R² de ${(result.rSquared * 100).toFixed(1)}%, indiquant un ajustement faible`,
          type: "WARNING",
          severity: "HIGH",
          timestamp: new Date().toISOString(),
          vehicleId: "SYSTEM",
          vehicleType: vehicleType,
          region: region || "ALL",
          year: year,
          metadata: {}
        });
      }
    } catch (notificationError) {
      console.warn('Failed to create regression analysis notifications:', notificationError);
    }

    return result;
  },

  updateResults: async (id: string, result: RegressionResult): Promise<RegressionResult> => {
    const response = await fetch(
      `${API_BASE_URL}/regression/${id}`,
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
        `${API_BASE_URL}/regression/search?${params.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
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
      `${API_BASE_URL}/regression/${id}`,
      {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete regression results");
    }
  },

  getVehicleDetails: async (params: GetVehicleDetailsParams): Promise<ApiResponse<VehicleData[]>> => {
    const { vehicleType, year, region } = params;
    try {
      // Create notification based on IPE conditions
      const createAnomalyNotification = async (vehicle: VehicleData) => {
        let shouldCreateNotification = false;
        let notificationMessage = "";
        
        // Calculate IPE using reference consumption from regression equation
        const ipeFromReference = (vehicle.referenceConsommation / vehicle.kilometrage) * 100;
        
        // Condition 1: IPE(L/100km) > 30 for both camions and voitures
        if (ipeFromReference > 30) {
          shouldCreateNotification = true;
          notificationMessage = `IPE de référence (${ipeFromReference.toFixed(2)} L/100km) dépasse le seuil de 30 L/100km`;
        }
        
        // Condition 2: For camions, check if IPE(L/100km.Tonne) > IPE_SER(L/100km.Tonne)
        if (vehicle.vehicleType === "CAMION" && vehicle.tonnage > 0 && vehicle.ipe_ser_L100TonneKm !== null) {
          const ipeReferencePerTonne = ipeFromReference / vehicle.tonnage;
          
          if (ipeReferencePerTonne > vehicle.ipe_ser_L100TonneKm) {
            shouldCreateNotification = true;
            notificationMessage = `IPE de référence par tonne (${ipeReferencePerTonne.toFixed(3)} L/100km.T) dépasse l'IPE SER (${vehicle.ipe_ser_L100TonneKm.toFixed(3)} L/100km.T)`;
          }
        }
        
        if (shouldCreateNotification) {
          await NotificationsAPI.create({
            title: "Seuil IPE Dépassé",
            message: `Véhicule ${vehicle.matricule}: ${notificationMessage}`,
            type: "ANOMALY",
            severity: ipeFromReference > 40 ? "HIGH" : "MEDIUM",
            timestamp: new Date().toISOString(),
            vehicleId: vehicle.matricule,
            vehicleType: vehicle.vehicleType,
            region: vehicle.region,
            year: vehicle.year,
            metadata: {}
          });
        }
      };

      const queryParams = new URLSearchParams();
      queryParams.append("type", vehicleType);
      queryParams.append("year", year);
      if (region && region !== 'all') {
        queryParams.append("region", region);
      }

      // Fetch both vehicle data and regression results
      const fetchOptions = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const [vehicleResponse, regressionResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/records?${queryParams.toString()}`, fetchOptions),
        fetch(`${API_BASE_URL}/regression/search?${queryParams.toString()}`, fetchOptions)
      ]);
      
      if (!vehicleResponse.ok) {
        return {
          data: null,
          error: {
            status: vehicleResponse.status,
            message: `Failed to fetch vehicle details: ${vehicleResponse.statusText}`
          }
        };
      }

      const rawData: VehicleDetailsResponse[] = await vehicleResponse.json();
      const regressionData = regressionResponse.ok ? await regressionResponse.json() : null;
      
      // Transform and validate the data
      const processedData = rawData
        .filter(item => 
          // Filter out records with invalid required fields
          item.matricule && 
          item.month &&
          item.kilometrage > 0 && 
          item.consommation >= 0
        )
        .map(item => {
          // Ensure all numeric fields are properly converted
          const kilometrage = Number(item.kilometrage) || 0;
          const consommation = Number(item.consommation) || 0;
          const tonnage = item.tonnage ? Number(item.tonnage) : 0;
          const ipeL100km = Number(item.ipeL100km) || 0;
          
          // Calculate derived values only if we have valid inputs
          const ipeL100TonneKm = tonnage > 0 ? (ipeL100km / tonnage) : null;

          // Calculate reference consumption using regression data if available
          const referenceConsommation = regressionData ? 
            calculateReferenceConsumption(regressionData, kilometrage, tonnage) : 
            consommation;

          // Calculate SER values
          const ipe_ser_L100km = calculateSER(consommation, kilometrage);
          const ipe_ser_L100TonneKm = tonnage > 0 ? 
            calculateSER(consommation, kilometrage, tonnage) : 
            null;

          return {
            id: `${item.matricule}-${item.month}-${year}`,
            matricule: item.matricule,
            month: item.month,
            kilometrage,
            consommation,
            tonnage,
            ipeL100km,
            ipeL100TonneKm,
            referenceConsommation,
            ipe_ser_L100km,
            ipe_ser_L100TonneKm,
            vehicleType,
            year,
            region: item.region || region || 'unknown'
          };
        });

      // Check for anomalies and create notifications for current year data
      if (year === new Date().getFullYear().toString()) {
        const anomalyPromises = processedData.map(async (vehicleData) => {
          try {
            await createAnomalyNotification(vehicleData);
          } catch (error) {
            console.warn('Failed to create notification for vehicle:', vehicleData.matricule, error);
          }
        });
        
        // Wait for all notifications to be processed (but don't block the response)
        Promise.allSettled(anomalyPromises).catch((error: unknown) => 
          console.warn('Some notifications failed to be created:', error)
        );
      }

      return {
        data: processedData,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: {
          status: 500,
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }
};

// Helper functions for calculations
function calculateReferenceConsumption(
  regressionData: RegressionData | null, 
  kilometrage: number,
  tonnage?: number
): number {
  if (!regressionData || !regressionData.equation) {
    return 0;
  }

  try {
    // Parse the regression equation (example: y = ax + b or y = ax + bz + c)
    const { a, b, c } = regressionData.coefficients;
    return tonnage ? 
      (a * kilometrage) + (b * tonnage) + (c || 0) : 
      (a * kilometrage) + (b || 0);
  } catch (error) {
    console.error('Error calculating reference consumption:', error);
    return 0;
  }
}

function calculateSER(
  consumption: number,
  kilometrage: number,
  tonnage?: number
): number {
  if (kilometrage <= 0) return 0;
  return tonnage && tonnage > 0 ?
    (consumption / (kilometrage * tonnage)) * 100 :
    (consumption / kilometrage) * 100;
}
