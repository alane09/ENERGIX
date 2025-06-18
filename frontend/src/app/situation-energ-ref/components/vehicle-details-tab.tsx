"use client";

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useEffect, useState, useMemo } from "react";
import { regressionAPI } from '../api/regression';
import { VehicleData } from "../types";
import { GetVehicleDetailsParams, VehicleType } from '../types/api';

interface VehicleDetailsTabProps {
  filters: {
    vehicleType: VehicleType;
    region: string;
    year: string;
  };
}

const formatNumber = (value: number | null | undefined, precision: number = 2, unit: string = ""): string => {
  if (value === null || value === undefined || isNaN(value)) return "N/A";
  return `${value.toFixed(precision)}${unit}`;
};

const LoadingSkeleton = () => (
  <div className="space-y-4 p-4 md:p-6">
    <div className="flex justify-between items-center mb-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-40" />
    </div>
    <Skeleton className="h-10 w-full mb-2" />
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-8 w-full mb-1" />
    ))}
  </div>
);

interface TableColumnDefinition {
  key: string;
  header: string;
  accessor: (vehicle: VehicleData) => string | number | null | undefined;
  className?: string;
}

export function VehicleDetailsTab({ filters }: VehicleDetailsTabProps) {
  const [allVehiclesData, setAllVehiclesData] = useState<VehicleData[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [vehiclesForSelectedMonth, setVehiclesForSelectedMonth] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when filters change
  useEffect(() => {
    const fetchVehicleData = async () => {
      setLoading(true);
      setError(null);
      setAllVehiclesData([]);
      setAvailableMonths([]);
      setSelectedMonth("");
      setVehiclesForSelectedMonth([]);

      try {
        console.log('Fetching vehicle details with filters:', filters);
        const params: GetVehicleDetailsParams = {
          vehicleType: filters.vehicleType,
          year: filters.year,
          region: filters.region === "all" ? undefined : filters.region,
        };

        const response = await regressionAPI.getVehicleDetails(params);
        console.log('API Response:', response);

        if (response.error) {
          console.error('API Error:', response.error);
          throw new Error(response.error.message || "Failed to fetch vehicle details");
        }

        const data = response.data || [];
        console.log('Processed vehicle data:', data);
        setAllVehiclesData(data);

        if (data.length > 0) {
          const uniqueMonths = Array.from(
            new Set(data.map(item => item.month).filter((m): m is string => typeof m === 'string' && m.trim() !== ""))
          ).sort((a, b) => {
            const monthOrder = [
              "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
              "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
            ];
            return monthOrder.indexOf(a) - monthOrder.indexOf(b);
          });

          console.log('Available months:', uniqueMonths);
          setAvailableMonths(uniqueMonths);

          if (uniqueMonths.length > 0) {
            const defaultMonth = uniqueMonths.includes("Janvier") ? "Janvier" : uniqueMonths[0];
            console.log('Setting default month:', defaultMonth);
            setSelectedMonth(defaultMonth);
          } else {
            setError("Aucun mois disponible pour les données filtrées.");
          }
        } else {
          setError("Aucune donnée de véhicule trouvée pour les filtres sélectionnés.");
        }
      } catch (err) {
        console.error("Error in fetchVehicleData:", err);
        setError(err instanceof Error ? err.message : "Une erreur est survenue lors de la récupération des données.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
  }, [filters]);

  // Update filtered vehicles when month selection or data changes
  useEffect(() => {
    if (!selectedMonth || allVehiclesData.length === 0) {
      setVehiclesForSelectedMonth([]);
      return;
    }

    const filteredVehicles = allVehiclesData
      .filter(vehicle => vehicle.month === selectedMonth)
      .sort((a, b) => (a.matricule || '').localeCompare(b.matricule || ''));

    console.log(`Filtered vehicles for ${selectedMonth}:`, filteredVehicles);
    setVehiclesForSelectedMonth(filteredVehicles);
  }, [selectedMonth, allVehiclesData]);

  // Define table columns based on vehicle type
  const tableColumns = useMemo((): TableColumnDefinition[] => {
    const commonColumns: TableColumnDefinition[] = [
      {
        key: 'matricule',
        header: 'Matricule',
        accessor: v => v.matricule,
        className: 'font-medium text-left sticky left-0 bg-background z-10'
      },
      {
        key: 'kilometrage',
        header: 'Kilométrage',
        accessor: v => formatNumber(v.kilometrage, 0, ' km'),
        className: 'text-center'
      },
      {
        key: 'consommation',
        header: 'Consommation (L)',
        accessor: v => formatNumber(v.consommation, 2, ' L'),
        className: 'text-center'
      },
      {
        key: 'ipeL100km',
        header: 'IPE (L/100km)',
        accessor: v => formatNumber(v.ipeL100km, 2),
        className: 'text-center'
      },
      {
        key: 'referenceConsommation',
        header: 'Consommation Réf. (L)',
        accessor: v => formatNumber(v.referenceConsommation, 2, ' L'),
        className: 'text-center'
      },
      {
        key: 'ipe_ser_L100km',
        header: 'IPE SER (L/100km)',
        accessor: v => formatNumber(v.ipe_ser_L100km, 2),
        className: 'text-center'
      }
    ];

    if (filters.vehicleType === "CAMION") {
      return [
        ...commonColumns,
        {
          key: 'tonnage',
          header: 'Tonnage',
          accessor: v => formatNumber(v.tonnage, 2, ' T'),
          className: 'text-center'
        },
        {
          key: 'ipeL100TonneKm',
          header: 'IPE (L/100km.T)',
          accessor: v => formatNumber(v.ipeL100TonneKm, 3),
          className: 'text-center'
        },
        {
          key: 'ipe_ser_L100TonneKm',
          header: 'IPE SER (L/100km.T)',
          accessor: v => formatNumber(v.ipe_ser_L100TonneKm, 3),
          className: 'text-center'
        }
      ];
    }

    return commonColumns;
  }, [filters.vehicleType]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="text-lg sm:text-xl whitespace-nowrap">
              Détails des Véhicules par Mois
            </CardTitle>
            {availableMonths.length > 0 && (
              <div className="w-full sm:w-auto sm:min-w-[200px] pt-2 sm:pt-0">
                <Select
                  value={selectedMonth}
                  onValueChange={setSelectedMonth}
                  name="month-select-table"
                >
                  <SelectTrigger id="month-select-table" aria-label="Sélectionner un mois">
                    <SelectValue placeholder="Sélectionner un mois" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map(month => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!error && selectedMonth && vehiclesForSelectedMonth.length === 0 && !loading && (
            <div className="text-center p-6 text-muted-foreground">
              Aucune donnée de véhicule trouvée pour le mois de {selectedMonth}.
            </div>
          )}

          {!error && vehiclesForSelectedMonth.length > 0 && (
            <div className="overflow-x-auto relative">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    {tableColumns.map(col => (
                      <TableHead
                        key={col.key}
                        className={`${col.className || 'text-center'} ${
                          col.key === 'matricule' ? 'sticky left-0 bg-card z-20' : ''
                        }`}
                      >
                        {col.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehiclesForSelectedMonth.map((vehicle, rowIndex) => (
                    <TableRow
                      key={vehicle.matricule ? `${vehicle.matricule}-${rowIndex}` : `row-${rowIndex}`}
                      className={rowIndex % 2 === 0 ? 'bg-muted/10' : 'bg-card'}
                    >
                      {tableColumns.map(col => (
                        <TableCell
                          key={`${vehicle.matricule}-${col.key}-${rowIndex}`}
                          className={`${col.className || 'text-center'} ${
                            col.key === 'matricule' ? 'sticky left-0' : ''
                          } ${
                            (rowIndex % 2 === 0 && col.key === 'matricule')
                              ? 'bg-muted/10'
                              : (col.key === 'matricule' ? 'bg-card' : '')
                          }`}
                        >
                          {col.accessor(vehicle)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!error && !selectedMonth && !loading && availableMonths.length > 0 && (
            <div className="text-center p-6 text-muted-foreground">
              Veuillez sélectionner un mois pour afficher les données.
            </div>
          )}

          {!error && availableMonths.length === 0 && !loading && (
            <div className="text-center p-6 text-muted-foreground">
              Aucun mois de données disponible pour les filtres actuels.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 