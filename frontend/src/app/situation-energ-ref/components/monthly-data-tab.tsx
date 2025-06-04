"use client";

import { NotificationsAPI } from "@/app/api/notifications";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowUpDown, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { performRegression } from "../services/regression";
import { MonthlyData } from "../types";

interface MonthlyDataTabProps {
  data: MonthlyData[];
}

type SortConfig = {
  key: keyof MonthlyData;
  direction: 'asc' | 'desc';
} | null;

export function MonthlyDataTab({ data }: MonthlyDataTabProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  // Removed addNotification usage because it's not available in notification context

  const regions = ["all", "Tunis", "Mjez el beb"];

  // Calculate IPE values and get regression predictions
  const processedData = useMemo(() => {
    try {
      const dataWithIpe = data.map(item => ({
        ...item,
        ipeL100km: (item.consommation / item.kilometrage) * 100,
        ipeL100TonneKm: item.tonnage > 0 ? ((item.consommation / item.kilometrage) * 100) / item.tonnage : undefined
      }));

      // Get regression predictions for trucks
      const truckData = dataWithIpe.filter(item => item.vehicleType === 'CAMION');
      if (truckData.length > 0) {
        const regressionResult = performRegression(truckData, 'CAMION');
        truckData.forEach((item, index) => {
          item.predictedIpeL100TonneKm = regressionResult.predictedValues[index];
          
          // Create notification for anomalies
          if (item.ipeL100km > 30 && 
              item.ipeL100TonneKm && 
              item.predictedIpeL100TonneKm && 
              item.ipeL100TonneKm > item.predictedIpeL100TonneKm &&
              item.matricule && 
              item.vehicleType && 
              item.region && 
              item.year) {
            NotificationsAPI.create({
              title: "Anomalie IPE détectée",
              message: `Valeurs anormales détectées pour le véhicule ${item.matricule} en ${item.year}. Veuillez vérifier la consommation.`,
              type: "ANOMALY",
              severity: "HIGH",
              timestamp: new Date().toISOString(),
              vehicleId: item.matricule,
              vehicleType: item.vehicleType,
              region: item.region,
              year: item.year,
              metadata: {
                ipeL100km: item.ipeL100km,
                ipeL100TonneKm: item.ipeL100TonneKm,
                predictedIpeL100TonneKm: item.predictedIpeL100TonneKm,
                consommation: item.consommation,
                kilometrage: item.kilometrage,
                tonnage: item.tonnage
              }
            }).catch(console.error);
          }
        });
      }

      return dataWithIpe;
    } catch (error) {
      console.error('Error processing data:', error);
      return data.map(item => ({
        ...item,
        ipeL100km: 0,
        ipeL100TonneKm: undefined,
        predictedIpeL100TonneKm: undefined
      }));
    }
  }, [data]);

  // Sort data
  const sortedData = useMemo(() => {
    const filtered = selectedRegion === "all" 
      ? processedData 
      : processedData.filter(item => item.region === selectedRegion);

    if (!sortConfig) return filtered;

    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [processedData, selectedRegion, sortConfig]);

  const handleSort = (key: keyof MonthlyData) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getIpeColor = (item: MonthlyData) => {
    if (!item.ipeL100km || !item.ipeL100TonneKm || !item.predictedIpeL100TonneKm) return '';
    
    if (item.ipeL100km > 30 && item.ipeL100TonneKm > item.predictedIpeL100TonneKm) {
      return 'bg-red-100 dark:bg-red-900';
    }
    return 'bg-green-100 dark:bg-green-900';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Données Mensuelles</h3>
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sélectionner une région" />
          </SelectTrigger>
          <SelectContent>
            {regions.map((region) => (
              <SelectItem key={region} value={region}>
                {region === "all" ? "Toutes les régions" : region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('month')} className="h-8 font-semibold">
                    Mois <ArrowUpDown className="ml-1 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('region')} className="h-8 font-semibold">
                    Région <ArrowUpDown className="ml-1 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort('kilometrage')} className="h-8 font-semibold">
                    Distance (km) <ArrowUpDown className="ml-1 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort('tonnage')} className="h-8 font-semibold">
                    Tonnage <ArrowUpDown className="ml-1 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Consommation Actuelle (L)</TableHead>
                <TableHead className="text-right">Consommation Référence (L)</TableHead>
                <TableHead className="text-right">Consommation Cible (L)</TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort('ipeL100km')} className="h-8 font-semibold">
                    IPE (L/100km) <ArrowUpDown className="ml-1 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort('ipeL100TonneKm')} className="h-8 font-semibold">
                    IPE (L/100km.Tonne) <ArrowUpDown className="ml-1 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => handleSort('improvementPercentage')} className="h-8 font-semibold">
                    Amélioration (%) <ArrowUpDown className="ml-1 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item, index) => (
                <TableRow 
                  key={`${item.month}-${index}`}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell>{item.month}</TableCell>
                  <TableCell>{item.region}</TableCell>
                  <TableCell className="text-right font-mono">{item.kilometrage.toLocaleString('fr-FR')}</TableCell>
                  <TableCell className="text-right font-mono">{item.tonnage.toLocaleString('fr-FR')}</TableCell>
                  <TableCell className="text-right font-mono">{item.consommation.toLocaleString('fr-FR')}</TableCell>
                  <TableCell className="text-right font-mono">{item.referenceConsommation.toLocaleString('fr-FR')}</TableCell>
                  <TableCell className="text-right font-mono">{item.targetConsommation.toLocaleString('fr-FR')}</TableCell>
                  <TableCell className={cn("text-right font-mono relative", getIpeColor(item))}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-end gap-1">
                            {item.ipeL100km.toFixed(2)}
                            {item.ipeL100km > 30 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Consommation pour 100 km parcourus</p>
                          {item.ipeL100km > 30 && (
                            <p className="text-red-500">Valeur anormalement élevée</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className={cn("text-right font-mono relative", getIpeColor(item))}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-end gap-1">
                            {item.ipeL100TonneKm?.toFixed(4) || '-'}
                            {item.ipeL100TonneKm && item.predictedIpeL100TonneKm && 
                             item.ipeL100TonneKm > item.predictedIpeL100TonneKm && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Consommation pour 100 km parcourus par tonne transportée</p>
                          {item.ipeL100TonneKm && item.predictedIpeL100TonneKm && (
                            <>
                              <p>Valeur prédite: {item.predictedIpeL100TonneKm.toFixed(4)}</p>
                              {item.ipeL100TonneKm > item.predictedIpeL100TonneKm && (
                                <p className="text-red-500">Supérieur à la valeur prédite</p>
                              )}
                            </>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell 
                    className={cn(
                      "text-right font-mono",
                      item.improvementPercentage >= 0 
                        ? 'text-red-500 dark:text-red-400'
                        : 'text-green-500 dark:text-green-400'
                    )}
                  >
                    {item.improvementPercentage.toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <div className="mt-4 space-y-1 text-sm text-muted-foreground">
        <p>* IPE: Indice de Performance Énergétique</p>
        <p>* IPE (L/100km): Consommation pour 100 km parcourus</p>
        <p>* IPE (L/100km.Tonne): Consommation pour 100 km parcourus par tonne transportée</p>
        <p>* Amélioration: Une valeur négative indique une amélioration par rapport à la référence</p>
        <p className="text-red-500 dark:text-red-400">* Rouge: IPE supérieur à 30 L/100km et IPE/Tonne supérieur à la valeur prédite</p>
        <p className="text-green-500 dark:text-green-400">* Vert: Valeurs dans la plage normale</p>
      </div>
    </div>
  );
}
