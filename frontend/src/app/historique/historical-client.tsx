/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { NotificationsAPI } from "@/app/api/notifications"
import { YearlySummary } from "@/components/historical/yearly-summary"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { VehicleAPI } from "@/lib/api"
import { format } from "date-fns"
import {
  Database,
  FileText,
  Filter,
  Loader2,
  Search,
  Eye,
  Trash2,
  Download
} from "lucide-react"
import { VehicleRecord, VehicleType } from "./types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"

interface HistoricalClientProps {
  vehicleTypes: string[];
  regions: string[];
  initialData?: VehicleRecord[];
}

interface Parameter {
  name: string;
  unit: string;
  type: string[];
  isCustom: boolean;
  isRequired: boolean;
  field: string;
}

export function HistoricalClient({ 
  vehicleTypes,
  regions,
  initialData = [],
}: HistoricalClientProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [notifiedAnomalies, setNotifiedAnomalies] = useState<Set<string>>(new Set())
  
  // State declarations
  const [filteredData, setFilteredData] = useState<VehicleRecord[]>([])
  const [parameters, setParameters] = useState<Parameter[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [selectedType, setSelectedType] = useState<VehicleType | "All">("All")
  const [selectedRegion, setSelectedRegion] = useState<string | "All">("All")
  const [selectedMatricule, setSelectedMatricule] = useState<string | "All">("All")
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [dateRange, setDateRange] = useState<{
    type: 'year' | 'custom'
    year?: string
    startDate?: Date
    endDate?: Date
  }>({
    type: 'year',
    year: new Date().getFullYear().toString()
  })

  // Dynamic year range
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const startYear = currentYear - 5
    const endYear = currentYear + 5
    const yearList = []
    for (let i = startYear; i <= endYear; i++) {
      yearList.push(String(i))
    }
    return yearList
  }, [])

  // Helper functions
  const isAnomaly = (record: VehicleRecord) => {
    if (record.vehicleType?.toLowerCase() === 'camions') {
      const hasHighIpe = record.efficiency ? record.efficiency > 30 : false
      const exceedsPredicted = record.predictedIpe && record.ipeL100TonneKm ? record.ipeL100TonneKm > record.predictedIpe : false
      return hasHighIpe && exceedsPredicted
    }
    return record.efficiency ? record.efficiency > 30 : false
  }

  const createAnomalyNotifications = async (records: VehicleRecord[]) => {
    for (const record of records) {
      try {
        const anomalyKey = `${record.vehicleId || ''}-${record.date || ''}-${record.efficiency || 0}`
        
        if (notifiedAnomalies.has(anomalyKey)) {
          continue
        }

        let isAnomaly = false
        let severity: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
        let message = ''

        if (record.vehicleType?.toLowerCase() === 'camions') {
          const predictedIpe = record.predictedIpe || 0
          if (record.efficiency && record.efficiency > 30 && record.ipeL100TonneKm && record.ipeL100TonneKm > predictedIpe) {
            isAnomaly = true
            severity = record.efficiency > 50 ? 'HIGH' : record.efficiency > 40 ? 'MEDIUM' : 'LOW'
            message = `Véhicule ${record.vehicleId || 'N/A'} présente une consommation anormale: IPE ${record.efficiency.toFixed(1)} L/100km, IPE/Tonne ${record.ipeL100TonneKm.toFixed(2)} L/100km·T (Prédit: ${predictedIpe.toFixed(2)})`
          }
        } else {
          if (record.efficiency && record.efficiency > 30) {
            isAnomaly = true
            severity = record.efficiency > 50 ? 'HIGH' : record.efficiency > 40 ? 'MEDIUM' : 'LOW'
            message = `Véhicule ${record.vehicleId || 'N/A'} présente une consommation anormale: IPE ${record.efficiency.toFixed(1)} L/100km`
          }
        }

        if (isAnomaly) {
          await NotificationsAPI.create({
            title: `Anomalie IPE détectée - ${record.vehicleType || 'N/A'}`,
            message,
            type: 'ANOMALY',
            severity,
            timestamp: new Date().toISOString(),
            vehicleId: record.vehicleId || '',
            vehicleType: record.vehicleType || '',
            region: record.region || '',
            year: selectedYear,
            metadata: {
              efficiency: record.efficiency || 0,
              ipeL100TonneKm: record.ipeL100TonneKm || 0,
              ...(record.predictedIpe && { predictedIpe: record.predictedIpe }),
              date: record.date || '',
              distance: record.distance || 0,
              fuelConsumption: record.fuelConsumption || 0
            }
          })

          setNotifiedAnomalies(prev => new Set([...prev, anomalyKey]))
        }
      } catch (error) {
        console.error('Failed to create anomaly notification:', error)
      }
    }
  }

  // Transform initial data
  const transformInitialData = (data: VehicleRecord[]): VehicleRecord[] => {
    return data.map((item) => ({
      ...item,
      id: item.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      consommationL: item.consommationL || 0,
      kilometrage: item.kilometrage || 0,
      produitsTonnes: item.produitsTonnes || 0,
      consommationTEP: item.consommationTEP || 0,
      coutDT: item.coutDT || 0,
      ipeL100km: item.ipeL100km || 0,
      ipeL100TonneKm: item.ipeL100TonneKm || 0,
      mois: item.mois || '',
      year: item.year || '',
      type: item.type || '',
      matricule: item.matricule || '',
      region: item.region || '',
    }))
  }
  
  // Update URL with current filters
  const updateUrlWithFilters = () => {
    const params = new URLSearchParams()
    
    if (selectedType !== "All") {
      params.set("type", selectedType.toString())
    }
    
    if (selectedRegion !== "all") {
      params.set("region", selectedRegion)
    }
    
    if (dateRange.type === 'year' && dateRange.year) {
      params.set("year", dateRange.year)
    }
    
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
    router.push(newUrl, { scroll: false })
  }

  // Transform initial data when component mounts
  useEffect(() => {
    if (initialData.length > 0) {
      const transformedData = transformInitialData(initialData)
      setFilteredData(transformedData)
    }
  }, [initialData])

  // Check for anomalies
  useEffect(() => {
    if (filteredData.length > 0) {
      const newAnomalies = filteredData.filter(record => {
        const anomalyKey = `${record.vehicleId}-${record.date}-${record.efficiency}`
        return !notifiedAnomalies.has(anomalyKey) && isAnomaly(record)
      })

      if (newAnomalies.length > 0) {
        createAnomalyNotifications(newAnomalies)
      }
    }
  }, [filteredData])

  // Fetch records based on selected filters
  const fetchRecords = async () => {
    setIsLoading(true)
    
    try {
      const params: Record<string, string> = {}
      
      if (selectedType !== "All") params.type = selectedType.toString()
      if (selectedRegion !== "all") params.region = selectedRegion
      if (selectedMatricule) params.matricule = selectedMatricule
      
      if (dateRange.type === 'year' && dateRange.year) {
        params.year = dateRange.year
      } else if (dateRange.type === 'custom' && dateRange.startDate && dateRange.endDate) {
        params.dateFrom = format(dateRange.startDate, 'yyyy-MM-dd')
        params.dateTo = format(dateRange.endDate, 'yyyy-MM-dd')
      }
      
      const apiRecords = await VehicleAPI.getRecords(params) as VehicleRecord[]
      
      setFilteredData(apiRecords)
      updateUrlWithFilters()
      
      // Process anomalies
      const newAnomalies = apiRecords.filter(record => {
        const anomalyKey = `${record.vehicleId || ''}-${record.date || ''}-${record.efficiency || 0}`
        return !notifiedAnomalies.has(anomalyKey) && isAnomaly(record)
      })

      if (newAnomalies.length > 0) {
        await createAnomalyNotifications(newAnomalies)
        toast({
          title: 'Nouvelles anomalies détectées',
          description: `${newAnomalies.length} nouvelle${newAnomalies.length > 1 ? 's' : ''} anomalie${newAnomalies.length > 1 ? 's' : ''} détectée${newAnomalies.length > 1 ? 's' : ''}`,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error fetching records:', error)
      toast({
        title: 'Erreur',
        description: 'Erreur lors du chargement des données historiques',
        variant: 'destructive'
      })

      if (initialData.length > 0) {
        const transformedData = transformInitialData(initialData)
        setFilteredData(transformedData)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Apply filters
  const handleApplyFilters = () => {
    fetchRecords()
  }

  // Reset filters
  const handleResetFilters = () => {
    setSelectedType("All")
    setSelectedRegion("all")
    setSelectedMatricule("All")
    setDateRange({
      type: 'year',
      year: new Date().getFullYear().toString()
    })
    
    router.push(window.location.pathname, { scroll: false })
  }

  // Fetch parameters (can be extended to fetch all possible historical parameters)
  useEffect(() => {
    // In a real app, you would fetch the list of all possible historical parameters from your backend
    // For now, we'll use a predefined list that includes all potential fields from VehicleData interface
    const allPossibleParameters: Parameter[] = [
      { name: "Mois", unit: "", type: ["CAMION", "VOITURE", "CHARIOT"], isCustom: false, isRequired: false, field: "mois" },
      { name: "Année", unit: "", type: ["CAMION", "VOITURE", "CHARIOT"], isCustom: false, isRequired: false, field: "year" },
      { name: "Type", unit: "", type: ["CAMION", "VOITURE", "CHARIOT"], isCustom: false, isRequired: false, field: "type" },
      { name: "Matricule", unit: "", type: ["CAMION", "VOITURE", "CHARIOT"], isCustom: false, isRequired: false, field: "matricule" },
      { name: "Région", unit: "", type: ["CAMION", "VOITURE", "CHARIOT"], isCustom: false, isRequired: false, field: "region" },
      { name: "Consommation en L", unit: "L", type: ["CAMION", "VOITURE", "CHARIOT"], isCustom: false, isRequired: true, field: "consommationL" },
      { name: "Consommation en TEP", unit: "TEP", type: ["CAMION", "VOITURE", "CHARIOT"], isCustom: false, isRequired: false, field: "consommationTEP" },
      { name: "Coût en DT", unit: "DT", type: ["CAMION", "VOITURE", "CHARIOT"], isCustom: false, isRequired: false, field: "coutDT" },
      { name: "Kilométrage parcouru en Km", unit: "Km", type: ["CAMION", "VOITURE"], isCustom: false, isRequired: false, field: "kilometrage" }, // Not required for CHARIOT in history
      { name: "Produits transportés en Tonne", unit: "Tonne", type: ["CAMION"], isCustom: false, isRequired: false, field: "produitsTonnes" }, // Only for CAMION in history
      { name: "IPE (L/100km)", unit: "L/100km", type: ["CAMION", "VOITURE"], isCustom: false, isRequired: false, field: "ipeL100km" },
      { name: "IPE (L/100km.Tonne)", unit: "L/100km.Tonne", type: ["CAMION"], isCustom: false, isRequired: false, field: "ipeL100TonneKm" },
      // Add any other historical parameters here
    ];
    setParameters(allPossibleParameters);
  }, []);

  // Helper function to format numbers (assuming you want 2 decimal places for display)
  const formatNumber = (value: any): string => {
    const num = typeof value === 'number' ? value : Number(value);
    return isNaN(num) ? '-' : num.toFixed(2);
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Chargement des statistiques...
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      ) : (
        <YearlySummary 
          data={filteredData}
          year={selectedYear}
        />
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtres de recherche
          </CardTitle>
          <CardDescription>
            Affinez votre recherche en utilisant les filtres ci-dessous
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Type de véhicule</Label>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as VehicleType | "All")}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Tous les types</SelectItem>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Région</Label>
              <Select value={selectedRegion} onValueChange={(value) => setSelectedRegion(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les régions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les régions</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Matricule</Label>
              <Input
                placeholder="Rechercher par matricule"
                value={selectedMatricule}
                onChange={(e) => setSelectedMatricule(e.target.value)}
              />
            </div>
            
            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="year-filter">Année</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year-filter" className="w-full">
                  <SelectValue placeholder="Sélectionner une année" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-between mt-6">
            <div className="space-x-2">
              <Button onClick={handleApplyFilters} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Rechercher
                  </>
                )}
              </Button>
              
              <Button variant="outline" onClick={handleResetFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Données historiques
          </CardTitle>
          <CardDescription>
            {filteredData.length} enregistrements trouvés - Répartis par région, année et type de véhicule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                {parameters.map((param) => (
                  <TableHead key={param.name}>{param.name} {param.unit ? `(${param.unit})` : ''}</TableHead>
                ))}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((row, index) => (
                  <TableRow key={row.id || index}>
                    {parameters.map((param, paramIndex) => {
                      const fieldName = param.field as keyof VehicleRecord;
                      const value = row[fieldName];
                      let displayValue = '';
                      if (typeof value === 'number') {
                        displayValue = formatNumber(value);
                      } else if (value !== undefined && value !== null) {
                        displayValue = String(value);
                      } else {
                        displayValue = '-';
                      }
                      return (
                        <TableCell key={paramIndex}>{displayValue}</TableCell>
                      );
                    })}
                    <TableCell className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          // View record details
                          toast({
                            title: "Détails de l'enregistrement",
                            description: `ID: ${row.id || 'N/A'}, Type: ${row.type || 'N/A'}, Matricule: ${row.matricule || 'N/A'}`,
                          })
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          // Download record data
                          const dataStr = JSON.stringify(row, null, 2)
                          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
                          const exportFileDefaultName = `record-${row.id || 'export'}.json`
                          const linkElement = document.createElement('a')
                          linkElement.setAttribute('href', dataUri)
                          linkElement.setAttribute('download', exportFileDefaultName)
                          linkElement.click()
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          // Delete record
                          toast({
                            title: "Suppression d'enregistrement",
                            description: "Cette fonctionnalité sera bientôt disponible",
                            variant: "destructive"
                          })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={parameters.length + 1} className="text-center py-8">
                    Aucune donnée historique trouvée pour les filtres sélectionnés.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
