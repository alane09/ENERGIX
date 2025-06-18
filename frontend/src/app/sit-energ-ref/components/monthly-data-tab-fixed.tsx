"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { useMonthlyData, useRegressionData } from "../hooks/use-regression-data";
import { useFilterStore } from "../store";
import { formatNumber } from "../utils/format";
import { DataGrid } from "./shared/data-grid";

export function MonthlyDataTab() {
  const { vehicleType, year, region, percentage } = useFilterStore();
  const { data: monthly, isLoading: monthlyLoading, error: monthlyError } = useMonthlyData(vehicleType, year, region);
  const { data: regression, isLoading: regressionLoading, error: regressionError } = useRegressionData(vehicleType, year, region);

  const isLoading = monthlyLoading || regressionLoading;
  const error = monthlyError || regressionError;

  if (error || !regression) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-red-500">Erreur: {error?.message}</div>
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

  const monthlyArray = Array.isArray(monthly) ? monthly : [];

  if (monthlyArray.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-gray-500">Aucune donnée disponible</div>
        </CardContent>
      </Card>
    );
  }

  // Month order for sorting
  const monthOrder = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  // Process monthly data with calculations
  const monthlyDataWithCalculations = monthlyArray.map(month => {
    // Calculate reference consumption using regression formula
    const referenceConsommation = regression.intercept + 
      regression.coefficients.kilometrage * month.kilometrage +
      (regression.coefficients.tonnage || 0) * month.produitsTonnes;

    // Calculate target consumption based on improvement percentage
    const targetConsommation = referenceConsommation * (1 - percentage / 100);

    // Calculate improvement percentage
    const improvementPercentage = referenceConsommation > 0 
      ? ((referenceConsommation - month.consommation) / referenceConsommation) * 100 
      : 0;

    // Calculate IPE values
    const ipeL100km = month.kilometrage > 0 ? (month.consommation / month.kilometrage) * 100 : 0;
    const ipeL100kmTonne = vehicleType === 'CAMION' && month.produitsTonnes > 0 
      ? ipeL100km / month.produitsTonnes 
      : 0;

    return {
      ...month,
      referenceConsommation,
      targetConsommation,
      improvementPercentage,
      currentConsommation: month.consommation,
      vehicleCount: month.count,
      ipeL100km,
      ipeL100kmTonne,
      monthOrder: monthOrder.indexOf(month.month)
    };
  }).sort((a, b) => a.monthOrder - b.monthOrder);

  // Define columns based on vehicle type
  const baseColumns = [
    { 
      header: "Mois", 
      accessorKey: "month",
      sortingFn: (rowA: any, rowB: any) => {
        return monthOrder.indexOf(rowA.original.month) - monthOrder.indexOf(rowB.original.month);
      }
    },
    { 
      header: "Kilométrage total", 
      accessorKey: "kilometrage",
      cell: ({ row }: { row: any }) => formatNumber(row.original.kilometrage, 0) + " km"
    }
  ];

  const tonnageColumn = vehicleType === 'CAMION' ? [
    { 
      header: "Tonnage total", 
      accessorKey: "produitsTonnes",
      cell: ({ row }: { row: any }) => formatNumber(row.original.produitsTonnes, 1) + " t"
    }
  ] : [];

  const consumptionColumns = [
    { 
      header: "Consommation de référence", 
      accessorKey: "referenceConsommation",
      cell: ({ row }: { row: any }) => formatNumber(row.original.referenceConsommation, 0) + " L"
    },
    { 
      header: "Consommation actuelle", 
      accessorKey: "currentConsommation",
      cell: ({ row }: { row: any }) => formatNumber(row.original.currentConsommation, 0) + " L"
    },
    { 
      header: "Consommation cible", 
      accessorKey: "targetConsommation",
      cell: ({ row }: { row: any }) => formatNumber(row.original.targetConsommation, 0) + " L"
    },
    { 
      header: "Amélioration (%)", 
      accessorKey: "improvementPercentage",
      cell: ({ row }: { row: any }) => formatNumber(row.original.improvementPercentage, 1) + " %"
    }
  ];

  const ipeColumns = [
    { 
      header: "IPE (L/100km)", 
      accessorKey: "ipeL100km",
      cell: ({ row }: { row: any }) => formatNumber(row.original.ipeL100km, 2) + " L/100km"
    }
  ];

  const ipeL100kmTonneColumn = vehicleType === 'CAMION' ? [
    { 
      header: "IPE (L/100km.Tonne)", 
      accessorKey: "ipeL100kmTonne",
      cell: ({ row }: { row: any }) => formatNumber(row.original.ipeL100kmTonne, 3) + " L/100km.t"
    }
  ] : [];

  const additionalColumns = [
    { 
      header: "Nombre de véhicules", 
      accessorKey: "vehicleCount"
    }
  ];

  const columns = [
    ...baseColumns,
    ...tonnageColumn,
    ...consumptionColumns,
    ...ipeColumns,
    ...ipeL100kmTonneColumn,
    ...additionalColumns
  ];

  // Calculate average values for the summary cards
  const latestMonth = monthlyDataWithCalculations[0] || {
    referenceConsommation: 0,
    currentConsommation: 0,
    targetConsommation: 0,
    improvementPercentage: 0
  };

  const averages = {
    referenceConsommation: latestMonth.referenceConsommation,
    currentConsommation: latestMonth.currentConsommation,
    targetConsommation: latestMonth.targetConsommation,
    improvementPercentage: latestMonth.improvementPercentage
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Consommation de référence du mois</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(averages.referenceConsommation, 0)} L</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consommation actuelle du mois</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(averages.currentConsommation, 0)} L</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amélioration du mois</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(averages.improvementPercentage, 1)} %</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Consommation cible du mois</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(averages.targetConsommation, 0)} L</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Données mensuelles détaillées</CardTitle>
        </CardHeader>
        <CardContent>
          <DataGrid 
            data={monthlyDataWithCalculations} 
            columns={columns}
            initialState={{
              sorting: [{ id: 'month', desc: false }]
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
