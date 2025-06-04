'use client';

import { Card } from "@/components/ui/card";
import { Vehicle, VehicleType } from "../../types";
import { ChartTabs } from "../ChartTabs";
import { SummaryCards } from "../SummaryCards";
import { VehicleSelector } from "../VehicleSelector";
import { processVehicleData } from "../../Vehicle";

interface VehiclesTabProps {
  vehicles: Vehicle[];
  selectedMatricules: string[];
  onSelectionChange: (matricules: string[]) => void;
  isLoading: boolean;
  region: string;
}

export function VehiclesTab({
  vehicles,
  selectedMatricules,
  onSelectionChange,
  isLoading,
  region
}: VehiclesTabProps) {
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

      {selectedVehicles.length > 0 && (
        <>
          <SummaryCards vehicles={processedVehicles} isLoading={isLoading} />
          <ChartTabs
            vehicles={processedVehicles}
            selectedVehicles={processedVehicles}
            vehicleType={vehicleType}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
}
