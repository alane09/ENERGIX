'use client';

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Vehicle } from "../types";
import { formatVehicleValue } from "../Vehicle";

export interface SummaryCardsProps {
  vehicles: Vehicle[];
  isLoading: boolean;
}

export function SummaryCards({ vehicles, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] w-full" />
        ))}
      </div>
    );
  }

  // Calculate totals
  const totals = vehicles.reduce(
    (acc, vehicle) => {
      acc.consumption += vehicle.totalConsumption;
      acc.kilometrage += vehicle.totalKilometrage;
      acc.cost += vehicle.totalCost;
      acc.emissions += vehicle.totalEmissions;
      if (vehicle.type === 'camions' && vehicle.totalTonnage) {
        acc.tonnage += vehicle.totalTonnage;
      }
      return acc;
    },
    { consumption: 0, kilometrage: 0, cost: 0, emissions: 0, tonnage: 0 }
  );

  // Calculate averages
  const avgIPE = vehicles.reduce((sum, v) => sum + v.avgIPE, 0) / vehicles.length;
  const avgIPETonne = vehicles
    .filter(v => v.type === 'camions' && v.avgIPETonne)
    .reduce((sum, v) => sum + (v.avgIPETonne || 0), 0) / 
    vehicles.filter(v => v.type === 'camions').length || 0;

  // Determine which metrics to show based on vehicle types
  const showTonnage = vehicles.some(v => v.type === 'camions');
  const showKilometrage = vehicles.some(v => v.type !== 'chariots');

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-6 space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Consommation Totale
        </h3>
        <p className="text-2xl font-bold">
          {formatVehicleValue(totals.consumption, 'consumption')}
        </p>
      </Card>

      {showKilometrage && (
        <Card className="p-6 space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Kilométrage Total
          </h3>
          <p className="text-2xl font-bold">
            {formatVehicleValue(totals.kilometrage, 'kilometrage')}
          </p>
        </Card>
      )}

      <Card className="p-6 space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          IPE Moyen
        </h3>
        <p className="text-2xl font-bold">
          {formatVehicleValue(avgIPE, 'ipe')}
        </p>
      </Card>

      {showTonnage && (
        <Card className="p-6 space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Tonnage Total
          </h3>
          <p className="text-2xl font-bold">
            {formatVehicleValue(totals.tonnage, 'tonnage')}
          </p>
        </Card>
      )}

      {showTonnage && avgIPETonne > 0 && (
        <Card className="p-6 space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            IPE/Tonne Moyen
          </h3>
          <p className="text-2xl font-bold">
            {formatVehicleValue(avgIPETonne, 'ipeTonne')}
          </p>
        </Card>
      )}

      <Card className="p-6 space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Coût Total
        </h3>
        <p className="text-2xl font-bold">
          {formatVehicleValue(totals.cost, 'cost')}
        </p>
      </Card>

      <Card className="p-6 space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Émissions CO₂
        </h3>
        <p className="text-2xl font-bold">
          {formatVehicleValue(totals.emissions, 'emissions')}
        </p>
      </Card>
    </div>
  );
}
