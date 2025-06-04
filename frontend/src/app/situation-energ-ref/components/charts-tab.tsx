"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import { ValueType } from "recharts/types/component/DefaultTooltipContent";
import { ChartData } from "../types";
import { CustomTooltip } from "./ui/custom-tooltip";

interface ChartsTabProps {
  data: ChartData | null;
}

const CustomScatterTooltip = ({ 
  payload 
}: TooltipProps<ValueType, string>) => {
  if (!payload?.length) return null;
  const data = payload[0].payload as { x: number; y: number };
  return (
    <div className="bg-white p-2 border rounded shadow">
      <p>Kilométrage: {data.x.toLocaleString('fr-FR')}</p>
      <p>Consommation: {data.y.toLocaleString('fr-FR')} L</p>
    </div>
  );
};

const CustomLineTooltip = ({ 
  payload, 
  label 
}: TooltipProps<ValueType, string>) => {
  if (!payload?.length) return null;
  return (
    <div className="bg-white p-2 border rounded shadow">
      <p className="font-semibold">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} style={{ color: entry.color }}>
          {entry.name}: {entry.value?.toLocaleString('fr-FR')} L
        </p>
      ))}
    </div>
  );
};

export function ChartsTab({ data }: ChartsTabProps) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <Tabs defaultValue="kilometrage">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="kilometrage">Kilométrage</TabsTrigger>
              <TabsTrigger value="tonnage">Tonnage</TabsTrigger>
              <TabsTrigger value="monthly">Tendances mensuelles</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <CustomTooltip
                trigger={
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="text-sm">Données</span>
                  </div>
                }
                content="Points de données réels"
              />
              <CustomTooltip
                trigger={
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="text-sm">Régression</span>
                  </div>
                }
                content="Ligne de régression calculée"
              />
            </div>
          </div>

          <TabsContent value="kilometrage" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="x" 
                  name="Kilométrage"
                  label={{ value: 'Kilométrage', position: 'bottom' }}
                />
                <YAxis 
                  dataKey="y" 
                  name="Consommation"
                  label={{ value: 'Consommation (L)', angle: -90, position: 'left' }}
                />
                <RechartsTooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={CustomScatterTooltip}
                />
                <Scatter 
                  name="Points" 
                  data={data.kilometrageScatter.points} 
                  fill="#3b82f6"
                />
                <Scatter 
                  name="Régression" 
                  data={data.kilometrageScatter.regressionLine} 
                  line={{ stroke: '#ef4444' }}
                  shape={undefined}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="tonnage" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="x" 
                  name="Tonnage"
                  label={{ value: 'Tonnage', position: 'bottom' }}
                />
                <YAxis 
                  dataKey="y" 
                  name="Consommation"
                  label={{ value: 'Consommation (L)', angle: -90, position: 'left' }}
                />
                <RechartsTooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={CustomScatterTooltip}
                />
                {data.tonnageScatter && (
                  <>
                    <Scatter 
                      name="Points" 
                      data={data.tonnageScatter.points} 
                      fill="#3b82f6"
                    />
                    <Scatter 
                      name="Régression" 
                      data={data.tonnageScatter.regressionLine} 
                      line={{ stroke: '#ef4444' }}
                      shape={undefined}
                    />
                  </>
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="monthly" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyTrends} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month"
                  label={{ value: 'Mois', position: 'bottom' }}
                />
                <YAxis 
                  label={{ value: 'Consommation (L)', angle: -90, position: 'left' }}
                />
                <RechartsTooltip content={CustomLineTooltip} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Consommation actuelle"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
                <Line
                  type="monotone"
                  dataKey="Consommation de référence"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444' }}
                />
                <Line
                  type="monotone"
                  dataKey="Consommation cible"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
