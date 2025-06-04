/**
 * @deprecated This component has been replaced by a combination of DateRangeSelector and VehicleTypeFilter
 * For date filtering, use '@/components/date-range-selector'
 * For vehicle type filtering, use '@/components/dashboard/vehicle-type-filter'
 * 
 * Deprecation date: May 2025
 * Migration timeline: Please migrate to the individual components by July 2025
 */

"use client"

import { VehicleTypeFilter } from "@/components/dashboard/vehicle-type-filter"
import { DateRangeSelector } from "@/components/date-range-selector"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import * as React from "react"

interface DashboardFiltersProps {
  onDateRangeChange?: (range: { from: Date, to: Date }) => void
  onVehicleTypeChange?: (type: string) => void
  className?: string
}

export function DashboardFilters({
  onDateRangeChange,
  onVehicleTypeChange,
  className,
}: DashboardFiltersProps) {
  // Show a warning in the console when this component is used
  React.useEffect(() => {
    console.warn(
      'Warning: DashboardFilters component is deprecated and will be removed after July 2025. ' +
      'Please use DateRangeSelector and VehicleTypeFilter components directly.'
    );
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0",
        className
      )}
    >
      <DateRangeSelector onDateRangeChange={onDateRangeChange} />
      <VehicleTypeFilter onVehicleTypeChange={onVehicleTypeChange ?? (() => {})} />
    </motion.div>
  )
}
