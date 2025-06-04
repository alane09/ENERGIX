'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { METRICS, MetricDefinition, Vehicle, VehicleType } from "../types";
import { ChartCard } from "./ChartCard";
import { motion } from "framer-motion";

interface TabsSectionProps {
  vehicles: Vehicle[];
  selectedVehicleType: VehicleType;
  year: string;
  className?: string;
}

const prepareChartData = (
  vehicles: Vehicle[],
  metric: MetricDefinition,
  type: 'monthly' | 'annual'
) => {
  if (type === 'monthly') {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data = months.map(month => ({
      name: month,
      ...vehicles.reduce((acc, vehicle) => {
        const monthlyData = getVehicleMonthlyData(vehicle, metric.id);
        const monthValue = monthlyData.find(m => m.month === month)?.value || 0;
        return { ...acc, [vehicle.matricule]: monthValue };
      }, {})
    }));
    return data;
  } else {
    return vehicles.map(vehicle => ({
      name: vehicle.matricule,
      value: getVehicleAnnualTotal(vehicle, metric.id)
    }));
  }
};

const getVehicleMonthlyData = (vehicle: Vehicle, metricId: string) => {
  switch (metricId) {
    case 'consumption':
      return vehicle.monthlyConsumption;
    case 'kilometrage':
      return vehicle.monthlyKilometrage;
    case 'ipe':
      return vehicle.monthlyIPE;
    case 'ipeTonne':
      return vehicle.monthlyIPETonne || [];
    case 'cost':
      return vehicle.monthlyCost;
    case 'tonnage':
      return vehicle.monthlyTonnage || [];
    case 'emissions':
      return vehicle.monthlyEmissions;
    default:
      return [];
  }
};

const getVehicleAnnualTotal = (vehicle: Vehicle, metricId: string) => {
  const monthlyData = getVehicleMonthlyData(vehicle, metricId);
  return monthlyData.reduce((sum, month) => sum + month.value, 0);
};

export function TabsSection({
  vehicles,
  selectedVehicleType,
  year,
  className
}: TabsSectionProps) {
  // Filter metrics based on vehicle type
  const availableMetrics = Object.values(METRICS).filter(metric => 
    metric.vehicleTypes.includes(selectedVehicleType)
  );

  if (vehicles.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Aucun véhicule sélectionné. Veuillez sélectionner au moins un véhicule pour voir les analyses.
      </div>
    );
  }

  return (
    <Tabs defaultValue={availableMetrics[0]?.id} className={className}>
      <TabsList className="grid grid-cols-3 lg:grid-cols-7 mb-4">
        {availableMetrics.map((metric) => (
          <TabsTrigger key={metric.id} value={metric.id}>
            {metric.tabTitle}
          </TabsTrigger>
        ))}
      </TabsList>

      {availableMetrics.map((metric) => (
        <TabsContent key={metric.id} value={metric.id}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            <ChartCard
              title={`${metric.title} - Évolution Mensuelle`}
              metric={metric}
              data={prepareChartData(vehicles, metric, 'monthly')}
              type="line"
            />
            
            <ChartCard
              title={`${metric.title} - Comparaison`}
              metric={metric}
              data={prepareChartData(vehicles, metric, 'monthly')}
              type="bar"
            />

            {['consumption', 'cost', 'tonnage'].includes(metric.id) && (
              <ChartCard
                title={`${metric.title} - Distribution`}
                metric={metric}
                data={prepareChartData(vehicles, metric, 'annual')}
                type="pie"
                className="lg:col-span-2"
              />
            )}
          </motion.div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
