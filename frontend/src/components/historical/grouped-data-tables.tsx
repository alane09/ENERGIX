"use client"

import { VehicleTableRecord } from "@/app/historique/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle } from "lucide-react"

interface GroupedDataTablesProps {
  data: VehicleTableRecord[]
}

export function GroupedDataTables({ data }: GroupedDataTablesProps) {
  // Group data by region, year, and vehicle type
  const groupedData = data.reduce((acc, record) => {
    const year = record.date.split(' ')[1] // Extract year from date
    const key = `${record.region}-${year}-${record.vehicleType}`
    if (!acc[key]) {
      acc[key] = {
        region: record.region,
        year,
        vehicleType: record.vehicleType,
        records: []
      }
    }
    acc[key].records.push(record)
    return acc
  }, {} as Record<string, { region: string; year: string; vehicleType: string; records: VehicleTableRecord[] }>)

  const isWithinSERLimits = (actual: number, predicted?: number) => {
    if (!predicted) return true;
    return actual <= predicted;
  }

  // Calculate averages for each group
  const getGroupStats = (records: VehicleTableRecord[]) => {
    const total = records.reduce((acc, record) => ({
      distance: acc.distance + record.distance,
      fuelConsumption: acc.fuelConsumption + record.fuelConsumption,
      tonnage: acc.tonnage + record.tonnage,
      consommationTEP: acc.consommationTEP + record.consommationTEP,
      coutDT: acc.coutDT + record.coutDT
    }), {
      distance: 0,
      fuelConsumption: 0,
      tonnage: 0,
      consommationTEP: 0,
      coutDT: 0
    })

    const avgIPE = (total.fuelConsumption * 100) / total.distance
    const avgIPETonne = total.tonnage ? avgIPE / total.tonnage : 0

    return {
      ...total,
      avgIPE,
      avgIPETonne,
      count: records.length
    }
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedData).map(([key, group]) => {
        const stats = getGroupStats(group.records)
        const isTruck = group.vehicleType.toLowerCase() === 'camions'

        return (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="flex items-center gap-4">
                <Badge variant="outline" className="text-lg">
                  {group.region}
                </Badge>
                <Badge variant="outline" className="text-lg">
                  {group.year}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-lg",
                    group.vehicleType.toLowerCase() === 'camions' && "bg-blue-50 text-blue-700 border-blue-200",
                    group.vehicleType.toLowerCase() === 'voitures' && "bg-green-50 text-green-700 border-green-200",
                    group.vehicleType.toLowerCase() === 'chariots' && "bg-amber-50 text-amber-700 border-amber-200"
                  )}
                >
                  {group.vehicleType}
                </Badge>
                <span className="text-sm text-muted-foreground ml-auto">
                  {stats.count} enregistrements
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border mb-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Paramètre</TableHead>
                      <TableHead className="text-right font-semibold">Total</TableHead>
                      <TableHead className="text-right font-semibold">Moyenne</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Distance (km)</TableCell>
                      <TableCell className="text-right">{stats.distance.toLocaleString('fr-FR')}</TableCell>
                      <TableCell className="text-right">{(stats.distance / stats.count).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Carburant (L)</TableCell>
                      <TableCell className="text-right">{stats.fuelConsumption.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</TableCell>
                      <TableCell className="text-right">{(stats.fuelConsumption / stats.count).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>TEP</TableCell>
                      <TableCell className="text-right">{stats.consommationTEP.toLocaleString('fr-FR', { maximumFractionDigits: 3 })}</TableCell>
                      <TableCell className="text-right">{(stats.consommationTEP / stats.count).toLocaleString('fr-FR', { maximumFractionDigits: 3 })}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Coût (DT)</TableCell>
                      <TableCell className="text-right">{stats.coutDT.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</TableCell>
                      <TableCell className="text-right">{(stats.coutDT / stats.count).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</TableCell>
                    </TableRow>
                    {isTruck && (
                      <TableRow>
                        <TableCell>Tonnage</TableCell>
                        <TableCell className="text-right">{stats.tonnage.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</TableCell>
                        <TableCell className="text-right">{(stats.tonnage / stats.count).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell>IPE (L/100km)</TableCell>
                      <TableCell className="text-right">{stats.avgIPE.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>
                    {isTruck && (
                      <TableRow>
                        <TableCell>IPE (L/100km·T)</TableCell>
                        <TableCell className="text-right">{stats.avgIPETonne.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right">-</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="rounded-md border overflow-x-auto w-full">
                <Table className="w-[2000px] min-w-full">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">ID Véhicule</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Région</TableHead>
                      <TableHead className="text-right font-semibold">Distance (km)</TableHead>
                      <TableHead className="text-right font-semibold">Carburant (L)</TableHead>
                      <TableHead className="text-right font-semibold">TEP</TableHead>
                      <TableHead className="text-right font-semibold">Coût (DT)</TableHead>
                      {isTruck && <TableHead className="text-right font-semibold">Tonnage (T)</TableHead>}
                      <TableHead className="text-right font-semibold">Efficacité</TableHead>
                      <TableHead className="text-right font-semibold">IPE (L/100km)</TableHead>
                      <TableHead className="text-right font-semibold">IPE_SER (L/100km)</TableHead>
                      {isTruck && (
                        <>
                          <TableHead className="text-right font-semibold">IPE (L/100km·T)</TableHead>
                          <TableHead className="text-right font-semibold">IPE_SER (L/100km·T)</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.records.map((record) => {
                      // Use the new separate IPE_SER fields
                      const ipeSerL100km = record.ipeSerL100km
                      const ipeSerL100kmT = record.ipeSerL100TonneKm
                      
                      const isWithinLimitsL100km = isWithinSERLimits(record.ipeL100km, ipeSerL100km)
                      const isWithinLimitsL100kmT = isTruck ? isWithinSERLimits(record.ipeL100TonneKm, ipeSerL100kmT) : true
                      
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
                          <TableCell>{record.vehicleType}</TableCell>
                          <TableCell>{record.region}</TableCell>
                          <TableCell className="text-right">{record.distance.toLocaleString('fr-FR')}</TableCell>
                          <TableCell className="text-right">{record.fuelConsumption.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</TableCell>
                          <TableCell className="text-right">{record.consommationTEP.toLocaleString('fr-FR', { maximumFractionDigits: 3 })}</TableCell>
                          <TableCell className="text-right">{record.coutDT.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</TableCell>
                          {isTruck && (
                            <TableCell className="text-right">{record.tonnage.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</TableCell>
                          )}
                          <TableCell className="text-right">{record.efficiency.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</TableCell>
                          <TableCell 
                            className={cn(
                              "text-right font-semibold",
                              record.ipeL100km > 30 
                                ? "bg-red-100 text-red-600"
                                : record.ipeL100km > 25
                                  ? "bg-yellow-100 text-yellow-600"
                                  : "bg-green-100 text-green-600"
                            )}
                          >
                            {record.ipeL100km.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}
                          </TableCell>
                          <TableCell className="text-right">
                            {ipeSerL100km ? (
                              <span className="flex items-center justify-end gap-1">
                                {ipeSerL100km.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}
                                {isWithinLimitsL100km ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                )}
                              </span>
                            ) : (
                              <span 
                                className="text-muted-foreground cursor-help"
                                title={`Veuillez vous assurer que le SER de ${record.date.split(' ')[1]} existe`}
                              >
                                N/A
                              </span>
                            )}
                          </TableCell>
                          {isTruck && (
                            <>
                              <TableCell 
                                className={cn(
                              "text-right font-semibold",
                              record.ipeL100TonneKm > 0.5
                                ? "bg-red-100 text-red-600"
                                : record.ipeL100TonneKm > 0.35
                                  ? "bg-yellow-100 text-yellow-600"
                                  : "bg-green-100 text-green-600"
                                )}
                              >
                                {record.ipeL100TonneKm.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell className="text-right">
                                {ipeSerL100kmT ? (
                                  <span className="flex items-center justify-end gap-1">
                                    {ipeSerL100kmT.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                                    {isWithinLimitsL100kmT ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4 text-red-500" />
                                    )}
                                  </span>
                                ) : (
                                  <span 
                                    className="text-muted-foreground cursor-help"
                                    title={`Veuillez vous assurer que le SER de ${record.date.split(' ')[1]} existe`}
                                  >
                                    N/A
                                  </span>
                                )}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
