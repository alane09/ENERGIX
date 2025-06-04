'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import VehiclesAPI from './api-vehicles';
import { FilterPanel } from './components/FilterPanel';
import { TabsContainer } from './components/TabsContainer';
import { ApiError, FilterState, RegionOption, Vehicle } from './types';
import { VEHICLE_TYPES, getAvailableMatricules, normalizeVehicleType } from './Vehicle';

const REGIONS: RegionOption[] = [
  { id: 'all', name: 'Toutes les régions' },
  { id: 'Tunis', name: 'Tunis' },
  { id: 'Mjez Elbeb', name: 'Mjez Elbeb' }
];

export default function AnalyseDetaillesClient() {
  // State management
  const [filters, setFilters] = useState<FilterState>({
    vehicleType: 'all',
    selectedMatricules: [],
    year: '2024', // Set default year to 2024
    region: 'all'
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  // Fetch vehicles data
  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching vehicles with filters:', filters);
      
      // Get available matricules for the selected type and year
      const availableVehicles = await getAvailableMatricules(filters.vehicleType, filters.year);
      console.log('Available vehicles:', availableVehicles.length);
      
      // Filter vehicles by region if needed
      const filteredVehicles = filters.region === 'all' 
        ? availableVehicles
        : availableVehicles.filter(v => v.region === filters.region);
      
      console.log('Filtered vehicles:', filteredVehicles.length);
      setVehicles(filteredVehicles);

      // Reset selected matricules when changing filters
      if (filters.selectedMatricules.length > 0) {
        const validMatricules = filters.selectedMatricules.filter(
          m => filteredVehicles.some(v => v.matricule === m)
        );
        if (validMatricules.length !== filters.selectedMatricules.length) {
          setFilters(prev => ({
            ...prev,
            selectedMatricules: validMatricules
          }));
        }
      }

      // Show success message if data is loaded but empty
      if (filteredVehicles.length === 0) {
        toast.info('Aucune donnée disponible pour les filtres sélectionnés');
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors de la récupération des données';
      setError({
        message: errorMessage,
        retry: fetchVehicles
      });
      toast.error('Erreur lors de la récupération des données');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    console.log('Filter change:', newFilters);
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      
      // Reset selected matricules when changing vehicle type or region
      if (newFilters.vehicleType || newFilters.region) {
        updated.selectedMatricules = [];
      }
      
      return updated;
    });
  };

  // Effect to fetch data when filters change
  useEffect(() => {
    fetchVehicles();
  }, [filters.vehicleType, filters.year, filters.region]);

  // Effect to fetch monthly aggregation data for performance metrics
  useEffect(() => {
    const fetchMonthlyAggregation = async () => {
      try {
        console.log('Fetching monthly aggregation:', {
          vehicleType: filters.vehicleType,
          year: filters.year
        });

        const data = await VehiclesAPI.getMonthlyAggregation({
          vehicleType: normalizeVehicleType(filters.vehicleType),
          year: filters.year !== 'all' ? filters.year : undefined
        });

        console.log('Monthly aggregation data:', data);
      } catch (err) {
        console.error('Error fetching monthly aggregation:', err);
      }
    };

    if (filters.vehicleType !== 'all' || filters.year !== 'all') {
      fetchMonthlyAggregation();
    }
  }, [filters.vehicleType, filters.year]);

  if (error?.message) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <div className="text-center space-y-4">
          <p className="text-red-500 font-medium">{error.message}</p>
          {error.retry && (
            <button
              onClick={error.retry}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          isLoading={loading}
          vehicleTypes={VEHICLE_TYPES}
          regions={REGIONS}
        />
      </div>

      <TabsContainer
        vehicles={vehicles}
        selectedMatricules={filters.selectedMatricules}
        onSelectionChange={(matricules) => handleFilterChange({ selectedMatricules: matricules })}
        isLoading={loading}
        region={filters.region}
        year={filters.year}
      />
    </div>
  );
}
