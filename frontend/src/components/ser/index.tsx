"use client";

import { useEffect, useState } from "react";
import { SERAPI } from "../../app/ser/api";
import { TabsData } from "../../app/ser/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useYear } from "../../hooks/use-year";
import { ChartsTab } from "./charts-tab";
import { MonthlyDataTab } from "./monthly-data-tab";
import { OverviewTab } from "./overview-tab";

interface SERComponentProps {
  vehicleType: string;
}

function SERComponent({ vehicleType }: SERComponentProps) {
  const { year } = useYear();
  const [data, setData] = useState<TabsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!year) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [regressionResult, monthlyData] = await Promise.all([
          SERAPI.getRegressionAnalysis(vehicleType, year),
          SERAPI.getMonthlyData(vehicleType, year),
        ]);

        // Transform data into TabsData format
        const tabsData: TabsData = {
          overview: {
            coefficients: regressionResult.coefficients,
            intercept: regressionResult.intercept,
            rSquared: regressionResult.rSquared,
            equation: regressionResult.equation || regressionResult.regressionEquation || "",
          },
          charts: {
            kilometrageScatter: {
              points: monthlyData.map(month => ({
                x: month.kilometrage,
                y: month.consommation,
                label: month.month,
              })),
              regressionLine: [
                {
                  x: Math.min(...monthlyData.map(m => m.kilometrage)),
                  y: 0,
                  label: "",
                },
                {
                  x: Math.max(...monthlyData.map(m => m.kilometrage)),
                  y: 0,
                  label: "",
                },
              ],
            },
            tonnageScatter: {
              points: monthlyData.map(month => ({
                x: month.tonnage,
                y: month.consommation,
                label: month.month,
              })),
              regressionLine: [
                {
                  x: Math.min(...monthlyData.map(m => m.tonnage)),
                  y: 0,
                  label: "",
                },
                {
                  x: Math.max(...monthlyData.map(m => m.tonnage)),
                  y: 0,
                  label: "",
                },
              ],
            },
            monthlyTrends: monthlyData.map(month => ({
              month: month.month,
              "Consommation actuelle": month.consommation,
              "Consommation de référence": month.referenceConsommation,
              "Consommation cible": month.targetConsommation,
            })),
          },
          monthlyData,
        };

        setData(tabsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [year, vehicleType]);

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Aperçu</TabsTrigger>
        <TabsTrigger value="charts">Graphiques</TabsTrigger>
        <TabsTrigger value="data">Données</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab data={data?.overview ?? null} />
      </TabsContent>

      <TabsContent value="charts">
        <ChartsTab data={data?.charts ?? null} />
      </TabsContent>

      <TabsContent value="data">
        <MonthlyDataTab data={data?.monthlyData ?? null} />
      </TabsContent>
    </Tabs>
  );
}

export { SERComponent };
export type { SERComponentProps };

