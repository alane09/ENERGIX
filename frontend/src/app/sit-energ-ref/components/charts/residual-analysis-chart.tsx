"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { formatNumber } from "../../utils/format";

interface ResidualAnalysisChartProps {
  data: Array<{
    name: string;
    actual: number;
    predicted: number;
    residual: number;
  }>;
}

export function ResidualAnalysisChart({ data }: ResidualAnalysisChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyse des résidus</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{
                top: 20,
                right: 20,
                bottom: 20,
                left: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="predicted"
                name="Prédit"
                label={{ value: "Valeurs prédites", position: "bottom" }}
              />
              <YAxis
                type="number"
                dataKey="actual"
                name="Réel"
                label={{ value: "Valeurs réelles", angle: -90, position: "left" }}
              />
              <Tooltip
                formatter={(value: number) => formatNumber(value, 2)}
                labelFormatter={(label) => `Point ${label}`}
              />
              <Legend />
              <Scatter
                name="Valeurs réelles vs prédites"
                data={data}
                fill="#8884d8"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 