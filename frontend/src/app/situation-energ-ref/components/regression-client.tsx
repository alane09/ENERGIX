"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Car, HelpCircle, Target, Truck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { regressionAPI } from "../api/regression";
import { ChartData, MonthlyData, OverviewData, RegressionResult } from "../types";
import { ChartsTab } from "./charts";
import { MonthlyDataTab } from "./monthly-data-tab";
import { OverviewTab } from "./overview";
import { CustomTooltip } from "./ui/custom-tooltip";
import { VehicleDetailsTab } from "./vehicle-details-tab";

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

  // Memoize selected region
  const selectedRegion = useMemo(() => 
    region === 'all' ? undefined : region
  , [region]);

  // Memoize regression year calculation
  const regressionYear = useMemo(() => 
    year === "2025" ? "2024" : (parseInt(year) - 1).toString()
  , [year]);

  // Memoize overview data conversion
  const convertToOverviewData = useCallback((result: RegressionResult): OverviewData => ({
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
  }), []);

  // Memoize data processing functions
  const processMonthlyData = useCallback((
    monthlyDataResult: MonthlyData[], 
    regressionResult: RegressionResult,
    targetPercentage: number
  ) => {
    const monthOrder = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    return monthlyDataResult
      .sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month))
      .map(data => {
        // 1. Consommation de référence (en L) = Y (à partir de la formule de régression)
        const referenceConsommation = vehicleType === "VOITURE" 
          ? regressionResult.coefficients.kilometrage * data.kilometrage + regressionResult.intercept
          : regressionResult.coefficients.kilometrage * data.kilometrage + 
            (regressionResult.coefficients.tonnage || 0) * ((data.tonnage || 0) / 1000.0) + 
            regressionResult.intercept;

        // 2. Consommation actuelle = extraite de la base de données (data.consommation)

        // 3. Amélioration (%) = ((Consommation actuelle – Consommation de référence) / Consommation actuelle) × 100
        const improvementPercentage = ((data.consommation - referenceConsommation) / data.consommation) * 100;

        // 4. Consommation cible = Consommation actuelle × (1 - pourcentage saisi manuellement %)
        const targetConsommation = data.consommation * (1 - (targetPercentage / 100));

        // Calculate IPE (L/100km) - using actual consumption
        const ipeL100km = (data.consommation / data.kilometrage) * 100;
        const ipeL100TonneKm = data.tonnage > 0 ? (ipeL100km / data.tonnage) : undefined;

        // Calculate IPE_SER (L/100km) - using reference consumption
        const ipe_ser_L100km = (referenceConsommation / data.kilometrage) * 100;
        const ipe_ser_L100TonneKm = data.tonnage > 0 ? (ipe_ser_L100km / data.tonnage) : undefined;

        // Return all calculated values with proper formatting
        const result = {
          ...data,
          referenceConsommation: Number(referenceConsommation.toFixed(2)),
          consommation: Number(data.consommation.toFixed(2)),
          improvementPercentage: Number(improvementPercentage.toFixed(2)),
          targetConsommation: Number(targetConsommation.toFixed(2)),
          ipe: Number(ipeL100km.toFixed(2)), // Use ipeL100km since they're the same value
          ipeL100km: Number(ipeL100km.toFixed(2)),
          ipeL100TonneKm: ipeL100TonneKm ? Number(ipeL100TonneKm.toFixed(4)) : undefined,
          ipe_ser_L100km: Number(ipe_ser_L100km.toFixed(2)),
          ipe_ser_L100TonneKm: ipe_ser_L100TonneKm ? Number(ipe_ser_L100TonneKm.toFixed(4)) : undefined
        };


        return result;
      });
  }, [vehicleType]);

  // Memoize chart data calculation
  const calculateChartData = useCallback((
    processedData: MonthlyData[],
    regressionResult: RegressionResult
  ): ChartData => {
    const minKm = 0;
    const maxKm = Math.max(...processedData.map(d => d.kilometrage));
    const kmStep = (maxKm - minKm) / 20;

    const kilometragePoints = Array.from({ length: 21 }, (_, i) => {
      const x = minKm + (i * kmStep);
      const avgTonnage = vehicleType === "CAMION" 
        ? processedData.reduce((sum, d) => sum + d.tonnage / 1000.0, 0) / processedData.length 
        : 0;
      const y = vehicleType === "VOITURE"
        ? regressionResult.coefficients.kilometrage * x + regressionResult.intercept
        : regressionResult.coefficients.kilometrage * x + 
          (regressionResult.coefficients.tonnage || 0) * avgTonnage + 
          regressionResult.intercept;
      return { x, y };
    });

    let tonnagePoints = null;
    if (vehicleType === "CAMION") {
      const minTon = Math.min(...processedData.map(d => d.tonnage));
      const maxTon = Math.max(...processedData.map(d => d.tonnage));
      const tonStep = (maxTon - minTon) / 20;
      const avgKm = processedData.reduce((sum, d) => sum + d.kilometrage, 0) / processedData.length;
      
      tonnagePoints = Array.from({ length: 21 }, (_, i) => {
        const x = minTon + (i * tonStep);
        const y = regressionResult.coefficients.kilometrage * avgKm + 
                 (regressionResult.coefficients.tonnage || 0) * x + 
                 regressionResult.intercept;
        return { x, y };
      });
    }

    return {
      kilometrageScatter: {
        points: processedData.map(data => ({
          x: data.kilometrage,
          y: data.consommation
        })),
        regressionLine: kilometragePoints,
        name: "Kilométrage"
      },
      tonnageScatter: {
        points: processedData.map(data => ({
          x: data.tonnage,
          y: data.consommation
        })),
        regressionLine: tonnagePoints || [],
        name: "Tonnage"
      },
      monthlyTrends: processedData.map(data => ({
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
  }, [vehicleType]);

  // Optimized data fetching with cleanup
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchData = async () => {
      if (!vehicleType || !year) return;

      // Debounce rapid changes
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        if (!isMounted) return;

        setIsLoading(true);
        setError(null);
        
        try {
          // Fetch regression results in parallel for better performance
          const [prevYearResult, currentYearResult, monthlyDataResult] = await Promise.all([
            regressionAPI.getResults(vehicleType, regressionYear, selectedRegion)
              .then(result => result || regressionAPI.analyzeAndSave(vehicleType, regressionYear, selectedRegion)),
            year === "2025" 
              ? Promise.resolve(null) 
              : regressionAPI.getResults(vehicleType, year, selectedRegion)
                  .then(result => result || regressionAPI.analyzeAndSave(vehicleType, year, selectedRegion)),
            regressionAPI.getMonthlyData(vehicleType, year, selectedRegion)
          ]);

          if (!isMounted) return;

          if (!prevYearResult) {
            throw new Error(`Failed to get regression results for ${regressionYear}`);
          }

          const result = year === "2025" ? prevYearResult : currentYearResult;
          if (!result) {
            throw new Error(`Failed to get regression results for ${year}`);
          }

          // Process data using memoized functions
          const processedMonthlyData = processMonthlyData(monthlyDataResult, result, targetPercentage);
          const newChartData = calculateChartData(processedMonthlyData, result);

          if (isMounted) {
            setRegressionResult(result);
            setOverviewData(convertToOverviewData(result));
            setMonthlyData(processedMonthlyData);
            setChartData(newChartData);
          }
        } catch (error) {
          if (isMounted) {
            console.error("Error fetching regression data:", error);
            setError("Failed to fetch regression data. Please try again.");
            setRegressionResult(null);
            setOverviewData(null);
            setMonthlyData([]);
            setChartData(null);
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }, 300); // 300ms debounce
    };

    fetchData();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [
    vehicleType,
    year,
    targetPercentage,
    selectedRegion,
    regressionYear,
    processMonthlyData,
    calculateChartData,
    convertToOverviewData
  ]);

  const VehicleIcon = VEHICLE_ICONS[vehicleType];

  const handleRecalculate = useCallback(async () => {
    setRegressionResult(null);
    setOverviewData(null);
    setMonthlyData([]);
    setChartData(null);
    await regressionAPI.analyzeAndSave(vehicleType, year, selectedRegion);
  }, [vehicleType, year, selectedRegion]);

  const handleSaveCoefficients = useCallback(async (coefficients: any) => {
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
  }, [regressionResult, vehicleType, convertToOverviewData]);

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
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="target-percentage" className="text-sm whitespace-nowrap">
                    Objectif de réduction:
                  </Label>
                  <Input
                    id="target-percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={targetPercentage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetPercentage(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm">%</span>
                  <CustomTooltip
                    trigger={<HelpCircle className="h-4 w-4 text-muted-foreground" />}
                    content="Pourcentage d'amélioration ciblé pour calculer la consommation de référence (défaut: 3%)"
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={handleRecalculate}
                  disabled={isLoading}
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
                  <TabsTrigger value="vehicleDetails">Détails par Véhicule</TabsTrigger>
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
                  onSaveCoefficients={handleSaveCoefficients}
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

              <TabsContent value="vehicleDetails" className="mt-6">
                <VehicleDetailsTab 
                  filters={{ vehicleType, region, year }} 
                />
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </div>
    </div>
  );
}
