'use client';

import React, { useMemo } from 'react';
import { 
  Bar,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { useTheme } from 'next-themes';
import { MonthlyData, normalizeVehicleType } from '../../types/dashboard';

interface BarChartProps {
  data: MonthlyData[];
  dataKey: string;
  title?: string;
  showAverage?: boolean;
  height?: number;
  isIPETonne?: boolean;
  selectedRegion?: string;
  selectedVehicleType?: string;
}

export function BarChart({ 
  data, 
  dataKey, 
  title, 
  showAverage = true, 
  height = 300,
  isIPETonne = false,
  selectedRegion = 'all',
  selectedVehicleType = 'all'
}: BarChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Get the appropriate data key from MonthlyData
  const getDataKey = (key: string): keyof MonthlyData => {
    switch (key) {
      case 'consumption':
        return 'consommation';
      case 'kilometrage':
        return 'kilometrage';
      case 'ipe':
        return 'ipe';
      case 'tonnage':
        return 'produitsTonnes';
      case 'ipeTonne':
        return 'ipeTonne';
      default:
        return 'consommation';
    }
  };
  
  // Get the appropriate unit for the data key
  const getUnit = (key: string): string => {
    switch (key) {
      case 'consumption':
        return 'L';
      case 'kilometrage':
        return 'km';
      case 'ipe':
        return 'L/100km';
      case 'tonnage':
        return 'T';
      case 'ipeTonne':
        return 'L/100km.T';
      default:
        return '';
    }
  };
  
  // Calculate average value for reference line
  const averageValue = useMemo(() => {
    if (!showAverage || !data || data.length === 0) return null;
    
    const validData = data.filter(item => 
      item && 
      typeof item === 'object' && 
      getDataKey(dataKey) in item && 
      item[getDataKey(dataKey)] !== null && 
      item[getDataKey(dataKey)] !== undefined
    );
    
    if (validData.length === 0) return null;
    
    const sum = validData.reduce((acc, item) => {
      const value = item[getDataKey(dataKey)];
      return acc + (typeof value === 'number' ? value : 0);
    }, 0);
    
    return sum / validData.length;
  }, [data, dataKey, showAverage]);
  
  // Format tooltip values
  const formatValue = (value: number, key: string) => {
    if (value === undefined || value === null) return 'N/A';
    
    if (key === 'ipeTonne') {
      return `${value.toFixed(4)} L/100km.T`;
    }
    
    if (key === 'ipe') {
      return `${value.toFixed(2)} L/100km`;
    }
    
    return `${value.toFixed(2)} ${getUnit(key)}`;
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // If we're showing all vehicle types, we'll have multiple values in the payload
      const isMultipleVehicleTypes = selectedVehicleType === 'all' && payload.length > 1;
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-sm">{label}</p>
          
          {isMultipleVehicleTypes ? (
            // Show values for each vehicle type
            <div className="space-y-1 mt-1">
              {payload.map((entry: any, index: number) => {
                // Extract vehicle type from dataKey (e.g., 'camions_consumption' -> 'camions')
                const vehicleType = entry.dataKey.split('_')[0];
                const vehicleLabel = vehicleType === 'camions' ? 'Camions' : 
                                    vehicleType === 'voitures' ? 'Voitures' : 'Chariots';
                
                return (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-xs font-medium" style={{ color: entry.fill }}>
                      {vehicleLabel}:
                    </span>
                    <span className="text-xs ml-2" style={{ color: entry.fill }}>
                      {formatValue(entry.value, dataKey)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            // Show single value
            <p className="text-sm" style={{ color: payload[0].fill || 'var(--blue-600)' }}>
              {formatValue(payload[0].value, dataKey)}
            </p>
          )}
          
          {selectedRegion !== 'all' && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Région: {selectedRegion === 'tunis' ? 'Tunis' : 'Mjez El Beb'}
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  // Format Y-axis ticks
  const formatYAxis = (value: number) => {
    if (isIPETonne) {
      return value.toFixed(4);
    }
    return value.toFixed(1);
  };
  
  // Get the processed data
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      ...item,
      [dataKey]: item[getDataKey(dataKey)]
    }));
  }, [data, dataKey]);
  
  // Define colors for different vehicle types
  const vehicleTypeColors = {
    camions: '#2563eb', // blue
    voitures: '#16a34a', // green
    chariots: '#d97706', // amber
    all: '#6366f1' // indigo
  };
  
  return (
    <div className="w-full h-full">
      {title && (
        <h3 className="text-sm font-medium mb-2">
          {title}
          {selectedRegion !== 'all' && (
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              ({selectedRegion === 'tunis' ? 'Tunis' : 'Mjez El Beb'})
            </span>
          )}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={processedData}
          margin={{ top: 10, right: 30, left: isIPETonne ? 50 : 40, bottom: 20 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} 
          />
          <XAxis 
            dataKey="month" 
            stroke={isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'} 
            tick={{ fontSize: 12 }}
            tickMargin={10}
          />
          <YAxis 
            stroke={isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'} 
            tick={{ fontSize: 12 }}
            tickFormatter={formatYAxis}
            tickMargin={10}
            width={isIPETonne ? 50 : 40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {selectedVehicleType === 'all' ? (
            // If 'all' is selected, show multiple bars with different colors
            Object.entries(vehicleTypeColors).map(([type, color]) => {
              if (type === 'all') return null; // Skip the 'all' entry
              return (
                <Bar
                  key={type}
                  name={type === 'camions' ? 'Camions' : type === 'voitures' ? 'Voitures' : 'Chariots'}
                  dataKey={`${type}_${dataKey}`}
                  fill={color as string}
                  radius={[4, 4, 0, 0]}
                  barSize={15}
                />
              );
            })
          ) : (
            // If a specific vehicle type is selected, show just one bar
            <Bar
              dataKey={dataKey}
              fill={vehicleTypeColors[selectedVehicleType as keyof typeof vehicleTypeColors] || '#2563eb'}
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          )}
          {averageValue !== null && (
            <ReferenceLine
              y={averageValue}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="3 3"
              label={{
                value: `Moyenne: ${isIPETonne ? averageValue.toFixed(4) : averageValue.toFixed(2)}`,
                fill: isDark ? '#fff' : '#000',
                fontSize: 12,
                position: 'insideBottomRight'
              }}
            />
          )}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
