"use client"

// UI Components
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

// API Services
import { UploadAPI, VehicleAPI } from "@/lib/api"
import StorageService, { UploadedFile } from "@/lib/storage-service"

// Icons
import { AlertCircle, Calendar, Check, FileSpreadsheet, Filter, UploadCloud, X } from "lucide-react"

// React Hooks and Libraries
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"

// Type Definitions
interface UploadClientProps {
  maxFileSize?: number;
  allowedFileTypes?: string[];
}

interface ImportOptions {
  vehicleType: string;
  year: string;
  replaceExisting: boolean;
  region: string; 
}

interface PreviewDataItem {
  [key: string]: any;
}

type SheetSelectorProps = {
  sheets: string[];
  selectedSheet: string | null;
  onSelectSheet: (sheet: string) => void;
};

type FilePreviewProps = {
  file: File;
  onCancel: () => void;
  uploading: boolean;
};

// Application Constants
const STANDARD_VEHICLE_TYPES = [
  'CAMION',
  'VOITURE',
  'CHARIOT'
];

const REGIONS = [
  'Tunis',
  'MDjez Elbeb'
];

const DEFAULT_MAX_FILE_SIZE = 100; // MB
const DEFAULT_ALLOWED_FILE_TYPES = ['.xlsx', '.xls', 'csv'];

// Local Storage Keys
const STORAGE_KEY_PARAMETERS = 'confirmedParameters';


/**
 * Sheet Selector Component
 * Displays available Excel sheets and handles selection
 */
const SheetSelector = memo(({ sheets, selectedSheet, onSelectSheet }: SheetSelectorProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
    {sheets.map((sheet, index) => {
      const isSelected = selectedSheet === sheet;
      return (
        <div 
          key={index}
          className={`p-2 border rounded-md cursor-pointer transition-all ${isSelected ? 'bg-primary text-white border-primary' : 'bg-card hover:border-primary/50 hover:bg-muted/20'}`}
          onClick={() => onSelectSheet(sheet)}
        >
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-primary'}`} />
            <span className="text-sm font-medium truncate">{sheet}</span>
          </div>
        </div>
      );
    })}
  </div>
));

SheetSelector.displayName = 'SheetSelector';

/**
 * File Preview Component
 * Displays selected file information and provides cancel option
 */
const FilePreview = memo(({ file, onCancel, uploading }: FilePreviewProps) => {
  // Calculate file size in MB with 2 decimal places
  const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="bg-green-50 p-2 rounded-md">
          <FileSpreadsheet className="h-8 w-8 text-green-500" />
        </div>
        <div>
          <p className="font-medium">{file.name}</p>
          <div className="flex items-center text-sm text-muted-foreground gap-2">
            <span className="px-2 py-0.5 bg-muted rounded-full text-xs">
              {fileSizeMB} MB
            </span>
            <span className="text-xs">Excel</span>
          </div>
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={onCancel}
        disabled={uploading}
        className="rounded-full hover:bg-red-50 hover:text-red-500"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
});

FilePreview.displayName = 'FilePreview';

