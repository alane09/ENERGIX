'use client';

import { Vehicle } from "../../types";
import { BaseChart } from "./BaseChart";
interface IPEChartsProps {
  vehicles: Vehicle[];
  isLoading: boolean;
}
export function IPECharts({ vehicles, isLoading, metricId }: IPEChartsProps & { metricId: string }) {
  const getMonthlyData = (vehicle: Vehicle) => {
    if (metricId === 'ipe') {
      return vehicle.monthlyData?.ipe;
    } else if (metricId === 'ipeTonne') {
      return vehicle.monthlyData?.ipeTonne;
    }
    return undefined;
  };
  const title = metricId === 'ipe' ? "Évolution de l'IPE (L/100km)" : "Évolution de l'IPE/Tonne (L/100km·T)";
  const yAxisLabel = metricId === 'ipe' ? "IPE (L/100km)" : "IPE/Tonne (L/100km·T)";
  const vehicleTypeFilter = metricId === 'ipeTonne' ? (vehicle: Vehicle) => vehicle.type === 'camions' : undefined;

  return (
    <BaseChart
      vehicles={vehicles}
      title={title}
      yAxisLabel={yAxisLabel}
      isLoading={isLoading}
      getMonthlyData={getMonthlyData}
      tooltipFormatter={(value: number) => value.toFixed(3)}
      yAxisTickFormatter={(value: number) => value.toFixed(2)}
      vehicleTypeFilter={vehicleTypeFilter}
    />
  );
}
