"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Car, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { regressionAPI } from "../api/regression";
import { ChartData, MonthlyData, OverviewData, RegressionResult } from "../types";
import { ChartsTab } from "./charts";
import { MonthlyDataTab } from "./monthly-data-tab";
import { OverviewTab } from "./overview";
import { CustomTooltip } from "./ui/custom-tooltip";

const VEHICLE_TYPES = {
  VOITURE: "Voiture",
  CAMION: "Camion"
} as const;

const REGIONS = {
  TUNIS: "Tunis",
  MJEZ: "Mjez el beb"
} as const;

type VehicleType = keyof typeof VEHICLE_TYPES;
type Region = keyof typeof REGIONS;

const VEHICLE_ICONS = {
  VOITURE: Car,
  CAMION: Truck
} as const;

export function RegressionClient() {
  const [year, setYear] = useState<string>("2025");
  const [vehicleType, setVehicleType] = useState<VehicleType>("VOITURE");
  const [region, setRegion] = useState<string>("all");
  const [targetPercentage, setTargetPercentage] = useState<number>(3);
  const [regressionResult, setRegressionResult] = useState<RegressionResult | null>(null);
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

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
        const regressionYear = year === "2025" ? "2024" : (parseInt(year) - 1).toString();
        
        const selectedRegion = region === 'all' ? undefined : region;
        const prevYearResult = await regressionAPI.getResults(vehicleType, regressionYear, selectedRegion)
          || await regressionAPI.analyzeAndSave(vehicleType, regressionYear, selectedRegion);

        if (!prevYearResult) {
          throw new Error(`Failed to get regression results for ${regressionYear}`);
        }

        const result = year === "2025" 
          ? prevYearResult
          : await regressionAPI.getResults(vehicleType, year, selectedRegion)
            || await regressionAPI.analyzeAndSave(vehicleType, year, selectedRegion);

        if (!result) {
          throw new Error(`Failed to get regression results for ${year}`);
        }

        let monthlyDataResult = await regressionAPI.getMonthlyData(vehicleType, year, selectedRegion);

        const monthOrder = [
          "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
          "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
        ];
        monthlyDataResult = monthlyDataResult.sort((a, b) => 
          monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
        );

        const processedMonthlyData = monthlyDataResult.map(data => {
          const referenceConsommation = vehicleType === "VOITURE" 
            ? prevYearResult.coefficients.kilometrage * data.kilometrage + prevYearResult.intercept
            : prevYearResult.coefficients.kilometrage * data.kilometrage + 
              prevYearResult.coefficients.tonnage! * (data.tonnage / 1000.0) + 
              prevYearResult.intercept;

          const targetConsommation = referenceConsommation * (1 - (targetPercentage / 100));
          const improvementPercentage = ((data.consommation - referenceConsommation) / data.consommation) * 100;
          const ipe = (data.consommation / data.kilometrage) * 100; // L/100km

          return {
            ...data,
            referenceConsommation,
            improvementPercentage,
            targetConsommation,
            ipe
          };
        });

        const minKm = 0;
        const maxKm = Math.max(...processedMonthlyData.map(d => d.kilometrage));
        const kmStep = (maxKm - minKm) / 20;

        const kilometragePoints = Array.from({ length: 21 }, (_, i) => {
          const x = minKm + (i * kmStep);
          const avgTonnage = vehicleType === "CAMION" 
            ? processedMonthlyData.reduce((sum, d) => sum + d.tonnage / 1000.0, 0) / processedMonthlyData.length 
            : 0;
          const y = vehicleType === "VOITURE"
            ? result.coefficients.kilometrage * x + result.intercept
            : result.coefficients.kilometrage * x + result.coefficients.tonnage! * avgTonnage + result.intercept;
          return { x, y };
        });

        let tonnagePoints = null;
        if (vehicleType === "CAMION") {
          const minTon = Math.min(...processedMonthlyData.map(d => d.tonnage));
          const maxTon = Math.max(...processedMonthlyData.map(d => d.tonnage));
          const tonStep = (maxTon - minTon) / 20;
          const avgKm = processedMonthlyData.reduce((sum, d) => sum + d.kilometrage, 0) / processedMonthlyData.length;
          
          tonnagePoints = Array.from({ length: 21 }, (_, i) => {
            const x = minTon + (i * tonStep);
            const y = result.coefficients.kilometrage * avgKm + result.coefficients.tonnage! * x + result.intercept;
            return { x, y };
          });
        }

        const chartData: ChartData = {
          kilometrageScatter: {
            points: processedMonthlyData.map(data => ({
              x: data.kilometrage,
              y: data.consommation
            })),
            regressionLine: kilometragePoints,
            name: "Kilométrage"
          },
          tonnageScatter: {
            points: processedMonthlyData.map(data => ({
              x: data.tonnage,
              y: data.consommation
            })),
            regressionLine: tonnagePoints || [],
            name: "Tonnage"
          },
          monthlyTrends: processedMonthlyData.map(data => ({
            month: data.month,
            "Consommation actuelle": data.consommation,
            "Consommation de référence": data.referenceConsommation,
            "Consommation cible": data.targetConsommation,
            "Amélioration (%)": data.improvementPercentage,
            "IPE (L/100km)": data.ipe,
            "Distance parcourue (km)": data.kilometrage,
            region: data.region
          }))
        };

        setRegressionResult(result);
        setOverviewData(convertToOverviewData(result));
        setMonthlyData(processedMonthlyData);
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
  }, [vehicleType, year, targetPercentage, region]);

  const VehicleIcon = VEHICLE_ICONS[vehicleType];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">
              Analyse de Régression
            </h1>
            <div className="flex items-center gap-4">
              <CustomTooltip
                trigger={
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span>Modèle valide</span>
                  </div>
                }
                content={
                  regressionResult?.rSquared
                    ? `R² = ${(regressionResult.rSquared * 100).toFixed(2)}%`
                    : "Chargement..."
                }
              />
            </div>
          </div>

          {/* Filters */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-4 min-w-[200px]">
                <VehicleIcon className="h-5 w-5 text-muted-foreground" />
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

              <div className="flex items-center gap-4 min-w-[180px]">
                <Select
                  value={region}
                  onValueChange={setRegion}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Région" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les régions</SelectItem>
                    {Object.entries(REGIONS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4 min-w-[120px]">
                <Select
                  value={year}
                  onValueChange={setYear}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Année" />
                  </SelectTrigger>
                  <SelectContent>
                    {["2025", "2024", "2023", "2022", "2021", "2020"].map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Objectif de réduction:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={targetPercentage}
                    onChange={(e) => setTargetPercentage(Number(e.target.value))}
                    className="w-16 px-2 py-1 border rounded"
                  />
                  <span className="text-sm">%</span>
                </div>

                <Button
                  variant="outline"
                  onClick={async () => {
                    setRegressionResult(null);
                    setOverviewData(null);
                    setMonthlyData([]);
                    setChartData(null);
                    const selectedRegion = region === 'all' ? undefined : region;
                    await regressionAPI.analyzeAndSave(vehicleType, year, selectedRegion);
                  }}
                >
                  Recalculer
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 bg-destructive/15 text-destructive p-4 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <Card className="flex items-center justify-center h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Chargement des données...</p>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <TabsList>
                  <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                  <TabsTrigger value="monthly">Données mensuelles</TabsTrigger>
                  <TabsTrigger value="charts">Graphiques</TabsTrigger>
                </TabsList>

                {activeTab === "overview" && regressionResult && regressionResult.warnings && regressionResult.warnings.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{regressionResult.warnings.length} avertissement(s)</span>
                  </div>
                )}
              </div>

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
                <ChartsTab 
                  data={chartData} 
                  rSquared={regressionResult?.rSquared}
                  regressionEquation={regressionResult?.regressionEquation}
                  vehicleType={vehicleType}
                />
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </div>
    </div>
  );
}
