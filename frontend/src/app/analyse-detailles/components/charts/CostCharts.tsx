'use client';

import { Vehicle } from "../../types";
import { BaseChart } from "./BaseChart";

interface CostChartsProps {
  vehicles: Vehicle[];
  isLoading: boolean;
}

export function CostCharts({ vehicles, isLoading }: CostChartsProps) {
  const getMonthlyData = (vehicle: Vehicle) => vehicle.monthlyData?.cost;

  return (
    <BaseChart
      vehicles={vehicles}
      title="Évolution des Coûts"
      yAxisLabel="Coût (TND)"
      isLoading={isLoading}
      getMonthlyData={getMonthlyData}
      tooltipFormatter={(value: number) => `${value.toFixed(0)} TND`}
      yAxisTickFormatter={(value: number) => value.toFixed(0)}
    />
  );
}
