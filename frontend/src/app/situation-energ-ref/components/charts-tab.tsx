"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Download } from "lucide-react";
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

type Point = {
  x: number;
  y: number;
};

interface ChartsTabProps {
  data: ChartData | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
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

function calculateTicks(min: number, max: number, count: number): number[] {
  if (min === max) {
    return [min];
  }
  
  // Round min and max to nearest thousand
  min = Math.floor(min / 1000) * 1000;
  max = Math.ceil(max / 1000) * 1000;
  
  const step = (max - min) / (count - 1);
  const roundedStep = Math.ceil(step / 1000) * 1000; // Round step to nearest thousand
  
  const ticks = [];
  for (let i = 0; i < count; i++) {
    ticks.push(min + roundedStep * i);
  }
  
  return ticks;
}

function formatAxisTick(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return value.toString();
}

export function ChartsTab({ data, isLoading, error, onRetry }: ChartsTabProps) {
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export functionality to be implemented");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Réessayer
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="text-center p-8">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune donnée disponible</h3>
          <p className="text-muted-foreground">
            Aucune donnée n'est disponible pour générer les graphiques
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate dynamic domain and ticks for kilometrage
  const kmValues = data.kilometrageScatter.points.map(p => p.x);
  const minKm = Math.min(...kmValues);
  const maxKm = Math.max(...kmValues);
  const kmTicks = calculateTicks(minKm, maxKm, 7);

  // Calculate dynamic domain and ticks for tonnage
  const tonnageValues = data.tonnageScatter?.points.map(p => p.x) || [];
  const minTonnage = Math.min(...tonnageValues);
  const maxTonnage = Math.max(...tonnageValues);
  const tonnageTicks = calculateTicks(minTonnage, maxTonnage, 7);

  // Calculate dynamic domain and ticks for consumption (y-axis)
  const consumptionValues = [
    ...data.kilometrageScatter.points.map(p => p.y),
    ...(data.tonnageScatter?.points.map(p => p.y) || [])
  ];
  const minConsumption = Math.min(...consumptionValues);
  const maxConsumption = Math.max(...consumptionValues);
  const consumptionTicks = calculateTicks(minConsumption, maxConsumption, 9);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Visualisation des données</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
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
                  domain={[minKm, maxKm]}
                  ticks={kmTicks}
                  tickFormatter={formatAxisTick}
                  label={{ value: 'Kilométrage (km)', position: 'bottom', offset: -10 }}
                />
                <YAxis 
                  dataKey="y" 
                  name="Consommation"
                  domain={[minConsumption, maxConsumption]}
                  ticks={consumptionTicks}
                  tickFormatter={formatAxisTick}
                  label={{ value: 'Consommation (L)', angle: -90, position: 'insideLeft' }}
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
                  domain={tonnageValues.length > 0 ? [minTonnage, maxTonnage] : undefined}
                  ticks={tonnageValues.length > 0 ? tonnageTicks : undefined}
                  tickFormatter={formatAxisTick}
                  label={{ value: 'Tonnage (t)', position: 'bottom', offset: -10 }}
                />
                <YAxis 
                  dataKey="y" 
                  name="Consommation"
                  domain={[minConsumption, maxConsumption]}
                  ticks={consumptionTicks}
                  tickFormatter={formatAxisTick}
                  label={{ value: 'Consommation (L)', angle: -90, position: 'insideLeft' }}
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
              <LineChart data={data.monthlyTrends} margin={{ top: 20, right: 30, bottom: 30, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month"
                  label={{ value: 'Mois', position: 'bottom' }}
                />
                <YAxis 
                  domain={[minConsumption, maxConsumption]}
                  ticks={consumptionTicks}
                  tickFormatter={formatAxisTick}
                  label={{ value: 'Consommation (L)', angle: -90, position: 'insideLeft' }}
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
        </CardContent>
      </Card>
    </div>
  );
}
