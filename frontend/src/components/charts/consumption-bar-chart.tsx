"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import React from "react";

interface ConsumptionBarChartProps {
  data: any[];
  title: string;
  description?: string;
  xAxisKey?: string;
  dataKey?: string;
  barColor?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  unit?: string;
}

export default function ConsumptionBarChart({
  data,
  title,
  description = "",
  xAxisKey = "name",
  dataKey = "value",
  barColor = "#3B82F6",
  isLoading = false,
  emptyMessage = "Aucune donnée disponible",
  className = "",
  unit = "L"
}: ConsumptionBarChartProps) {
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
        BarChart: RechartsModule.BarChart,
        Bar: RechartsModule.Bar,
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
        
        setChartData(validData);
        setIsEmpty(validData.length === 0);
      } else {
        setChartData([]);
        setIsEmpty(true);
      }
    };
    
    processData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, xAxisKey, 
    // Use a stable data representation that won't change on every render
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
        <CardContent className="flex items-center justify-center h-[300px]">
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
        <CardContent className="flex flex-col items-center justify-center h-[300px] text-center">
          <div className="text-muted-foreground">{emptyMessage}</div>
        </CardContent>
      </Card>
    );
  }
  
  // Only render chart when component is mounted and Chart is loaded
  if (!isMounted || !Chart) {
    return <div className="h-full flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>;
  }

  // Destructure chart components
  const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = Chart;

  // Custom tooltip component - defined inside renderContent to access Chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-[#3B82F6] font-medium text-base">
            {`${payload[0].value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${unit}`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Render the chart
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 30,
                right: 30,
                left: 30,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
              <XAxis 
                dataKey={xAxisKey} 
                angle={-45} 
                textAnchor="end"
                height={80} 
                tick={{ fontSize: 12, fontWeight: 500 }}
                tickLine={true}
                axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1.5 }}
                label={{ value: "Véhicule", position: 'insideBottom', offset: -5, fontSize: 12, dy: 10 }}
                interval={0}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={true}
                axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1.5 }}
                width={70}
                label={{ value: unit ? `Valeur (${unit})` : "Valeur", angle: -90, position: 'insideLeft', offset: -15, fontSize: 12, dx: -10 }}
                tickFormatter={(value: number) => value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                formatter={(value: string) => <span className="text-sm font-medium">{value}</span>}
              />
              <Bar 
                dataKey={dataKey} 
                name={unit ? `Valeur (${unit})` : "Valeur"}
                fill={barColor} 
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
