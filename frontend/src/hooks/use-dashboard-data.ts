"use client";

import { VehicleAPI } from "@/lib/api";
import { DashboardStats } from "@/types/dashboard";
import { useEffect, useState } from "react";

interface UseDashboardDataProps {
  selectedVehicleType: string;
  year?: string;
}

export function useDashboardData({ selectedVehicleType, year }: UseDashboardDataProps) {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // For now, only 'camions' has real data
        const hasRealData = selectedVehicleType === 'all' || selectedVehicleType === 'camions';
        
        // Use correct lowercase vehicle type for API calls
        const normalizedVehicleType = 
          selectedVehicleType === 'CAMION' ? 'camions' : 
          selectedVehicleType === 'VOITURE' ? 'voitures' :
          selectedVehicleType === 'CHARIOT' ? 'chariots' :
          selectedVehicleType;
        
        // Prepare parameters for the API call
        const params: Record<string, string> = {};
        if (year) {
          params.year = year;
        }
        
        // Fetch data based on vehicle type
        const data = await VehicleAPI.getDashboardStats({
          vehicleType: normalizedVehicleType,
          ...params
        });
        
        if (data) {
          // Ensure all required fields exist with defaults
          const processedData: DashboardStats = {
            ...data,
            totalVehicles: data.totalVehicles || 0,
            vehicleCount: data.vehicleCount || 0,
            totalConsommation: data.totalConsommation || 0,
            totalConsumption: data.totalConsumption || data.totalConsommation || 0,
            avgIPE: data.avgIPE || 0,
            totalKilometrage: data.totalKilometrage || 0,
            vehicleTypes: data.vehicleTypes || [],
            monthlyData: data.monthlyData || [],
            vehicleTypeBreakdown: data.vehicleTypeBreakdown || []
          };
          
          // If there's no data but it's not 'camions', show info message
          if (!hasRealData && (!processedData.monthlyData || processedData.monthlyData.length === 0)) {
            if (selectedVehicleType === 'voitures' || selectedVehicleType === 'chariots') {
              setError(`Les données pour les ${selectedVehicleType === 'voitures' ? 'voitures' : 'chariots'} ne sont pas encore disponibles`);
            }
          }
          
          setDashboardData(processedData);
        } else {
          setError("Aucune donnée disponible");
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Une erreur s'est produite lors du chargement des données");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [selectedVehicleType, year]);
  
  return {
    dashboardData,
    isLoading,
    error
  };
}
