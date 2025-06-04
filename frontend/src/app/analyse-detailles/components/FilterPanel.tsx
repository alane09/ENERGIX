'use client';

import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterState, RegionOption, VehicleType, VehicleTypeOption } from "../types";
import { YEAR_OPTIONS } from "../Vehicle";

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  isLoading: boolean;
  vehicleTypes: VehicleTypeOption[];
  regions: RegionOption[];
}

export function FilterPanel({
  filters,
  onFilterChange,
  isLoading,
  vehicleTypes,
  regions
}: FilterPanelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const handleVehicleTypeChange = (value: string) => {
    onFilterChange({ vehicleType: value as VehicleType });
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Vehicle Type Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Type de véhicule</label>
          <Select
            value={filters.vehicleType}
            onValueChange={handleVehicleTypeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              {vehicleTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Année</label>
          <Select
            value={filters.year}
            onValueChange={(value) => onFilterChange({ year: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une année" />
            </SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Region Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Région</label>
          <Select
            value={filters.region}
            onValueChange={(value) => onFilterChange({ region: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une région" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Filters Summary */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Filtres actifs</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              Type: {vehicleTypes.find(t => t.id === filters.vehicleType)?.name || 'Tous'}
            </p>
            <p>
              Année: {YEAR_OPTIONS.find(y => y.id === filters.year)?.name || 'Toutes'}
            </p>
            <p>
              Région: {regions.find(r => r.id === filters.region)?.name || 'Toutes'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
