import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchRegressionData, fetchVehicleDetails, getMonthlyAggregation } from '../api';
import { Region, VehicleType } from '../store';
import { MonthlyData, RegressionData, VehicleData } from '../types';

export function useRegressionData(vehicleType: string, year: string, region: string) {
  const queryClient = useQueryClient();
  const queryKey = ['regression', vehicleType, year, region];

  return useQuery<RegressionData | null>({
    queryKey,
    queryFn: async () => {
      try {
        const data = await fetchRegressionData(
          vehicleType as VehicleType, 
          year, 
          region as Region
        );
        return data;
      } catch (error) {
        console.error('Regression data fetch error:', error);
        throw error;
      }
    },
    enabled: Boolean(vehicleType && year && region),
    staleTime: 0,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: 0,
    gcTime: 0
  });
}

export function useVehicleDetails(vehicleType: string, year: string, region: string) {
  const queryClient = useQueryClient();
  const queryKey = ['vehicles', vehicleType, year, region];

  return useQuery<VehicleData[]>({
    queryKey,
    queryFn: async () => {
      try {
        const data = await fetchVehicleDetails(
          vehicleType as VehicleType, 
          year, 
          region as Region
        );
        return data || [];
      } catch (error) {
        console.error('Vehicle details fetch error:', error);
        throw error;
      }
    },
    enabled: Boolean(vehicleType && year && region),
    staleTime: 0,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: 0,
    gcTime: 0
  });
}

export function useMonthlyData(vehicleType: string, year: string, region: string) {
  const queryClient = useQueryClient();
  const queryKey = ['monthly', vehicleType, year, region];

  return useQuery<MonthlyData[]>({
    queryKey,
    queryFn: async () => {
      try {
        const data = await getMonthlyAggregation(
          vehicleType as VehicleType, 
          year, 
          region as Region
        );
        return data || [];
      } catch (error) {
        console.error('Monthly data fetch error:', error);
        throw error;
      }
    },
    enabled: Boolean(vehicleType && year && region),
    staleTime: 0,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: 0,
    gcTime: 0
  });
}
