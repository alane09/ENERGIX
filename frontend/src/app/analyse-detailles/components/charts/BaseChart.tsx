'use client';

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Vehicle } from "../../types";
import { getMonthAbbreviation, transformMonthlyData } from "../../utils/month-utils";

export const CHART_COLORS = [
  "#2563eb", // Blue
  "#dc2626", // Red
  "#16a34a", // Green
  "#9333ea", // Purple
  "#ea580c", // Orange
  "#0891b2", // Cyan
];

interface ChartProps {
  data: any[];
  dataKeys: string[];
  names: string[];
  title: string;
  yAxisLabel: string;
  isLoading: boolean;
  tooltipFormatter?: (value: number) => string;
  yAxisTickFormatter?: (value: number) => string;
}

interface GroupedChartProps {
  vehicles: Vehicle[];
  title: string;
  yAxisLabel: string;
  isLoading: boolean;
  getMonthlyData: (vehicle: Vehicle) => { month: string; value: number }[] | undefined;
  tooltipFormatter?: (value: number) => string;
  yAxisTickFormatter?: (value: number) => string;
  vehicleTypeFilter?: (vehicle: Vehicle) => boolean;
}

function SingleTypeChart({
  data,
  dataKeys,
  names,
  title,
  yAxisLabel,
  isLoading,
  tooltipFormatter = (value: number) => value.toFixed(2),
  yAxisTickFormatter = (value: number) => value.toFixed(1)
}: ChartProps) {
  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  // Transform and sort data by month
  const sortedData = transformMonthlyData(data);

  // Find min and max values for Y axis scaling
  const allValues = sortedData.flatMap(point => {
    return Object.entries(point)
      .filter(([key]) => key !== 'month')
      .map(([_, value]) => typeof value === 'number' ? value : 0);
  });
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const yAxisDomain = [
    Math.max(0, minValue * 0.8), // Lower bound: 0 or 80% of min value
    maxValue * 1.2 // Upper bound: 120% of max value
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={sortedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month"
                interval="preserveStartEnd"
                tickMargin={10}
                tickFormatter={getMonthAbbreviation}
              />
              <YAxis 
                domain={yAxisDomain}
                scale="linear"
                allowDataOverflow={false}
                allowDecimals={true}
                tickCount={10}
                tickFormatter={yAxisTickFormatter}
                label={{ 
                  value: yAxisLabel,
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10
                }}
              />
              <Tooltip 
                formatter={tooltipFormatter}
                labelFormatter={getMonthAbbreviation}
              />
              <Legend />
              {dataKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={names[index]}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{`${title} (Histogramme)`}</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sortedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month"
                interval="preserveStartEnd"
                tickMargin={10}
                tickFormatter={getMonthAbbreviation}
              />
              <YAxis 
                domain={yAxisDomain}
                scale="linear"
                allowDataOverflow={false}
                allowDecimals={true}
                tickCount={10}
                tickFormatter={yAxisTickFormatter}
                label={{ 
                  value: yAxisLabel,
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10
                }}
              />
              <Tooltip 
                formatter={tooltipFormatter}
                labelFormatter={getMonthAbbreviation}
              />
              <Legend />
              {dataKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  name={names[index]}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>
    </div>
  );
}

export function BaseChart({
  vehicles,
  title,
  yAxisLabel,
  isLoading,
  getMonthlyData,
  tooltipFormatter,
  yAxisTickFormatter,
  vehicleTypeFilter
}: GroupedChartProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Group vehicles by type
  const vehiclesByType = vehicles.reduce((acc, vehicle) => {
    if (vehicleTypeFilter && !vehicleTypeFilter(vehicle)) return acc;
    
    if (!acc[vehicle.type]) {
      acc[vehicle.type] = [];
    }
    acc[vehicle.type].push(vehicle);
    return acc;
  }, {} as Record<string, Vehicle[]>);

  return (
    <div className="space-y-8">
      {Object.entries(vehiclesByType).map(([type, typeVehicles]) => {
        const firstVehicle = typeVehicles[0];
        if (!firstVehicle) return null;

        const monthlyData = firstVehicle.monthlyData && getMonthlyData(firstVehicle)?.map(point => {
          const dataPoint: Record<string, string | number> = { month: point.month };
          typeVehicles.forEach(vehicle => {
            const monthData = getMonthlyData(vehicle)?.find(p => p.month === point.month);
            dataPoint[vehicle.matricule] = monthData?.value || 0;
          });
          return dataPoint;
        }) || [];

        const dataKeys = typeVehicles.map(v => v.matricule);
        const names = typeVehicles.map(v => `${v.matricule} - ${yAxisLabel}`);
        const typeTitle = `${title} - ${type.charAt(0).toUpperCase() + type.slice(1)}`;

        return (
          <SingleTypeChart
            key={type}
            data={monthlyData}
            dataKeys={dataKeys}
            names={names}
            title={typeTitle}
            yAxisLabel={yAxisLabel}
            isLoading={isLoading}
            tooltipFormatter={tooltipFormatter}
            yAxisTickFormatter={yAxisTickFormatter}
          />
        );
      })}
    </div>
  );
}
