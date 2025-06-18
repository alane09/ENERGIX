"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getYearRange, getCurrentYear } from "../utils/year-range";

interface YearSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function YearSelector({ value, onValueChange, className }: YearSelectorProps) {
  const [years, setYears] = useState<number[]>([]);
  const [currentYear, setCurrentYear] = useState<number>(getCurrentYear());

  // Update years when current year changes
  useEffect(() => {
    const updateYears = () => {
      const newCurrentYear = getCurrentYear();
      if (newCurrentYear !== currentYear) {
        setCurrentYear(newCurrentYear);
        setYears(getYearRange());
      }
    };

    // Initial setup
    setYears(getYearRange());

    // Check for year changes every minute
    const interval = setInterval(updateYears, 60000);

    return () => clearInterval(interval);
  }, [currentYear]);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Sélectionner une année" />
      </SelectTrigger>
      <SelectContent>
        {years.map((year) => (
          <SelectItem key={year} value={year.toString()}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 