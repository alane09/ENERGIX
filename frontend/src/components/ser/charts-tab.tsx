"use client";

import { ChartData } from "@/app/situation-energ-ref/types";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartsTabProps {
  data: ChartData | null;
}

const EmptyShape = () => {
  return <></>;
};

export function ChartsTab({ data }: ChartsTabProps) {
  if (!data) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Aucune donnée disponible</h3>
        <p className="text-muted-foreground">
          Les données graphiques ne sont pas encore disponibles. Veuillez vérifier que des données ont été téléchargées pour ce type de véhicule.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Combined Regression Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Analyse de régression multiple</h3>
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{
                top: 20,
                right: 30,
                left: 40,
                bottom: 40,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="Variable"
                label={{ 
                  value: "Variable (km ou t)", 
                  position: "bottom",
                  offset: 20
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Consommation"
                unit=" L"
                domain={[0, 20000]}
                label={{ 
                  value: "Consommation (L)", 
                  angle: -90,
                  position: "left",
                  offset: 20
                }}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                formatter={(value: any) => [formatNumber(value), ""]}
                labelFormatter={(label: any) => `${formatNumber(label)}`}
              />
              <Legend />
              {/* Kilometrage data */}
              <Scatter
                name="Points (Kilométrage)"
                data={data.kilometrageScatter.points}
                fill="#8884d8"
              />
              <Scatter
                name="Régression (Kilométrage)"
                data={data.kilometrageScatter.regressionLine}
                line={{ stroke: "#8884d8" }}
                shape={EmptyShape}
                legendType="line"
              />
              {/* Tonnage data */}
              <Scatter
                name="Points (Tonnage)"
                data={data.tonnageScatter.points}
                fill="#82ca9d"
              />
              <Scatter
                name="Régression (Tonnage)"
                data={data.tonnageScatter.regressionLine}
                line={{ stroke: "#82ca9d" }}
                shape={EmptyShape}
                legendType="line"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Monthly Trends */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Évolution mensuelle de la consommation</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.monthlyTrends}
              margin={{
                top: 20,
                right: 30,
                left: 40,
                bottom: 40,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month"
                label={{ 
                  value: "Mois", 
                  position: "bottom",
                  offset: 20
                }}
              />
              <YAxis 
                unit=" L"
                domain={[0, 20000]}
                label={{ 
                  value: "Consommation (L)", 
                  angle: -90,
                  position: "left",
                  offset: 20
                }}
              />
              <Tooltip formatter={(value: any) => [formatNumber(value), "L"]} />
              <Legend verticalAlign="top" height={36} />
              <Line
                type="monotone"
                dataKey="Consommation actuelle"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Consommation de référence"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Consommation cible"
                stroke="#ffc658"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
