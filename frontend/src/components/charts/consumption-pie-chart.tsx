"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import React from "react";

// Import the PieChart component with dynamic import and no SSR
const DynamicPieChart = dynamic(
  () => import("./chart-components/dynamic-pie-chart"),
  { ssr: false, loading: () => <Loader2 className="h-8 w-8 animate-spin" /> }
);

interface ConsumptionPieChartProps {
  data: any[];
  title: string;
  description?: string;
  dataKey?: string;
  nameKey?: string;
  colors?: string[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  unit?: string;
}

export default function ConsumptionPieChart({
  data,
  title,
  description,
  dataKey = "value",
  nameKey = "name",
  colors = [
    "#3B82F6", // blue-500
    "#10B981", // emerald-500
    "#F59E0B", // amber-500
    "#EF4444", // red-500
    "#8B5CF6", // violet-500
    "#EC4899", // pink-500
    "#06B6D4", // cyan-500
    "#F97316", // orange-500
  ],
  isLoading = false,
  emptyMessage = "Aucune donnée disponible",
  className = "",
  unit = "",
}: ConsumptionPieChartProps) {
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [isEmpty, setIsEmpty] = React.useState<boolean>(true);
  const [isMounted, setIsMounted] = React.useState<boolean>(false);
  
  // Handle client-side mounting
  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Process data when it changes
  React.useEffect(() => {
    if (!data || data.length === 0) {
      console.log('PieChart: No data provided', { data });
      setChartData([]);
      setIsEmpty(true);
      return;
    }

    // Filter out zero values and transform data if needed
    const filteredData = data
      .filter((item) => item && item[dataKey] !== 0 && item[dataKey] !== undefined && item[dataKey] !== null)
      .map((item) => ({
        ...item,
        [dataKey]: typeof item[dataKey] === "string" ? parseFloat(item[dataKey]) : item[dataKey],
      }));

    console.log("PieChart processing data:", { 
      originalData: data,
      filteredData: filteredData,
      dataKey,
      nameKey 
    });

    setChartData(filteredData);
    setIsEmpty(filteredData.length === 0);
  }, [data, dataKey, nameKey]);

  // Handle loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="h-[380px]">
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle empty state
  if (isEmpty) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="h-[380px]">
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render the chart using the dynamically imported component
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="h-[380px] pt-2 pb-6">
        {isMounted && chartData.length > 0 ? (
          <DynamicPieChart 
            data={chartData} 
            dataKey={dataKey} 
            nameKey={nameKey} 
            colors={colors} 
            unit={unit} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
