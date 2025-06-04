'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { METRICS, Vehicle, VehicleType } from "../types";
import { hasVehicleKilometrageData, hasVehicleTonnageData } from "../Vehicle";
import { ConsumptionCharts } from "./charts/ConsumptionCharts";
import { CostCharts } from "./charts/CostCharts";
import { EmissionsCharts } from "./charts/EmissionsCharts";
import { IPECharts } from "./charts/IPECharts";
import { KilometrageCharts } from "./charts/KilometrageCharts";
import { TonnageCharts } from "./charts/TonnageCharts";

interface ChartTabsProps {
  vehicles: Vehicle[];
  selectedVehicles: Vehicle[];
  vehicleType: VehicleType;
  isLoading: boolean;
}

export function ChartTabs({
  vehicles,
  selectedVehicles,
  vehicleType,
  isLoading
}: ChartTabsProps) {
  // Get available metrics based on vehicle type
  const getAvailableMetrics = () => {
    switch (vehicleType) {
      case 'camions':
        return Object.values(METRICS); // All metrics available
      case 'voitures':
        return Object.values(METRICS).filter(
          metric => !['tonnage', 'ipeTonne'].includes(metric.id)
        );
      case 'chariots':
        return Object.values(METRICS).filter(
          metric => metric.id === 'consumption'
        );
      default:
        return Object.values(METRICS).filter(metric => 
          metric.vehicleTypes.includes(vehicleType) &&
          (metric.id !== 'tonnage' || hasVehicleTonnageData(vehicleType)) &&
          (metric.id !== 'kilometrage' || hasVehicleKilometrageData(vehicleType))
        );
    }
  };

  const availableMetrics = getAvailableMetrics();

  return (
    <Tabs defaultValue={availableMetrics[0]?.id} className="space-y-6">
      <TabsList className="grid w-full" style={{ 
        gridTemplateColumns: `repeat(${availableMetrics.length}, 1fr)` 
      }}>
        {availableMetrics.map(metric => (
          <TabsTrigger
            key={metric.id}
            value={metric.id}
            className="transition-all duration-200"
          >
            {metric.tabTitle}
          </TabsTrigger>
        ))}
      </TabsList>

      {availableMetrics.map(metric => (
        <TabsContent key={metric.id} value={metric.id}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {metric.id === 'consumption' && (
              <ConsumptionCharts
                vehicles={selectedVehicles}
                isLoading={isLoading}
              />
            )}
            {metric.id === 'kilometrage' && hasVehicleKilometrageData(vehicleType) && (
              <KilometrageCharts
                vehicles={selectedVehicles}
                isLoading={isLoading}
              />
            )}
            {(metric.id === 'ipe' || metric.id === 'ipeTonne') && vehicleType !== 'chariots' && (
              <IPECharts
                vehicles={selectedVehicles}
                isLoading={isLoading}
                metricId={metric.id}
              />
            )}
            {metric.id === 'tonnage' && hasVehicleTonnageData(vehicleType) && (
              <TonnageCharts
                vehicles={selectedVehicles}
                isLoading={isLoading}
              />
            )}
            {metric.id === 'cost' && (
              <CostCharts
                vehicles={selectedVehicles}
                isLoading={isLoading}
              />
            )}
            {metric.id === 'emissions' && (
              <EmissionsCharts
                vehicles={selectedVehicles}
                isLoading={isLoading}
              />
            )}
          </motion.div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
