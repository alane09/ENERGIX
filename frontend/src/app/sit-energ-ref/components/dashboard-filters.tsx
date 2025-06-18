"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { REGIONS, useFilterStore } from "../store";
import { YearSelector } from "./year-selector";

export function DashboardFilters() {
  const { vehicleType, year, region, percentage, setVehicleType, setYear, setRegion, setPercentage } = useFilterStore();

  const handlePercentageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setPercentage(value);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium">Type de véhicule</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoCircledIcon className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Type de véhicule pour lequel calculer les statistiques</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={vehicleType} onValueChange={setVehicleType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VOITURE">Voiture</SelectItem>
                <SelectItem value="CAMION">Camion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium">Année</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoCircledIcon className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Année pour laquelle calculer les statistiques</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <YearSelector value={year} onValueChange={setYear} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium">Région</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoCircledIcon className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Région pour laquelle calculer les statistiques</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une région" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="percentage" className="text-sm font-medium">
                Amélioration cible (%)
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoCircledIcon className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pourcentage d'amélioration visé pour la consommation cible</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex gap-2">
              <Input
                id="percentage"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={percentage}
                onChange={handlePercentageChange}
                className="w-full"
                placeholder="5.0"
              />
              <Button 
                variant="secondary"
                onClick={() => {
                  // Force a recalculation by updating the percentage value
                  const currentValue = parseFloat(percentage.toString());
                  setPercentage(currentValue);
                  // Trigger a refresh of the data
                  window.location.reload();
                }}
              >
                Recalculer
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 