import { create } from 'zustand';

export type VehicleType = 'CAMION' | 'VOITURE' | 'MOTO';
export const REGIONS = ['Tunis', 'Mjezelbeb'] as const;
export type Region = typeof REGIONS[number];

interface FilterState {
  vehicleType: VehicleType;
  year: string;
  region: Region;
  percentage: number;
  setVehicleType: (type: VehicleType) => void;
  setYear: (year: string) => void;
  setRegion: (region: Region) => void;
  setPercentage: (percentage: number) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  vehicleType: 'CAMION',
  year: '2024',
  region: 'Tunis',
  percentage: 5, // Default improvement percentage
  setVehicleType: (type) => set({ vehicleType: type }),
  setYear: (year) => set({ year }),
  setRegion: (region) => set({ region }),
  setPercentage: (percentage) => set({ percentage }),
}));
