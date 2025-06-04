'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricDefinition } from "../types";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from "recharts";
import { useTheme } from "next-themes";

interface ChartCardProps {
  title: string;
  metric: MetricDefinition;
  data: any[];
  type: 'line' | 'bar' | 'pie';
  className?: string;
  height?: number;
}

const CHART_COLORS = [
  { light: '#60a5fa', dark: '#3b82f6' }, // blue
  { light: '#4ade80', dark: '#22c55e' }, // green
  { light: '#f87171', dark: '#ef4444' }, // red
  { light: '#fbbf24', dark: '#d97706' }, // amber
  { light: '#a78bfa', dark: '#7c3aed' }, // purple
  { light: '#fb923c', dark: '#ea580c' }, // orange
];

export function ChartCard({
  title,
  metric,
  data,
  type,
  className,
  height = 350
}: ChartCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const getColor = (index: number) => {
    const colorSet = CHART_COLORS[index % CHART_COLORS.length];
    return isDark ? colorSet.dark : colorSet.light;
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit={` ${metric.unit}`} />
              <Tooltip />
              <Legend />
              {data[0] && Object.keys(data[0])
                .filter(key => key !== 'name')
                .map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={getColor(index)}
                    activeDot={{ r: 8 }}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit={` ${metric.unit}`} />
              <Tooltip />
              <Legend />
              {data[0] && Object.keys(data[0])
                .filter(key => key !== 'name')
                .map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={getColor(index)}
                  />
                ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={height / 3}
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(index)} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {title}
          <span className="text-sm font-normal text-muted-foreground">
            ({metric.unit})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          renderChart()
        ) : (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            Aucune donnée disponible
          </div>
        )}
      </CardContent>
    </Card>
  );
}
