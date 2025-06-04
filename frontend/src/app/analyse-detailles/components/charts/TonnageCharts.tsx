'use client';

import { Vehicle } from "../../types";
import { BaseChart } from "./BaseChart";

interface TonnageChartsProps {
  vehicles: Vehicle[];
  isLoading: boolean;
}

export function TonnageCharts({ vehicles, isLoading }: TonnageChartsProps) {
  const getMonthlyData = (vehicle: Vehicle) => vehicle.monthlyData?.tonnage;

  return (
    <BaseChart
      vehicles={vehicles}
      title="Évolution du Tonnage"
      yAxisLabel="Tonnage (T)"
      isLoading={isLoading}
      getMonthlyData={getMonthlyData}
      tooltipFormatter={(value: number) => `${value.toFixed(1)} T`}
      yAxisTickFormatter={(value: number) => value.toFixed(1)}
      vehicleTypeFilter={(vehicle) => vehicle.type === 'camions'}
    />
  );
}
