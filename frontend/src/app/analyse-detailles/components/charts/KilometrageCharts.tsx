'use client';

import { Vehicle } from "../../types";
import { BaseChart } from "./BaseChart";

interface KilometrageChartsProps {
  vehicles: Vehicle[];
  isLoading: boolean;
}

export function KilometrageCharts({ vehicles, isLoading }: KilometrageChartsProps) {
  const getMonthlyData = (vehicle: Vehicle) => vehicle.monthlyData?.kilometrage;

  return (
    <BaseChart
      vehicles={vehicles}
      title="Évolution du Kilométrage"
      yAxisLabel="Distance (km)"
      isLoading={isLoading}
      getMonthlyData={getMonthlyData}
      tooltipFormatter={(value: number) => `${value.toFixed(0)} km`}
      yAxisTickFormatter={(value: number) => value.toFixed(0)}
      vehicleTypeFilter={(vehicle) => vehicle.type !== 'chariots'}
    />
  );
}
