'use client';

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Vehicle } from "../types";

export interface VehicleSelectorProps {
  vehicles: Vehicle[];
  selectedMatricules: string[];
  onSelectionChange: (matricules: string[]) => void;
  isLoading: boolean;
}

export function VehicleSelector({
  vehicles,
  selectedMatricules,
  onSelectionChange,
  isLoading
}: VehicleSelectorProps) {
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  const toggleVehicle = (matricule: string) => {
    const newSelection = selectedMatricules.includes(matricule)
      ? selectedMatricules.filter(m => m !== matricule)
      : [...selectedMatricules, matricule];
    onSelectionChange(newSelection);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedMatricules.length === 0
            ? "Sélectionner des véhicules..."
            : `${selectedMatricules.length} véhicule(s) sélectionné(s)`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Rechercher un véhicule..." />
          <CommandEmpty>Aucun véhicule trouvé.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-72">
              {vehicles.map((vehicle) => (
                <CommandItem
                  key={vehicle.matricule}
                  value={vehicle.matricule}
                  onSelect={() => {
                    toggleVehicle(vehicle.matricule);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedMatricules.includes(vehicle.matricule)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {vehicle.matricule} ({vehicle.type})
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
