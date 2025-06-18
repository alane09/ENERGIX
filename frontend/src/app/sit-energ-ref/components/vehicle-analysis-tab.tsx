"use client";

import { useVehicleDetails } from "../hooks/use-regression-data";
import { useFilterStore } from "../store";
import { DataGrid } from "./shared/data-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function VehicleAnalysisTab() {
  const { vehicleType, year, region } = useFilterStore();
  const { data: vehicles, isLoading, error } = useVehicleDetails(vehicleType, year, region);

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-red-500">Erreur: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
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

  if (!vehicles || vehicles.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-gray-500">Aucune donnée disponible</div>
        </CardContent>
      </Card>
    );
  }

  const columns = [
    { header: "Matricule", accessorKey: "matricule" },
    { header: "Mois", accessorKey: "mois" },
    { header: "Kilométrage", accessorKey: "kilometrage" },
    { header: "Consommation (L)", accessorKey: "consommationL" },
    { header: "IPE (L/100km)", accessorKey: "ipeL100km" },
    { header: "IPE SER (L/100km)", accessorKey: "ipeSerL100km" },
    { header: "IPE (L/100T.km)", accessorKey: "ipeL100TonneKm" },
    { header: "IPE SER (L/100T.km)", accessorKey: "ipeSerL100TonneKm" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyse des véhicules</CardTitle>
      </CardHeader>
      <CardContent>
        <DataGrid data={vehicles} columns={columns} />
      </CardContent>
    </Card>
  );
} 