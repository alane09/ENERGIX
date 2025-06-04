"use client";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Filter, Loader2, X } from "lucide-react";
import { useState } from "react";

interface DashboardFilterProps {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  vehicleTypeOptions: Array<{
    id: string;
    name: string;
    icon: any;
    noDataMessage: string;
  }>;
  isLoading?: boolean;
  onRefresh?: () => void;
  onReset?: () => void;
  className?: string;
}

export default function DashboardFilter({
  selectedYear,
  setSelectedYear,
  selectedType,
  setSelectedType,
  vehicleTypeOptions,
  isLoading = false,
  onRefresh,
  onReset,
  className,
}: DashboardFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const years = [
    { value: "all", label: "Toutes les années" },
    { value: "2023", label: "2023" },
    { value: "2024", label: "2024" },
    { value: "2025", label: "2025" },
  ];

  const hasActiveFilters = selectedYear !== "all" || selectedType !== "all";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mobile filter button */}
      <div className="flex items-center justify-between lg:hidden">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <Filter className="h-4 w-4" />
          <span>Filtres</span>
          {hasActiveFilters && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {(selectedYear !== "all" ? 1 : 0) + (selectedType !== "all" ? 1 : 0)}
            </div>
          )}
        </Button>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
              onClick={onReset}
            >
              <X className="h-3 w-3" />
              <span>Réinitialiser</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <Loader2 className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Filter container - responsive */}
      <div
        className={cn(
          "grid gap-4",
          isFilterOpen || !isFilterOpen ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-1" : "hidden lg:grid"
        )}
      >
        {/* Vehicle Type Filter Buttons - desktop */}
        <div className="hidden lg:flex lg:flex-wrap gap-2">
          {vehicleTypeOptions.map((type) => (
            <Button
              key={type.id}
              variant={selectedType === type.id ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setSelectedType(type.id)}
            >
              <type.icon className="h-4 w-4" />
              {type.name}
            </Button>
          ))}
        </div>

        {/* Year filter */}
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Année" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year.value} value={year.value}>
                {year.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Vehicle type filter - mobile */}
        <div className="block lg:hidden">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Type de véhicule" />
            </SelectTrigger>
            <SelectContent>
              {vehicleTypeOptions.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action buttons - desktop */}
        <div className="hidden lg:flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <Loader2 className={cn("h-4 w-4", isLoading && "animate-spin")} />
            <span>Rafraîchir</span>
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              className="flex items-center gap-2"
              onClick={onReset}
            >
              <X className="h-4 w-4" />
              <span>Réinitialiser les filtres</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
