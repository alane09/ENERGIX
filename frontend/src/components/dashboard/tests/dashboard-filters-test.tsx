"use client"

/**
 * Test file for dashboard filters integration
 * This file demonstrates the proper usage of both the deprecated DashboardFilters component
 * and the recommended approach with separate components.
 * 
 * Run this test in development to verify proper functionality:
 * Add this component to a route and observe proper behavior and console output
 */

import { DateRangeSelector } from '@/components/date-range-selector'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import React from 'react'
import { DashboardFilters } from '../dashboard-filters'
import { VehicleTypeFilter } from '../vehicle-type-filter'

export default function DashboardFiltersTest() {
  // State handlers for all filters
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date } | null>(null)
  const [vehicleType, setVehicleType] = React.useState<string>('all')
  
  // Handler for date range changes
  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    console.log('Date range changed:', range)
    setDateRange(range)
  }
  
  // Handler for vehicle type changes
  const handleVehicleTypeChange = (type: string) => {
    console.log('Vehicle type changed:', type)
    setVehicleType(type)
  }
  
  return (
    <div className="space-y-8 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Deprecated Component (with console warning)</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardFilters 
            onDateRangeChange={handleDateRangeChange}
            onVehicleTypeChange={handleVehicleTypeChange}
          />
          
          {dateRange && (
            <div className="mt-4 p-4 border rounded-md bg-muted">
              <p>Selected date range: {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}</p>
            </div>
          )}
          
          {vehicleType !== 'all' && (
            <div className="mt-4 p-4 border rounded-md bg-muted">
              <p>Selected vehicle type: {vehicleType}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recommended Approach (separate components)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
            <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
            <VehicleTypeFilter onVehicleTypeChange={handleVehicleTypeChange} />
          </div>
          
          {dateRange && (
            <div className="mt-4 p-4 border rounded-md bg-muted">
              <p>Selected date range: {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}</p>
            </div>
          )}
          
          {vehicleType !== 'all' && (
            <div className="mt-4 p-4 border rounded-md bg-muted">
              <p>Selected vehicle type: {vehicleType}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
