"use client"

import { VehicleTableRecord } from "@/app/historique/types"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle } from "lucide-react"

interface AnomalyTableProps {
  data: VehicleTableRecord[]
}

export function AnomalyTable({ data }: AnomalyTableProps) {
  const isWithinSERLimits = (actual: number, predicted?: number) => {
    if (!predicted) return true;
    return actual <= predicted;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Date</TableHead>
            <TableHead className="font-semibold">ID Véhicule</TableHead>
            <TableHead className="font-semibold">Type</TableHead>
            <TableHead className="text-right font-semibold">Distance (km)</TableHead>
            <TableHead className="text-right font-semibold">Carburant (L)</TableHead>
            <TableHead className="text-right font-semibold">TEP</TableHead>
            <TableHead className="text-right font-semibold">Coût (DT)</TableHead>
            <TableHead className="text-right font-semibold">Tonnage</TableHead>
            <TableHead className="font-semibold">Région</TableHead>
            <TableHead className="text-right font-semibold">IPE (L/100km)</TableHead>
            <TableHead className="text-right font-semibold">IPE_SER (L/100km)</TableHead>
            <TableHead className="text-right font-semibold">IPE (L/100km·T)</TableHead>
            <TableHead className="text-right font-semibold">IPE_SER (L/100km·T)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record) => {
            const isTruck = record.vehicleType.toLowerCase() === 'camions'
            const isWithinLimitsL100km = isWithinSERLimits(record.ipeL100km, record.predictedIpe)
            const isWithinLimitsL100kmT = isWithinSERLimits(record.ipeL100TonneKm, record.predictedIpe)
            
            return (
              <TableRow 
                key={record.id}
                className={cn(
                  "transition-colors",
                  (!isWithinLimitsL100km || !isWithinLimitsL100kmT) && "bg-red-50"
                )}
              >
                <TableCell className="font-medium">{record.date}</TableCell>
                <TableCell>{record.vehicleId}</TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      record.vehicleType.toLowerCase() === 'camions' && "bg-blue-50 text-blue-700 border-blue-200",
                      record.vehicleType.toLowerCase() === 'voitures' && "bg-green-50 text-green-700 border-green-200",
                      record.vehicleType.toLowerCase() === 'chariots' && "bg-amber-50 text-amber-700 border-amber-200"
                    )}
                  >
                    {record.vehicleType}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {record.distance.toLocaleString('fr-FR')}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {record.fuelConsumption.toLocaleString('fr-FR', { 
                    minimumFractionDigits: 1, 
                    maximumFractionDigits: 1 
                  })}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {record.consommationTEP.toLocaleString('fr-FR', { 
                    minimumFractionDigits: 3, 
                    maximumFractionDigits: 3 
                  })}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {record.coutDT.toLocaleString('fr-FR', { 
                    minimumFractionDigits: 1, 
                    maximumFractionDigits: 1 
                  })}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {record.tonnage.toLocaleString('fr-FR', { 
                    minimumFractionDigits: 1, 
                    maximumFractionDigits: 1 
                  })}
                </TableCell>
                <TableCell>{record.region}</TableCell>

                {/* IPE (L/100km) */}
                <TableCell 
                  className={cn(
                    "text-right font-mono",
                    !isTruck && record.predictedIpe && (
                      isWithinLimitsL100km
                        ? "bg-green-100 text-green-600 font-semibold"
                        : "bg-red-100 text-red-600 font-semibold"
                    )
                  )}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        {record.ipeL100km.toLocaleString('fr-FR', { 
                          minimumFractionDigits: 1, 
                          maximumFractionDigits: 1 
                        })}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>IPE en L/100km = (Consommation × 100) ÷ Distance</p>
                        <p>= ({record.fuelConsumption.toFixed(1)} × 100) ÷ {record.distance}</p>
                        <p>= {record.ipeL100km.toFixed(1)} L/100km</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>

                {/* IPE_SER (L/100km) */}
                <TableCell className="text-right font-mono">
                  {!isTruck && record.predictedIpe ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center justify-end gap-1">
                          {record.predictedIpe.toLocaleString('fr-FR', { 
                            minimumFractionDigits: 1, 
                            maximumFractionDigits: 1 
                          })}
                          {isWithinLimitsL100km ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {isWithinLimitsL100km
                              ? `Conforme à la SER (≤ ${record.predictedIpe.toFixed(1)} L/100km)`
                              : `Supérieur à la SER (> ${record.predictedIpe.toFixed(1)} L/100km)`}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    "-"
                  )}
                </TableCell>

                {/* IPE (L/100km·T) */}
                <TableCell 
                  className={cn(
                    "text-right font-mono",
                    isTruck && record.predictedIpe && (
                      isWithinLimitsL100kmT
                        ? "bg-green-100 text-green-600 font-semibold"
                        : "bg-red-100 text-red-600 font-semibold"
                    )
                  )}
                >
                  {isTruck ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          {record.ipeL100TonneKm.toLocaleString('fr-FR', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>IPE en L/100km·T = IPE L/100km ÷ Tonnage</p>
                          <p>= {record.ipeL100km.toFixed(1)} ÷ {record.tonnage.toFixed(1)}</p>
                          <p>= {record.ipeL100TonneKm.toFixed(2)} L/100km·T</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : "-"}
                </TableCell>

                {/* IPE_SER (L/100km·T) */}
                <TableCell className="text-right font-mono">
                  {isTruck && record.predictedIpe ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center justify-end gap-1">
                          {record.predictedIpe.toLocaleString('fr-FR', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                          {isWithinLimitsL100kmT ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {isWithinLimitsL100kmT
                              ? `Conforme à la SER (≤ ${record.predictedIpe.toFixed(2)} L/100km·T)`
                              : `Supérieur à la SER (> ${record.predictedIpe.toFixed(2)} L/100km·T)`}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
