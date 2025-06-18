"use client";

import { useRegressionData, useVehicleDetails, useMonthlyData } from "../hooks/use-regression-data";
import { useFilterStore } from "../store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "../utils/format";
import { RegressionData, VehicleData, MonthlyData } from "../types";

export function OverviewTab() {
  const { vehicleType, year, region } = useFilterStore();
  const { data: regression, isLoading: isRegressionLoading, error: regressionError } = useRegressionData(vehicleType, year, region);
  const { data: vehicles, isLoading: isVehiclesLoading, error: vehiclesError } = useVehicleDetails(vehicleType, year, region);
  const { data: monthly, isLoading: isMonthlyLoading, error: monthlyError } = useMonthlyData(vehicleType, year, region);

  if (regressionError || vehiclesError || monthlyError) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-red-500">
            Erreur: {regressionError?.message || vehiclesError?.message || monthlyError?.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isRegressionLoading || isVehiclesLoading || isMonthlyLoading) {
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

  if (!regression || !vehicles || !monthly) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-gray-500">Aucune donnée disponible</div>
        </CardContent>
      </Card>
    );
  }

  const vehicleArray = Array.isArray(vehicles) ? vehicles : [];
  const monthlyArray = Array.isArray(monthly) ? monthly : [];

  const totalKilometrage = vehicleArray.reduce((acc, v) => acc + (v.kilometrage || 0), 0);
  const totalConsommation = vehicleArray.reduce((acc, v) => acc + (v.consommationL || 0), 0);
  const averageIpe = vehicleArray.length > 0 ? vehicleArray.reduce((acc, v) => acc + (v.ipeL100km || 0), 0) / vehicleArray.length : 0;
  const averageIpeSer = vehicleArray.length > 0 ? vehicleArray.reduce((acc, v) => acc + (v.ipeSerL100km || 0), 0) / vehicleArray.length : 0;

  return (
    <div className="space-y-6">
      {/* Regression Equation and Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Équation de régression</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="font-mono text-lg bg-muted/50 p-4 rounded-lg">
              {regression.regressionEquation}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Coefficients</h4>
                <ul className="space-y-1">
                  {regression.coefficients && Object.entries(regression.coefficients).map(([key, value]) => (
                    <li key={key} className="text-sm">
                      {key}: {formatNumber(value || 0, 4)}
                    </li>
                  ))}
                  <li className="text-sm">
                    intercept: {formatNumber(regression.intercept, 4)}
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Statistiques</h4>
                <ul className="space-y-1">
                  <li className="text-sm">R²: {formatNumber(regression.rSquared, 4)}</li>
                  <li className="text-sm">R² ajusté: {formatNumber(regression.adjustedRSquared, 4)}</li>
                  <li className="text-sm">MSE: {formatNumber(regression.mse, 4)}</li>
                  <li className="text-sm">RMSE: {formatNumber(regression.rmse, 4)}</li>
                  <li className="text-sm">MAE: {formatNumber(regression.mae, 4)}</li>
                  <li className="text-sm">AIC: {formatNumber(regression.aic, 4)}</li>
                  <li className="text-sm">BIC: {formatNumber(regression.bic, 4)}</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Nombre de véhicules</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{vehicleArray.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moyenne IPE (L/100km)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(averageIpe, 2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moyenne IPE SER (L/100km)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(averageIpeSer, 2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total kilométrage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalKilometrage, 0)} km</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total consommation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(totalConsommation, 0)} L</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consommation moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(vehicleArray.length > 0 ? totalConsommation / vehicleArray.length : 0, 0)} L</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kilométrage moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(vehicleArray.length > 0 ? totalKilometrage / vehicleArray.length : 0, 0)} km</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mois analysés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{monthlyArray.length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
