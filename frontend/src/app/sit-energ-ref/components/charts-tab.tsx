"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { useMonthlyData, useRegressionData } from "../hooks/use-regression-data";
import { useFilterStore } from "../store";
import { formatNumber } from "../utils/format";

export function ChartsTab() {
  const { vehicleType, year, region, percentage } = useFilterStore();
  const { data: regression, isLoading: isRegressionLoading, error: regressionError } = useRegressionData(vehicleType, year, region);
  const { data: monthly, isLoading: isMonthlyLoading, error: monthlyError } = useMonthlyData(vehicleType, year, region);

  if (regressionError || monthlyError) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-red-500">
            Erreur: {regressionError?.message || monthlyError?.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isRegressionLoading || isMonthlyLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!regression || !monthly) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-gray-500">Aucune donnée disponible</div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for scatter plots with regression lines using monthly data
  const scatterDataKilometrage = monthly.map(month => {
    const avgKilometrage = month.kilometrage / month.count;
    const avgConsommation = month.consommation / month.count;
    return {
      month: month.month,
      kilometrage: avgKilometrage,
      consommation: avgConsommation,
      predictedConsommation: regression.intercept + 
        regression.coefficients.kilometrage * avgKilometrage + 
        (regression.coefficients.tonnage || 0) * (month.produitsTonnes / month.count)
    };
  });

  const scatterDataTonnage = monthly.map(month => {
    const avgTonnage = month.produitsTonnes / month.count;
    const avgConsommation = month.consommation / month.count;
    return {
      month: month.month,
      tonnage: avgTonnage,
      consommation: avgConsommation,
      predictedConsommation: regression.intercept + 
        regression.coefficients.kilometrage * (month.kilometrage / month.count) + 
        (regression.coefficients.tonnage || 0) * avgTonnage
    };
  });

  // Regression lines for scatter plots
  const minKilometrage = Math.min(...monthly.map(m => m.kilometrage / m.count));
  const maxKilometrage = Math.max(...monthly.map(m => m.kilometrage / m.count));
  const minTonnage = Math.min(...monthly.map(m => m.produitsTonnes / m.count));
  const maxTonnage = Math.max(...monthly.map(m => m.produitsTonnes / m.count));

  const regressionLineKilometrage = [
    {
      x: minKilometrage,
      y: regression.intercept + regression.coefficients.kilometrage * minKilometrage
    },
    {
      x: maxKilometrage,
      y: regression.intercept + regression.coefficients.kilometrage * maxKilometrage
    }
  ];

  const regressionLineTonnage = [
    {
      x: minTonnage,
      y: regression.intercept + (regression.coefficients.tonnage || 0) * minTonnage
    },
    {
      x: maxTonnage,
      y: regression.intercept + (regression.coefficients.tonnage || 0) * maxTonnage
    }
  ];

  // Prepare monthly consumption data with reference, current, and target
  const monthlyConsumptionData = monthly.map(month => {
    const referenceConsommation = regression.intercept + 
      regression.coefficients.kilometrage * (month.kilometrage / month.count) +
      (regression.coefficients.tonnage || 0) * (month.produitsTonnes / month.count);
    
    const currentConsommation = month.consommation / month.count;
    const targetConsommation = referenceConsommation * (1 - percentage / 100);

    return {
      month: month.month,
      referenceConsommation,
      currentConsommation,
      targetConsommation
    };
  });

  return (
    <div className="space-y-6">
      {/* Scatter Plots */}
      <div className={`grid gap-6 ${vehicleType === 'CAMION' ? 'md:grid-cols-2' : ''}`}>
        <Card>
          <CardHeader>
            <CardTitle>Consommation vs Kilométrage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={scatterDataKilometrage} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="kilometrage" 
                    name="Kilométrage" 
                    unit=" km"
                    tickFormatter={(value) => formatNumber(value, 0)}
                  />
                  <YAxis 
                    dataKey="consommation" 
                    name="Consommation" 
                    unit=" L"
                    tickFormatter={(value) => formatNumber(value, 0)}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatNumber(value, 2)}
                    labelFormatter={(_, payload) => {
                      if (payload && payload[0]) {
                        const data = payload[0].payload;
                        return `Mois: ${data.month}\nKilométrage: ${formatNumber(data.kilometrage, 0)} km`;
                      }
                      return '';
                    }}
                  />
                  <Legend />
                  <Scatter 
                    name="Moyennes mensuelles" 
                    data={scatterDataKilometrage} 
                    fill="#8884d8" 
                  />
                  <ReferenceLine
                    segment={regressionLineKilometrage}
                    stroke="#82ca9d"
                    strokeWidth={2}
                    label={{ value: "Ligne de régression", position: "right" }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {vehicleType === 'CAMION' && (
          <Card>
            <CardHeader>
              <CardTitle>Consommation vs Tonnage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={scatterDataTonnage} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="tonnage" 
                      name="Tonnage" 
                      unit=" t"
                      tickFormatter={(value) => formatNumber(value, 1)}
                    />
                    <YAxis 
                      dataKey="consommation" 
                      name="Consommation" 
                      unit=" L"
                      tickFormatter={(value) => formatNumber(value, 0)}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatNumber(value, 2)}
                      labelFormatter={(_, payload) => {
                        if (payload && payload[0]) {
                          const data = payload[0].payload;
                          return `Mois: ${data.month}\nTonnage: ${formatNumber(data.tonnage, 1)} t`;
                        }
                        return '';
                      }}
                    />
                    <Legend />
                    <Scatter 
                      name="Moyennes mensuelles" 
                      data={scatterDataTonnage} 
                      fill="#8884d8" 
                    />
                    <ReferenceLine
                      segment={regressionLineTonnage}
                      stroke="#82ca9d"
                      strokeWidth={2}
                      label={{ value: "Ligne de régression", position: "right" }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Consumption Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des consommations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyConsumptionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => formatNumber(value, 0)}
                  unit=" L"
                />
                <Tooltip 
                  formatter={(value: number) => formatNumber(value, 2)}
                  labelFormatter={(label) => `Mois: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="referenceConsommation" 
                  stroke="#8884d8" 
                  name="Consommation de référence"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="currentConsommation" 
                  stroke="#82ca9d" 
                  name="Consommation actuelle"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="targetConsommation" 
                  stroke="#ff7300" 
                  name="Consommation cible"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
