# Dashboard Filters Component

## DEPRECATED COMPONENT

⚠️ **Important: This component is deprecated and will be removed in July 2025.**

This component has been replaced by individual components that offer more flexibility and better type safety:
- For date filtering, use `DateRangeSelector` from `@/components/date-range-selector`
- For vehicle type filtering, use `VehicleTypeFilter` from `@/components/dashboard/vehicle-type-filter`

## Migration Guide

### Before (using deprecated component)

```tsx
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"

function MyDashboard() {
  const handleDateRangeChange = (range: { from: Date, to: Date }) => {
    // Handle date range changes
  }
  
  const handleVehicleTypeChange = (type: string) => {
    // Handle vehicle type changes
  }
  
  return (
    <div>
      <DashboardFilters 
        onDateRangeChange={handleDateRangeChange}
        onVehicleTypeChange={handleVehicleTypeChange}
      />
    </div>
  )
}
```

### After (recommended approach)

```tsx
import { DateRangeSelector } from "@/components/date-range-selector"
import { VehicleTypeFilter } from "@/components/dashboard/vehicle-type-filter"

function MyDashboard() {
  const handleDateRangeChange = (range: { from: Date, to: Date }) => {
    // Handle date range changes
  }
  
  const handleVehicleTypeChange = (type: string) => {
    // Handle vehicle type changes
  }
  
  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
      <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
      <VehicleTypeFilter onVehicleTypeChange={handleVehicleTypeChange} />
    </div>
  )
}
```

## Benefits of Migration

1. **Better Type Safety**: Individual components have stronger typing for their props
2. **Improved Performance**: Using separate components reduces unnecessary re-renders
3. **More Flexibility**: You can place components anywhere in your layout independently
4. **Future Compatibility**: These components will continue to be supported and updated

## Testing

A test component is available at `@/components/dashboard/tests/dashboard-filters-test.tsx` to help you validate that both approaches work correctly.

## Need Help?

If you're having trouble migrating from the deprecated component, contact the development team for assistance.
