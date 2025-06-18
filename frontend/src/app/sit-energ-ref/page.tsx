"use client";

import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { OverviewTab } from "./components/overview-tab";
import { ChartsTab } from "./components/charts-tab";
import { VehicleDetailsTab } from "./components/vehicle-details-tab";
import { MonthlyDataTab } from "./components/monthly-data-tab";
import { DashboardHeader } from "./components/dashboard-header";
import { DashboardFilters } from "./components/dashboard-filters";
import { LoadingSpinner } from "./components/loading-spinner";
import { ErrorBoundary } from "./components/error-boundary";
import { QueryClient, QueryClientProvider } from "react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function SERPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <div className="container mx-auto p-4 space-y-6">
          <DashboardHeader />
          <DashboardFilters />
          
          <Card className="p-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="charts">Graphiques</TabsTrigger>
                <TabsTrigger value="vehicles">Véhicules</TabsTrigger>
                <TabsTrigger value="monthly">Données mensuelles</TabsTrigger>
              </TabsList>
              
              <Suspense fallback={<LoadingSpinner />}>
                <TabsContent value="overview">
                  <ErrorBoundary>
                    <OverviewTab />
                  </ErrorBoundary>
                </TabsContent>
                
                <TabsContent value="charts">
                  <ErrorBoundary>
                    <ChartsTab />
                  </ErrorBoundary>
                </TabsContent>
                
                <TabsContent value="vehicles">
                  <ErrorBoundary>
                    <VehicleDetailsTab />
                  </ErrorBoundary>
                </TabsContent>
                
                <TabsContent value="monthly">
                  <ErrorBoundary>
                    <MonthlyDataTab />
                  </ErrorBoundary>
                </TabsContent>
              </Suspense>
            </Tabs>
          </Card>
        </div>
      </ErrorBoundary>
    </QueryClientProvider>
  );
} 