export function UploadClient({ 
  maxFileSize = DEFAULT_MAX_FILE_SIZE, 
  allowedFileTypes = DEFAULT_ALLOWED_FILE_TYPES 
}: UploadClientProps) {
  // File and upload state management
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  // Sheet and data state management
  const [availableSheets, setAvailableSheets] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [previewData, setPreviewData] = useState<any[] | null>(null)
  const [fullData, setFullData] = useState<any[] | null>(null)
  const [showFullData, setShowFullData] = useState<boolean>(false)
  const [saving, setSaving] = useState(false)
  
  // Parameter confirmation state
  const [parametersConfirmed, setParametersConfirmed] = useState(false)
  const [importOptions, setImportOptions] = useState<ImportOptions>(() => {
    // Default values
    const defaultValues = {
      vehicleType: '',
      year: new Date().getFullYear().toString(),
      replaceExisting: false,
      region: ''
    };
    
    // Only access localStorage in the browser environment
    if (typeof window !== 'undefined') {
      // Try to load saved parameters from localStorage
      const savedParams = localStorage.getItem(STORAGE_KEY_PARAMETERS);
      if (savedParams) {
        try {
          const parsed = JSON.parse(savedParams);
          return {
            vehicleType: parsed.vehicleType || defaultValues.vehicleType,
            year: parsed.year || defaultValues.year,
            replaceExisting: parsed.replaceExisting || defaultValues.replaceExisting,
            region: parsed.region || defaultValues.region
          };
        } catch (e) {
          console.error('Error parsing saved parameters:', e);
        }
      }
    }
    
    // Return default values if not in browser or no saved params
    return defaultValues;
  })
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([])

  // Initialize with standard vehicle types
  useEffect(() => {
    // Use only the three main vehicle types
    setVehicleTypes(STANDARD_VEHICLE_TYPES);
    
    // Set default vehicle type if not already set
    if (!importOptions.vehicleType && STANDARD_VEHICLE_TYPES.length > 0) {
      setImportOptions(prev => ({
        ...prev,
        vehicleType: STANDARD_VEHICLE_TYPES[0],
        region: REGIONS[0] // Also set a default region
      }));
    }
  }, []);

  /**
   * Validates that all required parameters are set
   */
  const validateParameters = useCallback((): boolean => {
    if (!importOptions.vehicleType) {
      toast.error("Veuillez sélectionner un type de véhicule");
      return false;
    }
    
    if (!importOptions.region) {
      toast.error("Veuillez sélectionner une région");
      return false;
    }
    
    if (!importOptions.year) {
      toast.error("Veuillez spécifier une année");
      return false;
    }
    
    return true;
  }, [importOptions.vehicleType, importOptions.region, importOptions.year]);
  
  /**
   * Confirms parameters and stores them in localStorage
   */
  const confirmParameters = useCallback(() => {
    if (!validateParameters()) return false;
    
    // Mark parameters as confirmed
    setParametersConfirmed(true);
    
    // Store confirmed parameters in localStorage for persistence (browser only)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PARAMETERS, JSON.stringify({
        vehicleType: importOptions.vehicleType,
        region: importOptions.region,
        year: importOptions.year,
        replaceExisting: importOptions.replaceExisting
      }));
    }
    
    toast.success("Paramètres confirmés! Vous pouvez maintenant télécharger votre fichier.");
    // Scroll to the file upload section
    document.getElementById('file-upload-section')?.scrollIntoView({ behavior: 'smooth' });
    
    return true;
  }, [importOptions, validateParameters]);
  
  /**
   * Function to process files after validation
   */
  const processFiles = (acceptedFiles: File[]) => {
    // Filter for Excel files
    const excelFiles = acceptedFiles.filter(
      file => file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
              file.type === "application/vnd.ms-excel" ||
              file.name.endsWith(".xlsx") ||
              file.name.endsWith(".xls")
    )
    
    if (excelFiles.length === 0) {
      toast.error("Seuls les fichiers Excel (.xlsx, .xls) sont acceptés")
      return false
    }
    
    // Check file size
    const tooLarge = excelFiles.some(file => file.size > maxFileSize * 1024 * 1024)
    if (tooLarge) {
      toast.error(`La taille du fichier ne doit pas dépasser ${maxFileSize}MB`)
      return false
    }
    
    // Reset all states
    setFiles(excelFiles)
    setUploadSuccess(false)
    setUploadError(null)
    setAvailableSheets([])
    setSelectedSheet(null)
    setPreviewData(null)
    
    return excelFiles
  }
  
  /**
   * Handles file drop 
   */
  const onDrop = useCallback((acceptedFiles: File[]) => {
    try {
      // Validate parameters first
      if (!importOptions.vehicleType) {
        toast.error("Veuillez sélectionner un type de véhicule avant de télécharger un fichier");
        return;
      }
      
      if (!importOptions.region) {
        toast.error("Veuillez sélectionner une région avant de télécharger un fichier");
        return;
      }
      
      if (!importOptions.year) {
        toast.error("Veuillez spécifier une année avant de télécharger un fichier");
        return;
      }
      
      // Mark parameters as confirmed
      setParametersConfirmed(true);
      
      // Process the files
      const excelFiles = processFiles(acceptedFiles)
      if (!excelFiles) return
      
      // Start the upload process
      setUploading(true);
      setUploadProgress(0);
      
      // Use a ref to track intervals that need to be cleared
      let progressInterval: NodeJS.Timeout | null = null;
      
      try {
        // Simulate progress for better UX
        progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 300);
        
        // Use UploadAPI service to upload the file to the correct endpoint: /upload
        UploadAPI.uploadFile(excelFiles[0]).then(sheets => {
          // Get sheet names from the upload result
          if (sheets && Array.isArray(sheets) && sheets.length > 0) {
            setAvailableSheets(sheets);
            setSelectedSheet(sheets[0]); // Select the first sheet by default
            setUploadSuccess(true);
          } else {
            setUploadError("Aucune feuille de calcul n'a été trouvée dans le fichier");
          }
        }).catch(error => {
          console.error("Upload error:", error);
          setUploadError("Une erreur s'est produite lors du téléchargement. Veuillez réessayer.");
          toast.error("Erreur de téléchargement");
        }).finally(() => {
          if (progressInterval) clearInterval(progressInterval);
          setUploading(false);
          setUploadProgress(100);
        });
      } catch (error) {
        console.error("Upload error:", error);
        if (progressInterval) clearInterval(progressInterval);
        setUploading(false);
        setUploadError(error instanceof Error ? error.message : 'Unknown error');
      }
    } catch (error) {
      console.error("Error in file drop handler:", error);
      toast.error("Une erreur s'est produite lors du traitement du fichier");
    }
  }, [maxFileSize, importOptions])
  
  // Memoized dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    multiple: false
  })
  
  // This function is no longer used as we've moved the upload logic directly into onDrop
  // Keeping it here to avoid breaking any other parts of the code that might reference it
  const handleUpload = useCallback(async (filesToUpload: File[] = files) => {
    if (filesToUpload.length === 0) {
      toast.error("Veuillez sélectionner un fichier")
      return
    }
    
    // Always validate parameters for safety
    if (!importOptions.vehicleType) {
      toast.error("Veuillez sélectionner un type de véhicule avant de télécharger le fichier")
      return
    }
    
    if (!importOptions.region) {
      toast.error("Veuillez sélectionner une région avant de télécharger le fichier")
      return
    }
    
    if (!importOptions.year) {
      toast.error("Veuillez spécifier une année avant de télécharger le fichier")
      return
    }
    
    // Mark parameters as confirmed since they're valid
    setParametersConfirmed(true);
    
    setUploading(true);
    
    setUploadProgress(0);
    setUploadError(null);
    
    // Use a ref to track intervals that need to be cleared
    let progressInterval: NodeJS.Timeout | null = null;
    
    try {
      // Simulate progress for better UX
      progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 300);
      
      // Use UploadAPI service to upload the file to the correct endpoint: /upload
      const sheets = await UploadAPI.uploadFile(filesToUpload[0]);
      
      // Get sheet names from the upload result
      if (sheets && Array.isArray(sheets) && sheets.length > 0) {
        setAvailableSheets(sheets);
        setSelectedSheet(sheets[0]); // Select the first sheet by default
        
        // Also update vehicle type based on sheet name if possible
        if (sheets[0]) {
          // Try to match the sheet name to a vehicle type
          const sheetName = sheets[0];
          
          // First check if the sheet name is already in vehicleTypes array
          if (vehicleTypes.includes(sheetName)) {
            setImportOptions(prev => ({
              ...prev,
              vehicleType: sheetName
            }));
          } else {
            // Try to find a matching vehicle type based on the sheet name
            // For example, if sheet name contains "voiture" or "car", use "VOITURE"
            const sheetNameLower = sheetName.toLowerCase();
            if (sheetNameLower.includes('voiture') || sheetNameLower.includes('car')) {
              setImportOptions(prev => ({ ...prev, vehicleType: 'VOITURE' }));
            } else if (sheetNameLower.includes('camion') || sheetNameLower.includes('truck')) {
              setImportOptions(prev => ({ ...prev, vehicleType: 'CAMION' }));
            } else if (sheetNameLower.includes('chariot') || sheetNameLower.includes('cart')) {
              setImportOptions(prev => ({ ...prev, vehicleType: 'CHARIOT' }));
            } else if (sheetNameLower.includes('sheet')) {
              setImportOptions(prev => ({ ...prev, vehicleType: 'Sheet1' }));
            } else if (vehicleTypes.length > 0) {
              // Default to first vehicle type if no match
              setImportOptions(prev => ({ ...prev, vehicleType: vehicleTypes[0] }));
            }
          }
        }
        
        setUploadSuccess(true);
        setUploadProgress(100);
        toast.success("Fichier téléchargé avec succès. Sélectionnez une feuille pour continuer.");
        
        // Don't automatically extract data - wait for user to select a sheet and click the button
      } else {
        toast.error("Aucune feuille trouvée dans le fichier Excel")
        setUploadSuccess(false)
        setUploadProgress(0)
      }
    } catch (error) {
      console.error("Upload error:", error)
      setUploadError(error instanceof Error ? error.message : 'Unknown error');
      toast.error("Erreur de téléchargement")
    } finally {
      // Clean up interval
      if (progressInterval) clearInterval(progressInterval)
      setUploading(false)
    }
  }, [files, importOptions.vehicleType, importOptions.region, importOptions.year, parametersConfirmed])
  
  /**
   * Extracts data from the selected sheet
   */
  const handleExtractData = useCallback(async () => {
    if (!selectedSheet || files.length === 0) {
      toast.error("Veuillez sélectionner une feuille de calcul");
      return;
    }
    
    // Validate required parameters before extraction
    if (!validateParameters()) {
      return;
    }
    
    setExtracting(true);
    setPreviewData(null);
    setFullData(null);
    
    try {
      // Use UploadAPI service to extract data from the selected sheet using the correct endpoint: /extract
      const extractedData = await UploadAPI.extractData(files[0], selectedSheet);
      
      if (extractedData && Array.isArray(extractedData) && extractedData.length > 0) {
        // Store full data and show preview (limit to 5 items)
        setFullData(extractedData);
        setPreviewData(extractedData.slice(0, 5));
        
        // Update importOptions only if vehicleType is not already set
        if (!importOptions.vehicleType && vehicleTypes.length > 0) {
          // Check if the sheet name matches any vehicle type
          if (vehicleTypes.includes(selectedSheet)) {
            setImportOptions(prev => ({
              ...prev,
              vehicleType: selectedSheet
            }));
          } else {
            // Try to find a matching vehicle type based on the sheet name
            // For example, if sheet name contains "voiture" or "car", use "VOITURE"
            const sheetNameLower = selectedSheet.toLowerCase();
            if (sheetNameLower.includes('voiture') || sheetNameLower.includes('car')) {
              setImportOptions(prev => ({ ...prev, vehicleType: 'VOITURE' }));
            } else if (sheetNameLower.includes('camion') || sheetNameLower.includes('truck')) {
              setImportOptions(prev => ({ ...prev, vehicleType: 'CAMION' }));
            } else if (sheetNameLower.includes('chariot') || sheetNameLower.includes('cart')) {
              setImportOptions(prev => ({ ...prev, vehicleType: 'CHARIOT' }));
            } else if (sheetNameLower.includes('sheet')) {
              setImportOptions(prev => ({ ...prev, vehicleType: 'Sheet1' }));
            } else if (vehicleTypes.length > 0) {
              // Default to first vehicle type if no match
              setImportOptions(prev => ({ ...prev, vehicleType: vehicleTypes[0] }));
            }
          }
        }
        
        toast.success("Données extraites avec succès");
      } else {
        toast.error("Aucune donnée trouvée dans la feuille sélectionnée")
      }
    } catch (error) {
      console.error("Extraction error:", error)
      toast.error("Erreur lors de l'extraction des données")
    } finally {
      setExtracting(false)
    }
  }, [selectedSheet, files, importOptions.vehicleType, vehicleTypes])
  
  // Memoized sheet selector handler
  const handleSheetSelect = useCallback((sheet: string) => {
    setSelectedSheet(sheet);
    
    // Automatically start data extraction when a sheet is selected
    setTimeout(() => {
      handleExtractData();
    }, 500); // Small delay to allow UI to update
  }, [handleExtractData])
  
  // Memoized cancel handler
  const handleCancel = useCallback(() => {
    setFiles([])
    setUploadSuccess(false)
    setUploadError(null)
    setUploadProgress(0)
    setAvailableSheets([])
    setSelectedSheet(null)
    setPreviewData(null)
  }, [])
  
  // Import handler - only called when user clicks "Importer les données maintenant" button
  const handleImport = useCallback(async () => {
    // Verify all required data is available before proceeding
    if (!selectedSheet || !files.length || !previewData) {
      toast.error("Données non disponibles pour l'importation")
      return
    }
    
    // Validate all required parameters before saving
    if (!importOptions.vehicleType) {
      toast.error("Veuillez sélectionner un type de véhicule avant d'importer les données")
      return
    }
    
    if (!importOptions.region) {
      toast.error("Veuillez sélectionner une région avant d'importer les données")
      return
    }
    
    if (!importOptions.year) {
      toast.error("Veuillez spécifier une année avant d'importer les données")
      return
    }
    
    // Validate all required parameters before saving
    if (!importOptions.vehicleType) {
      toast.error("Veuillez sélectionner un type de véhicule avant d'importer les données")
      return
    }
    
    if (!importOptions.region) {
      toast.error("Veuillez sélectionner une région avant d'importer les données")
      return
    }
    
    if (!importOptions.year) {
      toast.error("Veuillez spécifier une année avant d'importer les données")
      return
    }
    
    // Confirm with user before saving data with detailed information
    const confirmMessage = `Confirmation d'importation des données:\n\n` +
      `- Type de véhicule: ${getVehicleTypeLabel(importOptions.vehicleType)}\n` +
      `- Région: ${importOptions.region}\n` +
      `- Année: ${importOptions.year}\n` +
      `- Remplacement des données existantes: ${importOptions.replaceExisting ? 'Oui' : 'Non'}\n\n` +
      `Êtes-vous sûr de vouloir continuer?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setSaving(true);
    
    try {
      const month = "all"; // Import all months
      
      // Pass the explicitly selected vehicle type and region to saveData method
      const success = await UploadAPI.saveData(
        files[0],
        selectedSheet,
        importOptions.year,
        month,
        importOptions.replaceExisting,
        importOptions.vehicleType,  // Always pass the selected vehicle type
        importOptions.region        // Always pass the selected region
      );
      
      if (success) {
        toast.success(
          `Données importées avec succès: ${getVehicleTypeLabel(importOptions.vehicleType)} - ${importOptions.region} - ${importOptions.year}`
        )
        // Log successful save with parameters for debugging
        console.log('Data saved successfully with parameters:', {
          vehicleType: importOptions.vehicleType,
          region: importOptions.region,
          year: importOptions.year
        })
        
        // Reset form state
        setSaving(false)
        
        // Reset file upload state
        setFiles([])
        setUploadSuccess(false)
        setUploadProgress(0)
        setAvailableSheets([])
        setSelectedSheet(null)
        setPreviewData(null)
        setFullData(null)
        const fileMetadata: UploadedFile = {
          id: crypto.randomUUID(),
          name: files[0].name,
          filename: files[0].name,
          uploadDate: new Date().toISOString(),
          year: parseInt(importOptions.year),
          size: files[0].size,
          recordCount: fullData?.length || 0,
          vehicleTypes: [importOptions.vehicleType],
          fileType: files[0].type
        };
        
        StorageService.uploadedFiles.addFile(fileMetadata);
      } else {
        toast.error("Erreur lors de l'importation des données");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Une erreur s'est produite lors de l'importation des données");
    } finally {
      setSaving(false);
    }
  }, [files, selectedSheet, importOptions, fullData]);
  
  // Helper to display a friendly vehicle type name
  const getVehicleTypeLabel = (type: string): string => {
    if (!type) return "";
    
    switch (type.toUpperCase()) {
      case 'VOITURE': return 'Voitures';
      case 'CAMION': return 'Camions';
      case 'CHARIOT': return 'Chariots';
      case 'SHEET1': return 'Sheet1';
      default: return type; // Return as is for custom types
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-semibold tracking-tight mb-1">Importation de données</h2>
        <p className="text-sm text-muted-foreground">
          Téléchargez des fichiers Excel pour importer des données de consommation de carburant
        </p>
      </div>
      
      {/* Workflow Steps Indicator */}
      <div className="flex items-center justify-between px-2 py-3 bg-muted/20 rounded-lg mb-4">
        <div className="flex items-center space-x-2">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${!files.length ? 'bg-primary text-white' : 'bg-green-100 text-green-700'}`}>
            {!files.length ? '1' : <Check className="h-4 w-4" />}
          </div>
          <span className="text-sm font-medium">Sélection du fichier</span>
        </div>
        
        <div className="h-0.5 w-12 bg-muted"></div>
        
        <div className="flex items-center space-x-2">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${!uploadSuccess ? 'bg-muted text-muted-foreground' : selectedSheet ? 'bg-green-100 text-green-700' : 'bg-primary text-white'}`}>
            {!uploadSuccess ? '2' : selectedSheet ? <Check className="h-4 w-4" /> : '2'}
          </div>
          <span className={`text-sm ${!uploadSuccess ? 'text-muted-foreground' : 'font-medium'}`}>Sélection de la feuille</span>
        </div>
        
        <div className="h-0.5 w-12 bg-muted"></div>
        
        <div className="flex items-center space-x-2">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${!previewData ? 'bg-muted text-muted-foreground' : 'bg-primary text-white'}`}>
            {!previewData ? '3' : '3'}
          </div>
          <span className={`text-sm ${!previewData ? 'text-muted-foreground' : 'font-medium'}`}>Aperçu des données</span>
        </div>
        
        <div className="h-0.5 w-12 bg-muted"></div>
        
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
            4
          </div>
          <span className="text-sm text-muted-foreground">Importation</span>
        </div>
      </div>
      
      {/* Import Configuration Form - Shown before file upload */}
      <Card className="shadow-md mb-6">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle>Configuration de l'importation</CardTitle>
          </div>
          <CardDescription>
            Définissez les paramètres d'importation avant de télécharger votre fichier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleType" className="flex items-center gap-2 text-base">
                <span className="font-semibold text-primary">Type de véhicule*</span>
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Obligatoire</span>
              </Label>
              <Select
                value={importOptions.vehicleType}
                onValueChange={(value) => setImportOptions(prev => ({ ...prev, vehicleType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={"Sélectionner un type"} />
                </SelectTrigger>
                <SelectContent>
                  {STANDARD_VEHICLE_TYPES.map((type: string) => (
                    <SelectItem key={type} value={type}>
                      {getVehicleTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="region" className="flex items-center gap-2 text-base">
                <span className="font-semibold text-primary">Région*</span>
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Obligatoire</span>
              </Label>
              <Select
                value={importOptions.region}
                onValueChange={(value) => setImportOptions(prev => ({ ...prev, region: value }))}
              >
                <SelectTrigger id="region">
                  <SelectValue placeholder="Sélectionner une région" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((region: string) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="year" className="flex items-center gap-2 text-base">
                <span className="font-semibold text-primary">Année*</span>
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Obligatoire</span>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </Label>
              <Input
                id="year"
                type="number"
                min="2000"
                max="2100"
                value={importOptions.year}
                onChange={(e) => setImportOptions(prev => ({ ...prev, year: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="replaceExisting" className="flex items-center gap-2 text-base">
                <span className="font-semibold text-primary">Remplacer les données existantes</span>
              </Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="replaceExisting"
                  checked={importOptions.replaceExisting}
                  onCheckedChange={(checked) => setImportOptions(prev => ({ ...prev, replaceExisting: checked }))}
                />
                <Label htmlFor="replaceExisting" className="text-sm text-muted-foreground cursor-pointer">
                  {importOptions.replaceExisting ? "Oui" : "Non"}
                </Label>
              </div>
            </div>
          </div>
          
          {/* Confirmation button for parameter selection */}
          <div className="mt-4">
            <Button 
              onClick={confirmParameters}
              className="w-full bg-green-600 hover:bg-green-700 gap-2"
            >
              <Check className="h-5 w-5" />
              Confirmer les paramètres
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* File Upload Card */}
      <Card className="shadow-md" id="file-upload-section">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <CardTitle>Téléchargement de fichier</CardTitle>
          </div>
          <CardDescription>
            Formats acceptés: Excel (.xlsx, .xls) | Taille maximale: {maxFileSize}MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!files.length ? (
            <div className="space-y-6">
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive ? "border-primary bg-primary/10 scale-[0.98]" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/10"
                }`}
              >
                <input {...getInputProps()} />
                <div className="p-4 bg-primary/5 rounded-full inline-flex items-center justify-center mb-4">
                  <UploadCloud className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {isDragActive ? "Déposez le fichier ici" : "Glissez-déposez un fichier"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  ou <span className="text-primary font-medium">cliquez pour sélectionner</span> un fichier
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <FileSpreadsheet className="h-3 w-3" />
                  <span>Formats acceptés: .xlsx, .xls</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file, index) => (
                <FilePreview 
                  key={index} 
                  file={file} 
                  onCancel={handleCancel} 
                  uploading={uploading} 
                />
              ))}
              
              {uploadError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>
                    {uploadError}
                  </AlertDescription>
                </Alert>
              )}
              
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Téléchargement en cours...</span>
                    <span>{uploadProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
              
              {uploadSuccess && availableSheets.length > 0 && (
                <div className="space-y-5 mt-2">
                  <div className="flex items-center justify-between p-3 bg-green-50 text-green-700 rounded-md">
                    <div className="flex items-center space-x-2">
                      <div className="bg-green-100 p-1 rounded-full">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="font-medium text-sm">Fichier téléchargé avec succès</span>
                    </div>
                    <span className="text-xs bg-green-100 px-2 py-1 rounded-full">Étape 2/4</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-primary/5 p-3 rounded-md border border-primary/20">
                      <h4 className="font-medium text-primary mb-1">Feuilles disponibles</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        {availableSheets.length} feuille(s) trouvée(s) dans le fichier Excel. Sélectionnez une feuille pour extraire les données.
                      </p>
                      
                      <SheetSelector 
                        sheets={availableSheets} 
                        selectedSheet={selectedSheet} 
                        onSelectSheet={handleSheetSelect} 
                      />
                    </div>
                    
                    {selectedSheet && (
                      <div className="bg-muted/20 p-4 rounded-md border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-primary" />
                            <span className="font-medium">Feuille sélectionnée: <span className="text-primary">{selectedSheet}</span></span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs"
                            onClick={() => setSelectedSheet(null)}
                          >
                            Changer
                          </Button>
                        </div>
                        
                        {/* Parameter summary card */}
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                          <h4 className="text-blue-700 font-medium mb-2 flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Paramètres d'importation
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p><span className="font-medium">Type de véhicule:</span> {getVehicleTypeLabel(importOptions.vehicleType)}</p>
                              <p><span className="font-medium">Année:</span> {importOptions.year}</p>
                            </div>
                            <div>
                              <p><span className="font-medium">Région:</span> {importOptions.region}</p>
                              <p><span className="font-medium">Remplacement:</span> {importOptions.replaceExisting ? "Oui" : "Non"}</p>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => {
                            // Automatically extract data when sheet is selected
                            handleExtractData();
                          }}
                          disabled={extracting}
                          className="w-full gap-2 bg-primary/90 hover:bg-primary"
                        >
                          {extracting ? (
                            <>
                              <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                              Extraction en cours...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Extraire les données de cette feuille
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {previewData && previewData.length > 0 && (
                <div className="mt-6 space-y-5">
                  <div className="flex items-center justify-between p-3 bg-blue-50 text-blue-700 rounded-md">
                    <div className="flex items-center space-x-2">
                      <div className="bg-blue-100 p-1 rounded-full">
                        <Check className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-sm">Données extraites avec succès</span>
                    </div>
                    <span className="text-xs bg-blue-100 px-2 py-1 rounded-full">Étape 3/4</span>
                  </div>
                  
                  {/* Import Configuration Summary */}
                  <div className="bg-muted/20 p-4 rounded-lg border border-muted">
                    <div className="flex items-center gap-2 mb-3">
                      <Filter className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Résumé de la configuration</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-semibold">Type de véhicule:</span> <span className="text-primary">{getVehicleTypeLabel(importOptions.vehicleType)}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">Année:</span> <span className="text-primary">{importOptions.year}</span>
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-semibold">Région:</span> <span className="text-primary">{importOptions.region}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">Remplacer les données existantes:</span> <span className="text-primary">{importOptions.replaceExisting ? "Oui" : "Non"}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          // Scroll to the top configuration form
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        Modifier la configuration
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full"></div>
                      <div className="h-1.5 w-1.5 bg-primary rounded-full"></div>
                      <div className="h-1.5 w-1.5 bg-primary rounded-full"></div>
                      Aperçu des données
                    </h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                      {fullData ? fullData.length : 0} enregistrements trouvés
                    </span>
                  </div>
                  
                  {/* Data Table Preview */}
                  <div className="border-b border-muted mb-4">
                    <div className="flex space-x-6">
                      <button 
                        className={`px-4 py-2 text-sm transition-colors ${showFullData ? 'text-muted-foreground hover:text-foreground' : 'border-b-2 border-primary text-primary font-medium'}`}
                        onClick={() => setShowFullData(false)}
                      >
                        Aperçu (5 lignes)
                      </button>
                      <button 
                        className={`px-4 py-2 text-sm transition-colors ${!showFullData ? 'text-muted-foreground hover:text-foreground' : 'border-b-2 border-primary text-primary font-medium'}`}
                        onClick={() => setShowFullData(true)}
                      >
                        Toutes les données ({fullData?.length || 0} lignes)
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-auto max-h-72 border rounded-md shadow-sm">
                    <table className="w-full border-collapse">
                      <thead className="bg-muted/50 sticky top-0 z-10">
                        <tr>
                          {/* Use the first row of either data set to get column headers */}
                          {(showFullData ? (fullData || []) : (previewData || [])).length > 0 && 
                           Object.keys((showFullData ? (fullData || []) : (previewData || []))[0] || {}).map((key) => (
                            <th key={key} className="p-2.5 text-left border-b font-medium text-sm truncate max-w-[150px]">
                              {formatColumnHeader(key)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {/* Display either full data or preview data based on showFullData state */}
                        {(showFullData ? (fullData || []) : (previewData || [])).map((row, rowIndex) => (
                          <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/10'}>
                            {Object.entries(row).map(([key, value]: [string, any], colIndex) => (
                              <td 
                                key={`${rowIndex}-${colIndex}`}
                                className="px-4 py-3 text-sm truncate max-w-[150px]"
                                title={value?.toString() || ""}
                              >
                                {formatCellValue(key, value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {showFullData ? (
                        <span>Affichage de <span className="font-medium">{(fullData || []).length}</span> enregistrements</span>
                      ) : (
                        <span><span className="font-medium">Note:</span> Affichage des 5 premières lignes uniquement</span>
                      )}
                    </p>
                    <div className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                      Prêt à importer
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        {/* CardFooter remains the same */}
        
      </Card>
      
      {/* Data Preview Detail */}
      {uploadSuccess && previewData && previewData.length > 0 && (
        <Card className="mt-8 shadow-md border-green-100">
          <CardHeader className="bg-green-50/50 border-b border-green-100">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <CardTitle className="text-green-800">Données prêtes à être importées</CardTitle>
            </div>
            <CardDescription className="text-green-700">
              Un aperçu détaillé des données à importer dans le système
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Source des données
                  </h4>
                  <div className="text-sm text-blue-800">
                    <p className="mb-1"><span className="font-medium">Fichier:</span> {files[0]?.name}</p>
                    <p className="mb-1"><span className="font-medium">Feuille:</span> {selectedSheet}</p>
                    <p><span className="font-medium">Taille:</span> {files[0] ? (files[0].size / 1024 / 1024).toFixed(2) + ' MB' : '-'}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Configuration
                  </h4>
                  <div className="text-sm text-green-800">
                    <p className="mb-1"><span className="font-medium">Type de véhicule:</span> {getVehicleTypeLabel(importOptions.vehicleType)}</p>
                    <p className="mb-1"><span className="font-medium">Année:</span> {importOptions.year}</p>
                    <p className="mb-1"><span className="font-medium">Région:</span> {importOptions.region}</p>
                    <p><span className="font-medium">Remplacement:</span> {importOptions.replaceExisting ? 'Oui' : 'Non'}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <h4 className="font-medium text-amber-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Résumé
                  </h4>
                  <div className="text-sm text-amber-800">
                    <p className="mb-1"><span className="font-medium">Enregistrements:</span> {fullData?.length || 0}</p>
                    <p className="mb-1"><span className="font-medium">Colonnes:</span> {previewData && previewData[0] ? Object.keys(previewData[0]).length : 0}</p>
                    <p><span className="font-medium">État:</span> <span className="text-green-600 font-medium">Prêt à importer</span></p>
                  </div>
                </div>
              </div>
              
                      <div className="mt-4">
                <Button 
                  onClick={handleImport} 
                  disabled={saving || !previewData} 
                  className="w-full bg-green-600 hover:bg-green-700 gap-2"
                >
                  {saving ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      Importation en cours...
                    </>
                  ) : !previewData ? (
                    <>
                      <AlertCircle className="h-5 w-5" />
                      Extrayez les données d'abord
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Importer les données maintenant
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Les données ne seront enregistrées que lorsque vous cliquerez sur ce bouton
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper to format column headers
function formatColumnHeader(key: string): string {
  const headerMappings: Record<string, string> = {
    'id': 'ID',
    'matricule': 'Matricule',
    'type': 'Type',
    'mois': 'Mois',
    'annee': 'Année',
    'year': 'Année',
    'consommationL': 'Consommation (L)',
    'consommation': 'Consommation (L)',
    'consommationTEP': 'Cons. (TEP)',
    'coutDT': 'Coût (DT)',
    'kilometrage': 'Kilométrage',
    'km': 'Kilométrage',
    'produitsTonnes': 'Tonnage',
    'tonnage': 'Tonnage',
    'ipeL100km': 'IPE (L/100km)',
    'ipe': 'IPE',
    'ipeTonne': 'IPE (tonne)',
    'driver': 'Conducteur',
    'location': 'Emplacement',
    'region': 'Région'
  };
  
  return headerMappings[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

// Helper to format cell values based on column type
function formatCellValue(key: string, value: any): string {
  if (value === null || value === undefined) return '-';

  // Numeric columns
  if (typeof value === 'number') {
    // Financial or large numbers
    if (key.toLowerCase().includes('consommation') || 
        key.toLowerCase().includes('cout') || 
        key.toLowerCase().includes('kilometrage') ||
        key.toLowerCase().includes('km')) {
      return value.toLocaleString('fr-FR', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    }
    
    // Efficiency metrics (IPE)
    if (key.toLowerCase().includes('ipe')) {
      return value.toLocaleString('fr-FR', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    
    // Default number formatting
    return value.toString();
  }
  
  // Date-like string
  if (typeof value === 'string' && 
      (key.toLowerCase().includes('date') || 
       key.toLowerCase() === 'mois')) {
    return value;
  }
  
  // Default string formatting
  return value.toString();
}
