"use client"

import { useToast } from "@/components/ui/use-toast"
import { useVehicleType, VehicleType } from "@/hooks/use-vehicle-type"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Car, CheckCircle, Package, Truck } from "lucide-react"
import * as React from "react"

interface VehicleTypeButtonProps {
  label: string
  value: VehicleType
  icon: React.ReactNode
  isActive: boolean
  onClick: () => void
  disabled?: boolean
}

function VehicleTypeButton({
  label,
  value,
  icon,
  isActive,
  onClick,
  disabled = false,
}: VehicleTypeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isActive}
      aria-label={`Sélectionner ${label}`}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-lg transition-all duration-200",
        isActive 
          ? "bg-primary text-primary-foreground shadow-sm scale-105" 
          : "bg-background hover:bg-muted/80 border border-muted",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus-visible:ring-offset-2"
      )}
    >
      <div className="text-2xl">
        {icon}
      </div>
      <span className="text-xs sm:text-sm font-medium">{label}</span>
      {isActive && (
        <motion.div
          layoutId="activeVehicleIndicator"
          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-primary-foreground rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </button>
  )
}

interface VehicleTypeSelectorProps {
  onChange?: (type: VehicleType) => void
  className?: string
  disabled?: boolean
  context?: 'regression'
}

export function VehicleTypeSelector({ 
  onChange,
  className,
  disabled = false,
  context,
}: VehicleTypeSelectorProps) {
  const { selectedType, setSelectedType } = useVehicleType()
  const { toast } = useToast()
  
  const handleTypeChange = React.useCallback((type: VehicleType) => {
    if (disabled) return
    
    setSelectedType(type)
    
    if (onChange) {
      onChange(type)
    }
    
    // Show appropriate notification based on context
    if (context === 'regression' && type !== 'CAMION') {
      toast({
        title: "Info",
        description: "L'analyse de régression n'est disponible que pour les camions",
        variant: "default",
        duration: 3000,
      })
    } else {
      toast({
        title: "Succès",
        description: `Filtré par: ${getTypeLabel(type)}`,
        variant: "default",
        duration: 2000,
      })
    }
  }, [setSelectedType, onChange, disabled, context, toast])
  
  // Helper to get label from type
  const getTypeLabel = (type: VehicleType): string => {
    const found = vehicleTypes.find(vt => vt.value === type)
    return found ? found.label : "Tous les véhicules"
  }
  
  // Specific vehicle types as per requirements
  const vehicleTypes = [
    { label: "Tous", value: 'all' as const, icon: <CheckCircle className="text-emerald-500" size={24} /> },
    { label: "Voitures", value: 'VOITURE' as const, icon: <Car className="text-blue-500" size={24} /> },
    { label: "Camions", value: 'CAMION' as const, icon: <Truck className="text-amber-500" size={24} /> },
    { label: "Chariots", value: 'CHARIOT' as const, icon: <Package className="text-purple-500" size={24} /> },
  ]

  return (
    <div className={cn("grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3", className)}>
      {vehicleTypes.map((type) => (
        <VehicleTypeButton
          key={type.value}
          label={type.label}
          value={type.value}
          icon={type.icon}
          isActive={selectedType === type.value}
          onClick={() => handleTypeChange(type.value)}
          disabled={disabled || (context === 'regression' && type.value !== 'CAMION')}
        />
      ))}
    </div>
  )
}
