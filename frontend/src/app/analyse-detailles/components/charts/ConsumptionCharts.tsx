'use client';

import { Vehicle } from "../../types";
import { BaseChart } from "./BaseChart";

interface ConsumptionChartsProps {
  vehicles: Vehicle[];
  isLoading: boolean;
}

export function ConsumptionCharts({ vehicles, isLoading }: ConsumptionChartsProps) {
  const getMonthlyData = (vehicle: Vehicle) => vehicle.monthlyData?.consumption;

  return (
    <BaseChart
      vehicles={vehicles}
      title="Évolution de la Consommation"
      yAxisLabel="Consommation (L)"
      isLoading={isLoading}
      getMonthlyData={getMonthlyData}
      tooltipFormatter={(value: number) => `${value.toFixed(1)} L`}
      yAxisTickFormatter={(value: number) => value.toFixed(1)}
    />
  );
}
