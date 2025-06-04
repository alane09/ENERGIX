'use client';

import { Vehicle } from "../../types";
import { BaseChart } from "./BaseChart";

interface EmissionsChartsProps {
  vehicles: Vehicle[];
  isLoading: boolean;
}

export function EmissionsCharts({ vehicles, isLoading }: EmissionsChartsProps) {
  const getMonthlyData = (vehicle: Vehicle) => vehicle.monthlyData?.emissions;

  return (
    <BaseChart
      vehicles={vehicles}
      title="Évolution des Émissions CO₂"
      yAxisLabel="CO₂ (kg)"
      isLoading={isLoading}
      getMonthlyData={getMonthlyData}
      tooltipFormatter={(value: number) => `${value.toFixed(1)} kg`}
      yAxisTickFormatter={(value: number) => value.toFixed(1)}
    />
  );
}
