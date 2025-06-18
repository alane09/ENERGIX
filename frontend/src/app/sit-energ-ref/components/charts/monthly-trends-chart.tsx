"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatNumber } from "../../utils/format";
import { MonthlyData } from "../../api/SER";

interface MonthlyTrendsChartProps {
  data: MonthlyData[];
}

export function MonthlyTrendsChart({ data }: MonthlyTrendsChartProps) {
  const chartData = data.map((month) => ({
    name: month.month,
    "IPE moyen": month.averageIpe,
    "IPE SER": month.averageIpeSer,
    "Consommation": month.totalConsommation,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendances mensuelles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 20,
                bottom: 20,
                left: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                label={{ value: "Mois", position: "bottom" }}
              />
              <YAxis
                label={{
                  value: "Valeur",
                  angle: -90,
                  position: "left",
                }}
              />
              <Tooltip
                formatter={(value: number) => formatNumber(value, 2)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="IPE moyen"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="IPE SER"
                stroke="#82ca9d"
              />
              <Line
                type="monotone"
                dataKey="Consommation"
                stroke="#ffc658"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 