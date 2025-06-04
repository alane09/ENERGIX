'use client';

import { Card } from "@/components/ui/card";
import { Vehicle, VehicleType } from "../../types";
import { processVehicleData } from "../../Vehicle";
import { ChartTabs } from "../ChartTabs";
import { SummaryCards } from "../SummaryCards";
import { VehicleSelector } from "../VehicleSelector";

interface GeneralTabProps {
  vehicles: Vehicle[];
  selectedMatricules: string[];
  onSelectionChange: (matricules: string[]) => void;
  isLoading: boolean;
  region: string;
  year: string;
}

export function GeneralTab({
  vehicles,
  selectedMatricules,
  onSelectionChange,
  isLoading,
  region,
  year
}: GeneralTabProps) {
  // Get selected vehicles and their type
  const selectedVehicles = vehicles.filter(v => 
    selectedMatricules.includes(v.matricule)
  );

  // Determine vehicle type based on selection
  const getVehicleType = (): VehicleType => {
    if (selectedVehicles.length === 0) return 'all';
    const types = new Set(selectedVehicles.map(v => v.type));
    return types.size === 1 ? selectedVehicles[0].type : 'all';
  };

  const vehicleType = getVehicleType();

  // Process vehicle data
  const processedVehicles = selectedVehicles.map(processVehicleData);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <VehicleSelector
          vehicles={vehicles}
          selectedMatricules={selectedMatricules}
          onSelectionChange={onSelectionChange}
          isLoading={isLoading}
        />
      </Card>

      {(selectedVehicles.length > 0 || year === '2024') && (
        <>
          <SummaryCards 
            vehicles={year === '2024' ? vehicles : processedVehicles} 
            isLoading={isLoading} 
          />
          <ChartTabs
            vehicles={year === '2024' ? vehicles : processedVehicles}
            selectedVehicles={year === '2024' ? vehicles : processedVehicles}
            vehicleType={year === '2024' ? 'all' : vehicleType}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
}
