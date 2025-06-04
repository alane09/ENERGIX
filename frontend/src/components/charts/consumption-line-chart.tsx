/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import React from "react";

interface ConsumptionLineChartProps {
  data: any[];
  title: string;
  description?: string;
  xAxisKey?: string;
  dataKey?: string;
  lineColor?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  unit?: string;
  additionalDataKeys?: Array<{
    key: string;
    color: string;
    name: string;
  }>;
}

export default function ConsumptionLineChart({
  data,
  title,
  description = "",
  xAxisKey = "name",
  dataKey = "value",
  lineColor = "#3B82F6",
  isLoading = false,
  emptyMessage = "Aucune donnée disponible",
  className = "",
  unit = "L",
  additionalDataKeys = []
}: ConsumptionLineChartProps) {
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [isEmpty, setIsEmpty] = React.useState<boolean>(true);
  const [isMounted, setIsMounted] = React.useState<boolean>(false);
  const [Chart, setChart] = React.useState<any>(null);
  
  // Handle client-side mounting and dynamic import of chart components
  React.useEffect(() => {
    setIsMounted(true);
    
    // Dynamically import Recharts only on client-side
    import('recharts').then((RechartsModule) => {
      setChart({
        ResponsiveContainer: RechartsModule.ResponsiveContainer,
        LineChart: RechartsModule.LineChart,
        Line: RechartsModule.Line,
        XAxis: RechartsModule.XAxis,
        YAxis: RechartsModule.YAxis,
        CartesianGrid: RechartsModule.CartesianGrid,
        Tooltip: RechartsModule.Tooltip,
        Legend: RechartsModule.Legend
      });
    });
  }, []);
  
  // Process data when it changes
  React.useEffect(() => {
    // Create a stable representation of the data to prevent infinite loops
    const processData = () => {
      if (data && Array.isArray(data) && data.length > 0) {
        // Filter out undefined or invalid data points
        const validData = data.filter(item => 
          item && typeof item === 'object' && 
          xAxisKey in item && 
          dataKey in item && 
          item[dataKey] !== null && 
          item[dataKey] !== undefined
        );
        
        console.log(`LineChart "${title}" processing data:`, {
          dataKey,
          xAxisKey,
          originalDataLength: data.length,
          validDataLength: validData.length,
          sampleData: validData.slice(0, 2)
        });
        
        setChartData(validData);
        setIsEmpty(validData.length === 0);
      } else {
        console.log(`LineChart "${title}" has no valid data`);
        setChartData([]);
        setIsEmpty(true);
      }
    };
    
    processData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, xAxisKey, 
    // Use a stable data representation that won't change on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    data ? JSON.stringify(data.map(item => item ? {
      [xAxisKey]: item[xAxisKey],
      [dataKey]: item[dataKey]
    } : null)) : '[]'
  ]);
  
  // Render loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[380px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  // Render empty state
  if (isEmpty) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[380px] text-center">
          <div className="text-muted-foreground">{emptyMessage}</div>
        </CardContent>
      </Card>
    );
  }
  
  // Render chart only if mounted and chart components are loaded
  if (!isMounted || !Chart) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="h-[380px]">
          {/* Placeholder for chart that will be loaded client-side */}
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Destructure chart components
  const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = Chart;
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`tooltip-${index}`} style={{ color: entry.color }} className="font-medium">
              {`${entry.name}: ${entry.value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${unit}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Render the chart
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 30,
              right: 40,
              left: 30,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey={xAxisKey} 
              angle={-45} 
              textAnchor="end"
              height={80} 
              tick={{ fontSize: 12, fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              label={{ value: "Mois", position: 'insideBottom', offset: -5, fontSize: 12, dy: 10 }}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              width={70}
              label={{ value: unit ? `Valeur (${unit})` : "Valeur", angle: -90, position: 'insideLeft', offset: -15, fontSize: 12, dx: -10 }}
              tickFormatter={(value: number) => value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {/* Render main data line */}
            <Line 
              type="monotone"
              dataKey={dataKey} 
              name={unit ? `Valeur (${unit})` : "Valeur"}
              stroke={lineColor} 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            
            {/* Render additional data lines if provided */}
            {additionalDataKeys.map((item, index) => (
              <Line
                key={`line-${item.key}-${index}`}
                type="monotone"
                dataKey={item.key}
                name={item.name}
                stroke={item.color}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
