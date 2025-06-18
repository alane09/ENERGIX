"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFilterStore } from "../store";
import { useVehicleDetails } from "../hooks/use-regression-data";
import { formatNumber } from "../utils/format";
import { VehicleData } from "../types";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export function VehicleDetailsTab() {
  const { vehicleType, year, region } = useFilterStore();
  const { data: vehicles, isLoading, error } = useVehicleDetails(vehicleType, year, region);
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[0]);

  const vehicleArray = Array.isArray(vehicles) ? vehicles : [];

  // Get unique months from data
  const availableMonths = useMemo(() => {
    return Array.from(new Set(vehicleArray.map(v => v.mois || '')))
      .filter(Boolean)
      .sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));
  }, [vehicleArray]);

  // Filter vehicles by selected month
  const filteredVehicles = useMemo(() => {
    return vehicleArray
      .filter(v => v.mois === selectedMonth)
      .sort((a, b) => (a.matricule || '').localeCompare(b.matricule || ''));
  }, [vehicleArray, selectedMonth]);

  // Update selected month when available months change
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-[200px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!vehicleArray.length) {
    return (
      <Alert>
        <AlertDescription>Aucune donnée disponible</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Détails des Véhicules</CardTitle>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
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
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mois</TableHead>
                <TableHead>Matricule</TableHead>
                <TableHead className="text-right">Kilométrage</TableHead>
                <TableHead className="text-right">Consommation (L)</TableHead>
                <TableHead className="text-right">IPE (L/100km)</TableHead>
                <TableHead className="text-right">IPE SER (L/100km)</TableHead>
                {vehicleType === "CAMION" && (
                  <>
                    <TableHead className="text-right">Tonnage</TableHead>
                    <TableHead className="text-right">IPE (L/100km.T)</TableHead>
                    <TableHead className="text-right">IPE SER (L/100km.T)</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle, index) => (
                <TableRow
                  key={`${vehicle.matricule || ''}-${index}`}
                  className={index % 2 === 0 ? 'bg-muted/50' : 'bg-background'}
                >
                  <TableCell>{vehicle.mois || ''}</TableCell>
                  <TableCell className="font-medium">{vehicle.matricule || ''}</TableCell>
                  <TableCell className="text-right">{formatNumber(vehicle.kilometrage || 0, 0)} km</TableCell>
                  <TableCell className="text-right">{formatNumber(vehicle.consommationL || 0, 2)} L</TableCell>
                  <TableCell className="text-right">{formatNumber(vehicle.ipeL100km || 0, 2)}</TableCell>
                  <TableCell className="text-right">{formatNumber(vehicle.ipeSerL100km || 0, 2)}</TableCell>
                  {vehicleType === "CAMION" && (
                    <>
                      <TableCell className="text-right">{formatNumber(vehicle.produitsTonnes || 0, 2)} T</TableCell>
                      <TableCell className="text-right">{formatNumber(vehicle.ipeL100TonneKm || 0, 3)}</TableCell>
                      <TableCell className="text-right">{formatNumber(vehicle.ipeSerL100TonneKm || 0, 3)}</TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
