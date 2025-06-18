"use client";

import React from "react";
import { useFilterStore } from "../store";
import { DashboardFilters } from "./dashboard-filters";
import { OverviewTab } from "./overview-tab";
import { ChartsTab } from "./charts-tab";
import { MonthlyDataTab } from "./monthly-data-tab";
import { VehicleAnalysisTab } from "./vehicle-analysis-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";

export function Dashboard() {
  const { vehicleType, year, region } = useFilterStore();
  const queryClient = useQueryClient();

  // Invalidate and refetch data when filters change
  React.useEffect(() => {
    const invalidateQueries = async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['regression', vehicleType, year, region] }),
        queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleType, year, region] }),
        queryClient.invalidateQueries({ queryKey: ['monthly', vehicleType, year, region] })
      ]);
    };

    invalidateQueries();
  }, [vehicleType, year, region, queryClient]);

  return (
    <div className="space-y-4">
      <DashboardFilters />
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="charts">Graphiques</TabsTrigger>
          <TabsTrigger value="monthly">Données mensuelles</TabsTrigger>
          <TabsTrigger value="vehicles">Analyse des véhicules</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="charts" className="mt-4">
          <ChartsTab />
        </TabsContent>
        <TabsContent value="monthly" className="mt-4">
          <MonthlyDataTab />
        </TabsContent>
        <TabsContent value="vehicles" className="mt-4">
          <VehicleAnalysisTab />
        </TabsContent>
      </Tabs>
    </div>
  );
} 