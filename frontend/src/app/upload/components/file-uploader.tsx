"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { UploadAPI, VehicleAPI } from "@/lib/api"
import { AlertCircle, Calendar, Check, Clock, FileType, Upload, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"

interface FileUploaderProps {
  onFileUploaded?: (success: boolean) => void
  onDataImported?: (data: any) => void
}

export function FileUploader({ onFileUploaded, onDataImported }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [sheets, setSheets] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>("")
  const [vehicleType, setVehicleType] = useState<string>("")
  const [year, setYear] = useState<string>(new Date().getFullYear().toString())
  const [month, setMonth] = useState<string>("all")
  const [replaceExisting, setReplaceExisting] = useState<boolean>(true)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [availableVehicleTypes, setAvailableVehicleTypes] = useState<string[]>([])
  const [isLoadingVehicleTypes, setIsLoadingVehicleTypes] = useState<boolean>(true)
  const [uploadSuccess, setUploadSuccess] = useState<boolean | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Month names in French for selection
  const months = [
    { value: "all", label: "Tous les mois" },
    { value: "Janvier", label: "Janvier" },
    { value: "Février", label: "Février" },
    { value: "Mars", label: "Mars" },
    { value: "Avril", label: "Avril" },
    { value: "Mai", label: "Mai" },
    { value: "Juin", label: "Juin" },
    { value: "Juillet", label: "Juillet" },
    { value: "Août", label: "Août" },
    { value: "Septembre", label: "Septembre" },
    { value: "Octobre", label: "Octobre" },
    { value: "Novembre", label: "Novembre" },
    { value: "Décembre", label: "Décembre" },
  ]

  // Fetch available vehicle types on component mount
  useEffect(() => {
    async function fetchVehicleTypes() {
      setIsLoadingVehicleTypes(true)
      try {
        const types = await VehicleAPI.getVehicleTypes()
        
        // Use both backend types (VOITURE, CAMION, etc.) and human-readable labels 
        // Ensure we have the standard types that match the backend
        const standardTypes = [
          'VOITURE', 
          'CAMION', 
          'CHARIOT', 
          'Sheet1'
        ]
        
        // Combine types from API with standard types, remove duplicates
        const allTypes = [...new Set([...standardTypes, ...types])]
        
        setAvailableVehicleTypes(allTypes)
        
        // Default to first available type if none selected yet
        if (allTypes.length > 0 && !vehicleType) {
          setVehicleType(allTypes[0])
        }
      } catch (error) {
        console.error("Failed to fetch vehicle types:", error)
        toast.error("Erreur lors du chargement des types de véhicules")
        
        // Use standard types as fallback
        setAvailableVehicleTypes(['VOITURE', 'CAMION', 'CHARIOT', 'Sheet1'])
        
        // Default to first vehicle type if none selected
        if (!vehicleType) {
          setVehicleType('VOITURE')
        }
      } finally {
        setIsLoadingVehicleTypes(false)
      }
    }
    
    fetchVehicleTypes()
  }, [])

  // Helper function to get display name for vehicle type
  const getVehicleTypeDisplayName = (type: string): string => {
    switch (type) {
      case 'VOITURE': return 'Voitures';
      case 'CAMION': return 'Camions';
      case 'CHARIOT': return 'Chariots';
      case 'Sheet1': return 'Sheet1';
      default: return type;
    }
  }

  // Configure dropzone for file uploads
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      // Reset status when new file is selected
      setUploadSuccess(null)
      setUploadError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  })

  // Reset the form
  const resetForm = () => {
    setFile(null)
    setSheets([])
    setSelectedSheet("")
    // Don't reset vehicleType and year to preserve user selection
    setMonth("all")
    setUploadSuccess(null)
    setUploadError(null)
  }

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      toast.error("Veuillez sélectionner un fichier")
      return
    }

    if (!vehicleType) {
      toast.error("Veuillez sélectionner un type de véhicule")
      return
    }

    setIsUploading(true)
    setUploadSuccess(null)
    setUploadError(null)

    try {
      const uploadedSheets = await UploadAPI.uploadFile(file)
      setSheets(uploadedSheets)
      
      // Auto-select first sheet
      if (uploadedSheets.length > 0) {
        setSelectedSheet(uploadedSheets[0])
      }
      
      setUploadSuccess(true)
      toast.success("Fichier téléchargé avec succès")
    } catch (error) {
      console.error("File upload error:", error)
      setUploadError("Erreur lors du téléchargement du fichier")
      toast.error("Erreur lors du téléchargement du fichier")
      setUploadSuccess(false)
    } finally {
      setIsUploading(false)
    }
  }

  // Process the uploaded file
  const handleProcess = async () => {
    if (!file || !selectedSheet) {
      toast.error("Veuillez sélectionner un fichier et une feuille")
      return
    }

    if (!vehicleType) {
      toast.error("Veuillez sélectionner un type de véhicule")
      return
    }

    setIsProcessing(true)
    setUploadError(null)

    try {
      console.log(`Processing file: ${file.name}, sheet: ${selectedSheet}, vehicle type: ${vehicleType}, year: ${year}, month: ${month}, replace: ${replaceExisting}`)
      
      // Make sure to use the exact same parameters as expected by the backend
      const success = await UploadAPI.saveData(
        file,
        selectedSheet,
        year,
        month,
        replaceExisting,
        vehicleType // Pass the selected vehicle type explicitly
      )

      if (success) {
        setUploadSuccess(true)
        toast.success("Données importées avec succès")
        resetForm()
        
        // Fetch and return preview data after successful import
        try {
          // Get a preview of the imported data to display
          const importedData = await VehicleAPI.getRecords({ 
            type: vehicleType,
            year: year,
            limit: 5 // Just get a small sample for preview
          });
          
          // Notify parent component about the imported data
          if (onDataImported && importedData) {
            onDataImported(importedData);
          }
        } catch (previewError) {
          console.error("Error fetching data preview:", previewError);
        }
        
        if (onFileUploaded) {
          onFileUploaded(true)
        }
      } else {
        setUploadSuccess(false)
        setUploadError("Erreur lors de l'importation des données")
        toast.error("Erreur lors de l'importation des données")
        
        if (onFileUploaded) {
          onFileUploaded(false)
        }
      }
    } catch (error) {
      console.error("Data import error:", error)
      setUploadSuccess(false)
      setUploadError("Erreur lors de l'importation des données")
      toast.error("Erreur lors de l'importation des données")
      
      if (onFileUploaded) {
        onFileUploaded(false)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="p-5 border shadow-sm">
      {/* Success or error message */}
      {uploadSuccess !== null && (
        <div className={`mb-4 p-3 rounded-md ${uploadSuccess ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <div className="flex items-center">
            {uploadSuccess ? (
              <Check className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span>
              {uploadSuccess 
                ? "L'opération a été effectuée avec succès" 
                : uploadError || "Une erreur est survenue pendant l'opération"
              }
            </span>
          </div>
        </div>
      )}

      {/* Always show vehicle type selection */}
      <div className="mb-6 p-4 border rounded-md bg-muted/20">
        <h3 className="font-medium text-lg mb-4">Configuration d'importation</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileType className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Type de véhicule</h4>
            </div>
            <Select 
              value={vehicleType} 
              onValueChange={setVehicleType} 
              disabled={isLoadingVehicleTypes}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoadingVehicleTypes ? "Chargement des types..." : "Sélectionner un type de véhicule"} />
              </SelectTrigger>
              <SelectContent>
                {availableVehicleTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getVehicleTypeDisplayName(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Année</h4>
            </div>
            <Input
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              type="number"
              min="2000"
              max="2050"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-10 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-10 w-10 text-primary/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Glissez-déposez un fichier Excel</h3>
          <p className="text-sm text-muted-foreground">
            ou <span className="text-primary">cliquez pour sélectionner</span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Formats acceptés: .xlsx, .xls
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium">{file.name}</h3>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB • Excel
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {sheets.length > 0 ? (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="sheet">Feuille</Label>
                <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une feuille" />
                  </SelectTrigger>
                  <SelectContent>
                    {sheets.map((sheet) => (
                      <SelectItem key={sheet} value={sheet}>
                        {sheet}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="month">Mois</Label>
                </div>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un mois" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="replace"
                  checked={replaceExisting}
                  onCheckedChange={setReplaceExisting}
                />
                <Label htmlFor="replace">Remplacer les données existantes</Label>
              </div>

              <Button onClick={handleProcess} disabled={isProcessing} className="w-full">
                {isProcessing ? "Importation en cours..." : "Importer les données"}
              </Button>
            </div>
          ) : (
            <Button onClick={handleUpload} disabled={isUploading} className="w-full">
              {isUploading ? "Téléchargement en cours..." : "Télécharger le fichier"}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
