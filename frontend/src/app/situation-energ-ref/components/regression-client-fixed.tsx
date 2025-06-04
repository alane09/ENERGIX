"use client";

import { ChartsTab } from "@/components/ser/charts-tab";
import { MonthlyDataTab } from "@/components/ser/monthly-data-tab";
import { OverviewTab } from "@/components/ser/overview-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { regressionAPI } from "../api/regression";
import { ChartData, MonthlyData, OverviewData, RegressionResult, ScatterPlotData } from "../types";

const VEHICLE_TYPES = {
  VOITURE: "Voiture",
  CAMION: "Camion"
} as const;

type VehicleType = keyof typeof VEHICLE_TYPES;

export function RegressionClient() {
  const [year, setYear] = useState<string>("2023");
  const [vehicleType, setVehicleType] = useState<VehicleType>("VOITURE");
  const [regressionResult, setRegressionResult] = useState<RegressionResult | null>(null);
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert RegressionResult to OverviewData
  const convertToOverviewData = (result: RegressionResult): OverviewData => ({
    coefficients: {
      kilometrage: result.coefficients.kilometrage,
      tonnage: result.coefficients.tonnage || 0,
    },
    intercept: result.intercept,
    multipleR: result.multipleR,
    rSquared: result.rSquared,
    adjustedRSquared: result.adjustedRSquared,
    standardError: result.standardError,
    observations: result.observations,
    degreesOfFreedom: result.degreesOfFreedom,
    sumOfSquares: result.sumOfSquares,
    meanSquare: result.meanSquare,
    fStatistic: result.fStatistic,
    significanceF: result.significanceF,
    standardErrors: result.standardErrors,
    tStats: result.tStats,
    pValues: result.pValues,
    lowerConfidence: result.lowerConfidence,
    upperConfidence: result.upperConfidence,
    predictedValues: result.predictedValues,
    residuals: result.residuals,
    equation: result.regressionEquation
  });

  useEffect(() => {
    async function fetchData() {
      if (!vehicleType || !year) return;

      setIsLoading(true);
      setError(null);
      
      try {
        // First try to get existing results
        let result = await regressionAPI.getResults(vehicleType, year);
        
        // If no results exist, perform new analysis
        if (!result) {
          result = await regressionAPI.analyzeAndSave(vehicleType, year);
        }

        // Get monthly data for charts and tables
        const monthlyDataResult = await regressionAPI.getMonthlyData(vehicleType, year);

        // Transform monthly data to chart format
        const chartData: ChartData = {
          kilometrageScatter: {
            points: monthlyDataResult.map(data => ({
              x: data.kilometrage,
              y: data.consommation
            })),
            regressionLine: result.predictedValues.map((y, i) => ({
              x: monthlyDataResult[i].kilometrage,
              y
            })),
            name: "Kilométrage"
          },
          tonnageScatter: vehicleType === "CAMION" ? {
            points: monthlyDataResult.map(data => ({
              x: data.tonnage,
              y: data.consommation
            })),
            regressionLine: result.predictedValues.map((y, i) => ({
              x: monthlyDataResult[i].tonnage,
              y
            })),
            name: "Tonnage"
          } : null,
          monthlyTrends: monthlyDataResult.map(data => ({
            month: data.month,
            "Consommation actuelle": data.consommation,
            "Consommation de référence": data.referenceConsommation,
            "Consommation cible": data.targetConsommation
          }))
        };

        setRegressionResult(result);
        setOverviewData(convertToOverviewData(result));
        setMonthlyData(monthlyDataResult);
        setChartData(chartData);
      } catch (error) {
        console.error("Error fetching regression data:", error);
        setError("Failed to fetch regression data. Please try again.");
        setRegressionResult(null);
        setOverviewData(null);
        setMonthlyData([]);
        setChartData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [vehicleType, year]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-[200px]">
          <Select
            value={vehicleType}
            onValueChange={(value: VehicleType) => setVehicleType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type de véhicule" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(VEHICLE_TYPES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[120px]">
          <Select
            value={year}
            onValueChange={setYear}
          >
            <SelectTrigger>
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              {["2023", "2024"].map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="monthly">Données mensuelles</TabsTrigger>
            <TabsTrigger value="charts">Graphiques</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab
              data={overviewData}
              onSaveCoefficients={async (coefficients) => {
                if (!regressionResult) return;
                try {
                  const updatedResult = await regressionAPI.updateResults(
                    regressionResult.id,
                    {
                      ...regressionResult,
                      coefficients: {
                        kilometrage: coefficients.kilometrage,
                        tonnage: vehicleType === "CAMION" ? coefficients.tonnage : null
                      },
                      intercept: coefficients.intercept
                    }
                  );
                  
                  setRegressionResult(updatedResult);
                  setOverviewData(convertToOverviewData(updatedResult));
                } catch (error) {
                  console.error("Error updating coefficients:", error);
                  setError("Failed to update coefficients. Please try again.");
                }
              }}
            />
          </TabsContent>

          <TabsContent value="monthly" className="mt-6">
            <MonthlyDataTab data={monthlyData} />
          </TabsContent>

          <TabsContent value="charts" className="mt-6">
            <ChartsTab data={chartData} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
