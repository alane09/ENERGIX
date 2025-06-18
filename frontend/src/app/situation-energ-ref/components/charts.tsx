/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  TooltipProps,
  XAxis,
  YAxis
} from "recharts";
import { ValueType } from "recharts/types/component/DefaultTooltipContent";
import { ChartData } from "../types";

interface ChartsTabProps {
  data: ChartData | null;
  rSquared?: number;
  regressionEquation?: string;
  vehicleType: "VOITURE" | "CAMION";
}

const CustomScatterTooltip = ({ 
  payload 
}: TooltipProps<ValueType, string>) => {
  if (!payload?.length) return null;
  const data = payload[0].payload as { x: number; y: number };
  return (
    <div className="bg-white p-2 border rounded shadow">
      <p>{payload[0].name === "Kilométrage parcouru" ? "Kilométrage" : "Tonnage"}: {data.x.toLocaleString('fr-FR')}</p>
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

export function ChartsTab({ data, rSquared, regressionEquation, vehicleType }: ChartsTabProps) {
  if (!data) return null;

  const kmScale = vehicleType === "VOITURE" ? 60000 : 100000;
  const consumptionScale = vehicleType === "VOITURE" ? 16000 : 25000;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <Tabs defaultValue="scatter">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="scatter">Situation Énergétique de Référence 2023</TabsTrigger>
                <TabsTrigger value="monthly">Tendances mensuelles</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="scatter" className="h-[400px]">
            <div className="flex flex-col h-full">
              <div className="text-center text-lg font-semibold mb-2">
                Situation Énergétique de Référence 2023
              </div>
              <ResponsiveContainer width="100%" height="90%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="x" 
                    type="number"
                    domain={[0, kmScale]}
                    ticks={Array.from({ length: 7 }, (_, i) => Math.round(i * kmScale / 6))}
                  />
                  <YAxis 
                    dataKey="y"
                    domain={[0, consumptionScale]}
                    ticks={Array.from({ length: 9 }, (_, i) => Math.round(i * consumptionScale / 8))}
                  />
                  <RechartsTooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={CustomScatterTooltip}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                  <Scatter 
                    name="Kilométrage parcouru" 
                    data={data.kilometrageScatter.points} 
                    fill="#3b82f6"
                  />
                  <Line
                    name="Linear (Kilométrage parcouru)"
                    data={data.kilometrageScatter.regressionLine}
                    type="linear"
                    dataKey="y"
                    stroke="#3b82f6"
                    dot={false}
                    legendType="none"
                  />
                  {/* Only show tonnage scatter and line for trucks */}
                  {vehicleType === "CAMION" && (
                    <>
                      <Scatter 
                        name="Tonnage transporté" 
                        data={data.tonnageScatter.points} 
                        fill="#22c55e"
                      />
                      <Line
                        name="Linear (Tonnage transporté)"
                        data={data.tonnageScatter.regressionLine}
                        type="linear"
                        dataKey="y"
                        stroke="#22c55e"
                        dot={false}
                        legendType="none"
                      />
                    </>
                  )}
                </ScatterChart>
              </ResponsiveContainer>
              {regressionEquation && (
                <div className="text-center text-sm font-mono p-2 rounded mt-2 mx-auto" style={{ backgroundColor: '#D2B48C' }}>
                  {regressionEquation}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyTrends} margin={{ top: 20, right: 20, bottom: 20, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month">
                  <Label value="Mois" position="bottom" offset={20} />
                </XAxis>
                <YAxis>
                  <Label value="Consommation (L)" angle={-90} position="left" offset={-20} />
                </YAxis>
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