"use client"

import { NotificationsAPI } from "@/app/api/notifications"
import { FileHistory } from "@/components/historical/file-history"
import { GroupedDataTables } from "@/components/historical/grouped-data-tables"
import { YearlySummary } from "@/components/historical/yearly-summary"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { VehicleAPI } from "@/lib/api"
import { FileHistoryAPI } from "@/lib/file-api"
import { format } from "date-fns"
import {
  AlertCircle,
  BarChart3,
  Database,
  FileText,
  Filter,
  Loader2,
  Search
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { UploadedFile, VehicleRecord, VehicleTableRecord } from "./types"

interface HistoricalClientProps {
  initialData: VehicleRecord[]
  vehicleType?: string
  region?: string
  year?: string
  matricule?: string
  availableVehicleTypes?: string[]
  availableRegions?: string[]
  error?: string
}

export function HistoricalClient({ 
  initialData, 
  vehicleType, 
  region, 
  year,
  matricule,
  availableVehicleTypes = [],
  availableRegions = [],
  error: initialError
}: HistoricalClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  // State declarations
  const [records, setRecords] = useState<VehicleTableRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(initialError || null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)
  const [notifiedAnomalies, setNotifiedAnomalies] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState<string>('')
  
  // Filter states
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>(vehicleType || "all")
  const [selectedRegion, setSelectedRegion] = useState<string>(region || "all")
  const [selectedMatricule, setSelectedMatricule] = useState<string>(matricule || "")
  const [selectedYear, setSelectedYear] = useState<string>(year || new Date().getFullYear().toString())
  const [dateRange, setDateRange] = useState<{
    type: 'year' | 'custom'
    year?: string
    startDate?: Date
    endDate?: Date
  }>({
    type: 'year',
    year: year || new Date().getFullYear().toString()
  })

  // Helper functions
  const formatDate = (month: string | undefined, year?: string | number) => {
    if (!month) return 'Unknown'
    
    const monthValue = month.trim()
    
    if (monthValue.includes('/') || monthValue.includes('-')) {
      return monthValue
    }
    
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
    
    const monthNamesShort = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
    ]
    
    let monthIndex = monthNames.findIndex(m => 
      monthValue.toLowerCase() === m.toLowerCase()
    )
    
    if (monthIndex === -1) {
      monthIndex = monthNamesShort.findIndex(m => 
        monthValue.toLowerCase() === m.toLowerCase()
      )
    }
    
    if (monthIndex !== -1) {
      return `${monthNames[monthIndex]} ${year || new Date().getFullYear()}`
    }
    
    const numericMonth = parseInt(monthValue, 10)
    if (!isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
      return `${monthNames[numericMonth - 1]} ${year || new Date().getFullYear()}`
    }
    
    return `${monthValue} ${year || ''}`.trim()
  }

  const isAnomaly = (record: VehicleTableRecord) => {
    if (record.vehicleType.toLowerCase() === 'camions') {
      const hasHighIpe = record.efficiency > 30
      const exceedsPredicted = record.predictedIpe ? record.ipeL100TonneKm > record.predictedIpe : false
      return hasHighIpe && exceedsPredicted
    }
    return record.efficiency > 30
  }

  const createAnomalyNotifications = async (records: VehicleTableRecord[]) => {
    for (const record of records) {
      try {
        const anomalyKey = `${record.vehicleId}-${record.date}-${record.efficiency}`
        
        if (notifiedAnomalies.has(anomalyKey)) {
          continue
        }

        let isAnomaly = false
        let severity: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
        let message = ''

        if (record.vehicleType.toLowerCase() === 'camions') {
          const predictedIpe = record.predictedIpe || 0
          if (record.efficiency > 30 && record.ipeL100TonneKm > predictedIpe) {
            isAnomaly = true
            severity = record.efficiency > 50 ? 'HIGH' : record.efficiency > 40 ? 'MEDIUM' : 'LOW'
            message = `Véhicule ${record.vehicleId} présente une consommation anormale: IPE ${record.efficiency.toFixed(1)} L/100km, IPE/Tonne ${record.ipeL100TonneKm.toFixed(2)} L/100km·T (Prédit: ${predictedIpe.toFixed(2)})`
          }
        } else {
          if (record.efficiency > 30) {
            isAnomaly = true
            severity = record.efficiency > 50 ? 'HIGH' : record.efficiency > 40 ? 'MEDIUM' : 'LOW'
            message = `Véhicule ${record.vehicleId} présente une consommation anormale: IPE ${record.efficiency.toFixed(1)} L/100km`
          }
        }

        if (isAnomaly) {
          await NotificationsAPI.create({
            title: `Anomalie IPE détectée - ${record.vehicleType}`,
            message,
            type: 'ANOMALY',
            severity,
            timestamp: new Date().toISOString(),
            vehicleId: record.vehicleId,
            vehicleType: record.vehicleType,
            region: record.region,
            year: selectedYear,
            metadata: {
              efficiency: record.efficiency,
              ipeL100TonneKm: record.ipeL100TonneKm,
              ...(record.predictedIpe && { predictedIpe: record.predictedIpe }),
              date: record.date,
              distance: record.distance,
              fuelConsumption: record.fuelConsumption
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
  const transformInitialData = (data: VehicleRecord[]): VehicleTableRecord[] => {
    return data.map((item) => ({
      id: item.id || `record-${Math.random().toString(36).substr(2, 9)}`,
      date: formatDate(item.mois || 'Unknown', item.year || item.annee || new Date().getFullYear().toString()),
      vehicleType: item.type || 'Unknown',
      vehicleId: item.matricule || 'Unknown',
      distance: item.kilometrage || 0,
      fuelConsumption: item.consommationL || 0,
      tonnage: item.produitsTonnes || 0,
      region: item.region || 'Unknown',
      efficiency: item.ipeL100km || 0,
      ipeL100km: item.ipeL100km || 0,
      ipeL100TonneKm: item.ipeL100TonneKm || 0,
      predictedIpe: typeof item.predictedIpe === 'number' ? item.predictedIpe : undefined,
      ipeSerL100km: typeof item.ipeSerL100km === 'number' ? item.ipeSerL100km : undefined,
      ipeSerL100TonneKm: typeof item.ipeSerL100TonneKm === 'number' ? item.ipeSerL100TonneKm : undefined,
      consommationTEP: item.consommationTEP || 0,
      coutDT: item.coutDT || 0
    }))
  }
  
  // Update URL with current filters
  const updateUrlWithFilters = () => {
    const params = new URLSearchParams()
    
    if (selectedVehicleType !== "all") {
      params.set("type", selectedVehicleType)
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
    if (initialData?.length > 0) {
      const transformedData = transformInitialData(initialData)
      setRecords(transformedData)
    }
  }, [initialData])

  // Check for anomalies
  useEffect(() => {
    if (records.length > 0) {
      const newAnomalies = records.filter(record => {
        const anomalyKey = `${record.vehicleId}-${record.date}-${record.efficiency}`
        return !notifiedAnomalies.has(anomalyKey) && isAnomaly(record)
      })

      if (newAnomalies.length > 0) {
        createAnomalyNotifications(newAnomalies)
      }
    }
  }, [records])

  // Fetch records based on selected filters
  const fetchRecords = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const params: Record<string, string | undefined> = {}
      
      if (selectedVehicleType !== "all") params.type = selectedVehicleType
      if (selectedRegion !== "all") params.region = selectedRegion
      if (selectedMatricule) params.matricule = selectedMatricule
      
      if (dateRange.type === 'year' && dateRange.year) {
        params.year = dateRange.year
      } else if (dateRange.type === 'custom' && dateRange.startDate && dateRange.endDate) {
        params.dateFrom = format(dateRange.startDate, 'yyyy-MM-dd')
        params.dateTo = format(dateRange.endDate, 'yyyy-MM-dd')
      }
      
      const apiRecords = await VehicleAPI.getRecords(params) as VehicleRecord[]
      const transformedData = transformInitialData(apiRecords)
      
      setRecords(transformedData)
      updateUrlWithFilters()
      
      // Process anomalies
      const newAnomalies = transformedData.filter(record => {
        const anomalyKey = `${record.vehicleId}-${record.date}-${record.efficiency}`
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
      setError('Erreur lors du chargement des données')
      toast({
        title: 'Erreur',
        description: 'Erreur lors du chargement des données historiques',
        variant: 'destructive'
      })

      if (initialData?.length > 0) {
        const transformedData = transformInitialData(initialData)
        setRecords(transformedData)
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
    setSelectedVehicleType("all")
    setSelectedRegion("all")
    setSelectedMatricule("")
    setDateRange({
      type: 'year',
      year: new Date().getFullYear().toString()
    })
    
    router.push(window.location.pathname, { scroll: false })
  }

  // File handling functions
  const handleDownloadFile = async (fileId: string) => {
    try {
      setDownloadingFileId(fileId)
      await FileHistoryAPI.downloadFile(fileId)
      toast({
        title: "Téléchargement réussi",
        description: "Le fichier a été téléchargé avec succès"
      })
    } catch (error) {
      console.error('Error downloading file:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement du fichier",
        variant: "destructive"
      })
    } finally {
      setDownloadingFileId(null)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      setDeletingFileId(fileId)
      await FileHistoryAPI.deleteFile(fileId)
      
      // Remove file from state
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
      
      toast({
        title: "Suppression réussie",
        description: "Le fichier a été supprimé avec succès"
      })
    } catch (error) {
      console.error('Error deleting file:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du fichier",
        variant: "destructive"
      })
    } finally {
      setDeletingFileId(null)
    }
  }

  const handleViewFile = (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId)
    if (!file) return

    setSelectedVehicleType(file.vehicleType || "all")
    if (file.year) setSelectedYear(file.year)
    fetchRecords()
  }

  // Fetch uploaded files
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoadingFiles(true)
        const files = await FileHistoryAPI.getFiles()
        setUploadedFiles(files)
      } catch (error) {
        console.error('Error fetching files:', error)
      } finally {
        setLoadingFiles(false)
      }
    }

    fetchFiles()
  }, [])

  // Filter records based on search
  const filteredData = records.filter(item => 
    searchTerm === '' || 
    item.vehicleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.region.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p>{error}</p>
        </div>
      )}

      {loadingFiles ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Chargement de l'historique...
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      ) : (
        <FileHistory 
          files={uploadedFiles}
          onDownload={handleDownloadFile}
          onDelete={handleDeleteFile}
          onView={handleViewFile}
          isDownloading={isDownloading}
          downloadingFileId={downloadingFileId}
          isDeleting={isDeleting}
          deletingFileId={deletingFileId}
        />
      )}

      {isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
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
              <Select value={selectedVehicleType} onValueChange={setSelectedVehicleType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {availableVehicleTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Région</Label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les régions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les régions</SelectItem>
                  {availableRegions.map((region) => (
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
            
            <div>
              <Label>Année</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les années" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les années</SelectItem>
                  {Array.from({ length: 6 }, (_, i) => {
                    const year = (new Date().getFullYear() - i).toString()
                    return (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    )
                  })}
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
            
            <Input
              placeholder="Recherche rapide..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
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
          <GroupedDataTables data={filteredData} />
        </CardContent>
      </Card>
    </div>
  )
}
