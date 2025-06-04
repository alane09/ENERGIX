'use client';

import React from 'react';
import { 
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useTheme } from 'next-themes';
import { VehicleTypeBreakdown } from '../../types/dashboard';

interface PieChartProps {
  data: VehicleTypeBreakdown[];
  title?: string;
  height?: number;
  dataKey?: string;
}

export function PieChart({ 
  data, 
  title, 
  height = 300,
  dataKey = 'value'
}: PieChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Generate colors based on the number of data points
  const generateColors = (count: number) => {
    const baseColors = [
      '#2563eb', // blue
      '#ef4444', // red
      '#22c55e', // green
      '#f59e0b', // amber
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#ec4899', // pink
      '#14b8a6', // teal
      '#f97316', // orange
      '#6366f1'  // indigo
    ];
    
    // If we have more data points than colors, repeat the colors
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-sm">{data.name}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {data.value.toFixed(2)} ({((data.value / data.totalValue) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Process data to add percentage and total value
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    
    return data.map(item => ({
      ...item,
      totalValue,
      percentage: (item.value / totalValue) * 100
    }));
  }, [data]);
  
  // Generate colors based on the number of data points
  const colors = React.useMemo(() => generateColors(processedData.length), [processedData]);
  
  return (
    <div className="w-full h-full">
      {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey={dataKey}
            label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
          >
            {processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            formatter={(value, entry, index) => (
              <span style={{ color: isDark ? '#fff' : '#000' }}>
                {value}
              </span>
            )}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
