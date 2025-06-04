"use client"

import { VehicleTableRecord } from "@/app/historique/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Car, Truck } from "lucide-react"

interface YearlySummaryProps {
  data: VehicleTableRecord[]
  year: string
}

export function YearlySummary({ data, year }: YearlySummaryProps) {
  const vehicleTypes = Array.from(new Set(data.map(record => record.vehicleType)))
  
  const calculateSummary = (records: VehicleTableRecord[]) => {
    return {
      totalDistance: records.reduce((sum, record) => sum + record.distance, 0),
      totalFuel: records.reduce((sum, record) => sum + record.fuelConsumption, 0),
      totalTonnage: records.reduce((sum, record) => sum + record.tonnage, 0),
      averageIpe: records.length > 0 
        ? records.reduce((sum, record) => sum + record.ipeL100km, 0) / records.length 
        : 0,
      averageIpeTonne: records.length > 0 
        ? records.reduce((sum, record) => sum + record.ipeL100TonneKm, 0) / records.length 
        : 0,
      regions: Array.from(new Set(records.map(record => record.region))).length,
      vehicles: new Set(records.map(record => record.vehicleId)).size
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Résumé {year}
        </CardTitle>
        <CardDescription>
          Statistiques annuelles par type de véhicule
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={vehicleTypes[0]?.toLowerCase() || "all"}>
          <TabsList className="mb-4">
            {vehicleTypes.map(type => (
              <TabsTrigger 
                key={type} 
                value={type.toLowerCase()}
                className="flex items-center gap-2"
              >
                {type.toLowerCase() === 'camions' ? (
                  <Truck className="h-4 w-4" />
                ) : type.toLowerCase() === 'voitures' ? (
                  <Car className="h-4 w-4" />
                ) : (
                  <Car className="h-4 w-4" />
                )}
                {type}
              </TabsTrigger>
            ))}
          </TabsList>

          {vehicleTypes.map(type => {
            const typeRecords = data.filter(record => record.vehicleType === type)
            const summary = calculateSummary(typeRecords)

            return (
              <TabsContent key={type} value={type.toLowerCase()}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Distance totale
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {summary.totalDistance.toLocaleString('fr-FR')} km
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Consommation totale
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {summary.totalFuel.toLocaleString('fr-FR', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1
                        })} L
                      </div>
                    </CardContent>
                  </Card>

                  {type.toLowerCase() === 'camions' && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Tonnage total
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {summary.totalTonnage.toLocaleString('fr-FR', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1
                          })} T
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        IPE moyen
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-2xl font-bold">
                          {summary.averageIpe.toLocaleString('fr-FR', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1
                          })} L/100km
                        </div>
                        {type.toLowerCase() === 'camions' && (
                          <div className="text-sm text-muted-foreground">
                            {summary.averageIpeTonne.toLocaleString('fr-FR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })} L/100km·T
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Véhicules actifs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {summary.vehicles} véhicule{summary.vehicles > 1 ? 's' : ''}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Régions couvertes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {summary.regions} région{summary.regions > 1 ? 's' : ''}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}
