/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { Car, Forklift, Pencil, PlusCircle, Save, Trash2, Truck } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { aggregateChariotMonthlyRecord, ChariotDailyRecord, createChariotDailyRecord, createVehicleRecord, updateChariotDailyRecord, updateVehicleRecord } from "./saisie"

// Formula configuration interface
interface FormulaConfig {
  tepFactor: number;  // TEP conversion factor (L to TEP)
  costFactor: number; // Cost per liter (DT)
  ipeFormula: string; // Formula for IPE calculation
  ipeTonneFormula: string; // Formula for IPE per tonne calculation
}

// Default formula configuration
const defaultFormulaConfig: FormulaConfig = {
  tepFactor: 0.00098,
  costFactor: 2.5,
  ipeFormula: "(consommationL * 100) / kilometrage",
  ipeTonneFormula: "(consommationL * 100) / (kilometrage * produitsTonnes)"
};

// Define vehicle types at the module level for reuse
type VehicleType = "CAMION" | "VOITURE" | "CHARIOT";
type VehicleEntry = { matricule: string; color: string; type?: string; region?: string };

interface SaisieManuelleClientProps {
  vehicleTypes: string[];
  regions: string[];
  apiEndpoint: string;
  vehicleData?: {
    [key: string]: Array<{
      matricule: string;
      color: string;
      type: string;
      region: string;
    }>;
  };
}

interface VehicleData {
  id?: string;
  type: string;
  matricule: string;
  mois: string;
  year: string;
  region: string;
  consommationL: number;
  consommationTEP?: number;
  coutDT?: number;
  kilometrage?: number;
  produitsTonnes?: number;
  ipeL100km?: number;
  ipeL100TonneKm?: number;
  [key: string]: unknown;
}

interface Parameter {
  name: string;
  unit: string;
  type: string[];
  isCustom: boolean;
  isRequired: boolean;
}

const FORMULA_CONFIG_KEY = "saisie_formula_config";

// Add a helper function for safe number formatting
function formatNumber(val: unknown): string {
  const num = typeof val === 'number' ? val : Number(val);
  return isNaN(num) ? '0.00' : num.toFixed(2);
}

export function SaisieManuelleClient({ vehicleTypes, regions, apiEndpoint, vehicleData }: SaisieManuelleClientProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  
  const [activeTab, setActiveTab] = useState<VehicleType>("CAMION")
  const [vehicleLists, setVehicleLists] = useState<Record<VehicleType, VehicleEntry[]>>({
    CAMION: [],
    VOITURE: [],
    CHARIOT: []
  })
  const [parameters, setParameters] = useState<Parameter[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>("Janvier")
  const [selectedRegion, setSelectedRegion] = useState<string>(regions[0])
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [isAddingMatricule, setIsAddingMatricule] = useState<boolean>(false)
  const [newMatricule, setNewMatricule] = useState<string>("")
  const [tableData, setTableData] = useState<Record<VehicleType, VehicleData[]>>({
    CAMION: [],
    VOITURE: [],
    CHARIOT: []
  })
  const [isAddingParameter, setIsAddingParameter] = useState<boolean>(false)
  const [newParameter, setNewParameter] = useState<Parameter>({
    name: "",
    unit: "",
    type: ["CAMION"],
    isCustom: true,
    isRequired: false
  })
  const [editingFormula, setEditingFormula] = useState<null | 'tep' | 'cost' | 'ipe' | 'ipeTonne'>(null);
  const [formulaConfig, setFormulaConfig] = useState<FormulaConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(FORMULA_CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    }
    return defaultFormulaConfig;
  });

  // Persist formulaConfig to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(FORMULA_CONFIG_KEY, JSON.stringify(formulaConfig));
    }
  }, [formulaConfig]);

  // Default parameters for each vehicle type
  const defaultParameters = useMemo<Record<VehicleType, Parameter[]>>(() => ({
    CAMION: [
      { name: "Consommation en L", unit: "L", type: ["CAMION"], isCustom: false, isRequired: true },
      { name: "Consommation en TEP", unit: "TEP", type: ["CAMION"], isCustom: false, isRequired: false },
      { name: "Coût en DT", unit: "DT", type: ["CAMION"], isCustom: false, isRequired: false },
      { name: "Kilométrage parcouru en Km", unit: "Km", type: ["CAMION"], isCustom: false, isRequired: true },
      { name: "Produits transportés en Tonne", unit: "Tonne", type: ["CAMION"], isCustom: false, isRequired: true },
    ],
    VOITURE: [
      { name: "Consommation en L", unit: "L", type: ["VOITURE"], isCustom: false, isRequired: true },
      { name: "Consommation en TEP", unit: "TEP", type: ["VOITURE"], isCustom: false, isRequired: false },
      { name: "Coût en DT", unit: "DT", type: ["VOITURE"], isCustom: false, isRequired: false },
      { name: "Kilométrage parcouru en Km", unit: "Km", type: ["VOITURE"], isCustom: false, isRequired: true }
    ],
    CHARIOT: [
      { name: "Consommation en L", unit: "L", type: ["CHARIOT"], isCustom: false, isRequired: true },
      { name: "Consommation en TEP", unit: "TEP", type: ["CHARIOT"], isCustom: false, isRequired: false },
      { name: "Coût en DT", unit: "DT", type: ["CHARIOT"], isCustom: false, isRequired: false }
    ]
  }), [])

  // Colors for matricules
  const colors = useMemo(() => [
    "#4ade80", // green-400
    "#facc15", // yellow-400
    "#3b82f6", // blue-500
    "#f87171", // red-400
    "#a855f7", // purple-500
    "#14b8a6", // teal-500
    "#f97316", // orange-500
    "#ec4899", // pink-500
    "#64748b", // slate-500
    "#84cc16"  // lime-500
  ], [])

  // French month names
  const months = useMemo(() => [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ], [])

  // Generate years (±5 from current)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 11 }, (_, i) => String(currentYear - 5 + i))
  }, [])

  // Always use a fixed, sorted list of vehicle types for tabs
  const fixedVehicleTypes: VehicleType[] = ["CAMION", "VOITURE", "CHARIOT"];

  // Fetch existing vehicles and parameters when component mounts or vehicleData changes
  useEffect(() => {
    fetchVehicles()
    fetchParameters()
  }, [vehicleData])

  // When tab changes, update parameters and vehicle lists
  useEffect(() => {
    setParameters(defaultParameters[activeTab] || [])
  }, [activeTab, defaultParameters])

  // Fetch vehicles from API or use provided vehicleData
  const fetchVehicles = async () => {
    setIsLoading(true)
    try {
      const vehicleLists: Record<VehicleType, VehicleEntry[]> = {
        CAMION: [],
        VOITURE: [],
        CHARIOT: []
      };
      const seenMatricules: Record<VehicleType, Set<string>> = {
        CAMION: new Set(),
        VOITURE: new Set(),
        CHARIOT: new Set()
      };
      // Use vehicleData from props if available, otherwise fetch from API
      if (vehicleData && Object.keys(vehicleData).length > 0) {
        Object.keys(vehicleData).forEach(type => {
          if (type in vehicleLists && Array.isArray(vehicleData[type])) {
            vehicleData[type].forEach(v => {
              if (!seenMatricules[type as VehicleType].has(v.matricule)) {
                vehicleLists[type as VehicleType].push({
              matricule: v.matricule,
              color: v.color || colors[Math.floor(Math.random() * colors.length)],
              type: v.type || type,
                  region: v.region || regions[0]
                });
                seenMatricules[type as VehicleType].add(v.matricule);
              }
            });
          }
        });
      } else {
        const response = await fetch(`${apiEndpoint}/config/vehicles`);
        if (!response.ok) throw new Error("Failed to fetch vehicles");
        const vehicles = await response.json();
        vehicles.forEach((vehicle: { matricule: string; type: string; region: string }, index: number) => {
                if (!vehicle || !vehicle.matricule) return;
                const type = (vehicle.type || "CAMION").toUpperCase() as VehicleType;
          if (type in vehicleLists && !seenMatricules[type].has(vehicle.matricule)) {
                  const colorIndex = index % colors.length;
                  vehicleLists[type].push({
                    matricule: vehicle.matricule,
                    color: colors[colorIndex],
                    type: type,
              region: vehicle.region || regions[0]
                  });
            seenMatricules[type].add(vehicle.matricule);
                }
              });
            }
      // Create a flat list of all available vehicles for dropdown
      // ... (no longer needed for table rendering, but keep if used elsewhere) ...
      setVehicleLists(vehicleLists)
      // Initialize table data with empty rows for each vehicle
      const initialTableData = {
        CAMION: [] as VehicleData[],
        VOITURE: [] as VehicleData[],
        CHARIOT: [] as VehicleData[]
      } as Record<VehicleType, VehicleData[]>
      (Object.keys(vehicleLists) as Array<VehicleType>).forEach((vehicleType: VehicleType) => {
        initialTableData[vehicleType] = vehicleLists[vehicleType].map((v: VehicleEntry) => ({
          type: vehicleType,
          matricule: v.matricule,
          mois: selectedMonth,
          year: selectedYear,
          region: selectedRegion,
          consommationL: 0,
          kilometrage: vehicleType !== "CHARIOT" ? 0 : undefined,
          produitsTonnes: vehicleType === "CAMION" ? 0 : undefined
        }))
      })
      setTableData(initialTableData)
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch vehicle data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch parameters from API
  const fetchParameters = async () => {
    try {
        // If API call fails, use default parameters
        setParameters(defaultParameters[activeTab] || []);
    } catch (error) {
      console.error("Error fetching parameters:", error)
      // Use default parameters on error
      setParameters(defaultParameters[activeTab] || []);
    }
  }

  const handleAddMatricule = () => {
    if (!newMatricule.trim()) {
      toast({
        title: "Erreur",
        description: "Le matricule ne peut pas être vide",
        variant: "destructive"
      })
      return
    }

    // Check if matricule already exists
    if (vehicleLists[activeTab].some(v => v.matricule === newMatricule)) {
      toast({
        title: "Erreur",
        description: "Ce matricule existe déjà. Utilisez un nouveau matricule.",
        variant: "destructive"
      })
      return
    }

    // Add new matricule
    const colorIndex = vehicleLists[activeTab].length % colors.length
    const updatedList = [
      ...vehicleLists[activeTab],
      { matricule: newMatricule, color: colors[colorIndex] }
    ]

    setVehicleLists({
      ...vehicleLists,
      [activeTab]: updatedList
    })

    // Add to table data
    const newVehicle: VehicleData = {
      type: activeTab,
      matricule: newMatricule,
      mois: selectedMonth,
      year: selectedYear,
      region: selectedRegion,
      consommationL: 0,
      kilometrage: activeTab !== "CHARIOT" ? 0 : undefined,
      produitsTonnes: activeTab === "CAMION" ? 0 : undefined
    }

    setTableData({
      ...tableData,
      [activeTab]: [...tableData[activeTab], newVehicle]
    })

    // Reset form
    setNewMatricule("")
    setIsAddingMatricule(false)

    toast({
      title: "Succès",
      description: `Matricule ${newMatricule} ajouté avec succès`,
      variant: "default"
    })
  }

  const handleAddParameter = () => {
    if (!newParameter.name.trim() || !newParameter.unit.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom et l'unité du paramètre sont requis",
        variant: "destructive"
      })
      return
    }

    // Add custom parameter
    const updatedParameters = [...parameters, newParameter]
    setParameters(updatedParameters)
    
    // Reset form
    setNewParameter({
      name: "",
      unit: "",
      type: [activeTab],
      isCustom: true,
      isRequired: false
    })
    setIsAddingParameter(false)

    toast({
      title: "Succès",
      description: `Paramètre ${newParameter.name} ajouté avec succès`,
      variant: "default"
    })
  }

  const handleInputChange = (index: number, field: string, value: string | number) => {
    setTableData(prev => {
      const newData = { ...prev };
      newData[activeTab] = [...prev[activeTab]];
      const currentRow = { ...newData[activeTab][index] };
      
      // Update the field value
      currentRow[field] = value;

    // Perform auto-calculations
      if (field === 'consommationL' && typeof value === 'number') {
      // TEP conversion (1L = 0.00098 TEP)
        currentRow.consommationTEP = value * 0.00098;
      
      // Cost calculation (1L = 2.5 DT)
        currentRow.coutDT = value * 2.5;
    }

    // Calculate IPE for CAMION and VOITURE
    if ((activeTab === 'CAMION' || activeTab === 'VOITURE') && 
        (field === 'consommationL' || field === 'kilometrage')) {
        const consommation = currentRow.consommationL || 0;
        const km = currentRow.kilometrage || 0;
      
      if (km > 0) {
          currentRow.ipeL100km = (consommation * 100) / km;
      }
    }

    // Calculate IPE per tonne.km for CAMION
    if (activeTab === 'CAMION' && 
        (field === 'consommationL' || field === 'kilometrage' || field === 'produitsTonnes')) {
        const consommation = currentRow.consommationL || 0;
        const km = currentRow.kilometrage || 0;
        const tonnes = currentRow.produitsTonnes || 0;
      
      if (km > 0 && tonnes > 0) {
          currentRow.ipeL100TonneKm = (consommation * 100) / (km * tonnes);
      }
    }

      newData[activeTab][index] = currentRow;
      return newData;
    });
  }

  const handleSaveData = async () => {
    setIsLoading(true);
    
    try {
      if (activeTab === "CHARIOT") {
        // For Chariots, save daily records
        const validationErrors = validateChariotData(tableData[activeTab]);
        if (validationErrors.length > 0) {
          throw new Error(validationErrors.join("\n"));
        }

        // Save each daily record
        for (const record of tableData[activeTab]) {
          const dailyRecord: ChariotDailyRecord = {
            matricule: record.matricule,
            date: new Date().toISOString().split('T')[0], // Today's date
            consommationL: record.consommationL,
            month: selectedMonth,
            year: selectedYear
          };

          if (record.id) {
            await updateChariotDailyRecord(record.id, dailyRecord);
          } else {
            await createChariotDailyRecord(dailyRecord);
          }
        }

        // If it's the end of the month, aggregate the data
        const today = new Date();
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        if (today.getDate() === lastDayOfMonth.getDate()) {
          for (const record of tableData[activeTab]) {
            await aggregateChariotMonthlyRecord(record.matricule, selectedMonth, selectedYear);
          }
        }

        toast({
          title: "Success",
          description: "Daily Chariot data saved successfully",
        });
      } else {
        // For other vehicles, use the existing save logic
        const validationErrors = validateTableData(tableData[activeTab]);
        if (validationErrors.length > 0) {
          throw new Error(validationErrors.join("\n"));
        }

        for (const record of tableData[activeTab]) {
          if (record.id) {
            await updateVehicleRecord(record.id, record);
          } else {
            await createVehicleRecord(record);
          }
        }

      toast({
          title: "Success",
          description: "Data saved successfully",
        });
      }
    } catch (error) {
      console.error("Error saving data:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const validateTableData = (data: VehicleData[]): string[] => {
    const errors: string[] = [];
    
    data.forEach((row, index) => {
      if (!row.matricule) {
        errors.push(`Row ${index + 1}: Matricule is required`);
      }
      
      if (row.type === "CAMION") {
        if (!row.produitsTonnes) {
          errors.push(`Row ${index + 1}: Products in tonnes is required for trucks`);
        }
      }
      
      if (row.type !== "CHARIOT") {
        if (!row.kilometrage) {
          errors.push(`Row ${index + 1}: Kilometrage is required for ${row.type.toLowerCase()}s`);
        }
      }
      
      if (!row.consommationL) {
        errors.push(`Row ${index + 1}: Fuel consumption is required`);
      }
    });
    
    return errors;
  }

  const validateChariotData = (data: VehicleData[]): string[] => {
    const errors: string[] = [];
    
    data.forEach((row, index) => {
      if (!row.matricule) {
        errors.push(`Row ${index + 1}: Matricule is required`);
      }
      
      if (!row.consommationL) {
        errors.push(`Row ${index + 1}: Fuel consumption is required`);
      }
    });
    
    return errors;
  }

  return (
    <div className="container mx-auto p-2 sm:p-4">
      {/* Main Title */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">
        Saisie Manuelle des Données
      </h1>
      {/* Only one description, outside the card */}
      <p className="mb-4 sm:mb-6 text-gray-500 text-sm sm:text-base">
        Saisissez des données manuellement pour les différents types de véhicules
      </p>

      {/* Card only for filters, table, and actions */}
      <Card className="rounded-lg shadow-md border border-gray-200 w-full">
        <CardContent className="p-4 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-end md:space-x-6 space-y-3 md:space-y-0 mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
          <Label htmlFor="month">Mois</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month" className="w-full">
              <SelectValue placeholder="Sélectionner un mois" />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
            <div className="flex-1 min-w-0">
          <Label htmlFor="year">Année</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year" className="w-full">
              <SelectValue placeholder="Sélectionner une année" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
            <div className="flex-1 min-w-0">
          <Label htmlFor="region">Région</Label>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger id="region" className="w-full">
              <SelectValue placeholder="Sélectionner une région" />
            </SelectTrigger>
            <SelectContent>
              {regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
            <div className="flex-1 flex items-end">
              <Button onClick={handleSaveData} className="w-full md:w-auto" size="default" disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" /> Enregistrer
          </Button>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as VehicleType)}>
        <TabsList className="mb-2 sm:mb-4 flex flex-row items-center gap-2 bg-blue-100 rounded-lg p-2 w-full">
          {fixedVehicleTypes.map((type) => (
            <TabsTrigger
              key={type}
              value={type}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-gray-700 font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white transition text-xs sm:text-base"
              style={{ minWidth: 120, justifyContent: 'flex-start', textAlign: 'left' }}
            >
              {type === 'CAMION' && <Truck className="h-5 w-5 opacity-60 mr-1" />}
              {type === 'VOITURE' && <Car className="h-5 w-5 opacity-60 mr-1" />}
              {type === 'CHARIOT' && <Forklift className="h-5 w-5 opacity-60 mr-1" />}
              <span className="ml-1">{type === 'CAMION' ? 'Camions' : type === 'VOITURE' ? 'Voitures' : 'Chariots'}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {fixedVehicleTypes.map((vehicleType) => (
          <TabsContent key={vehicleType} value={vehicleType}>
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <div className="bg-white overflow-hidden">
                  <div className="overflow-x-auto w-full">
                    {/* Table: use w-full min-w-[900px] for full appearance */}
                    <table className="w-full min-w-[900px] text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-blue-900 text-white">
                          <th className="px-4 py-2 text-left min-w-[80px]">Mois</th>
                          <th className="px-4 py-2 text-left min-w-[120px]">Matricule {vehicleType.toLowerCase()}</th>
                          {parameters
                            .filter(p =>
                              p.type.includes(vehicleType) &&
                              p.name !== "Consommation en TEP" &&
                              p.name !== "Coût en DT"
                            )
                            .map((param, i) => (
                              <th key={i} className="px-4 py-2 text-left min-w-[120px]">
                                {param.name}{param.isRequired ? ' *' : ''}
                              </th>
                            ))}
                          {(vehicleType === 'CAMION' || vehicleType === 'VOITURE') && (
                            <>
                              <th className="px-4 py-2 text-left min-w-[120px]">
                                Consommation en TEP
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="ml-1 p-1" onClick={() => setEditingFormula('tep')}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  {editingFormula === 'tep' && (
                                    <TooltipContent side="bottom" className="max-w-xs">
                                      <div>
                                        <div className="font-semibold mb-1">Formule:</div>
                                        <div className="mb-2 text-xs">consommationL × <b>TEP factor</b></div>
                                        <div className="mb-1">TEP factor:</div>
                                        <Input
                                          type="number"
                                          step="0.00001"
                                          value={typeof formulaConfig.tepFactor === 'number' ? formulaConfig.tepFactor.toFixed(2) : formulaConfig.tepFactor}
                                          onChange={e => setFormulaConfig({ ...formulaConfig, tepFactor: parseFloat(e.target.value) })}
                                          className="mb-2"
                                        />
                                      </div>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </th>
                              <th className="px-4 py-2 text-left min-w-[120px]">
                                Coût en DT
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="ml-1 p-1" onClick={() => setEditingFormula('cost')}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  {editingFormula === 'cost' && (
                                    <TooltipContent side="bottom" className="max-w-xs">
                                      <div>
                                        <div className="font-semibold mb-1">Formule:</div>
                                        <div className="mb-2 text-xs">consommationL × <b>Coût factor</b></div>
                                        <div className="mb-1">Coût factor (DT):</div>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={typeof formulaConfig.costFactor === 'number' ? formulaConfig.costFactor.toFixed(2) : formulaConfig.costFactor}
                                          onChange={e => setFormulaConfig({ ...formulaConfig, costFactor: parseFloat(e.target.value) })}
                                          className="mb-2"
                                        />
                                      </div>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </th>
                            </>
                          )}
                          {vehicleType === 'CAMION' && (
                            <>
                              <th className="px-4 py-2 text-left min-w-[140px]">
                                IPE (L/100km)
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="ml-1 p-1" onClick={() => setEditingFormula('ipe')}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  {editingFormula === 'ipe' && (
                                    <TooltipContent side="bottom" className="max-w-xs">
                                      <div>
                                        <div className="font-semibold mb-1">Formule:</div>
                                        <div className="mb-2 text-xs">{formulaConfig.ipeFormula}</div>
                                        <div className="mb-1">Modifier la formule:</div>
                                        <Input
                                          value={formulaConfig.ipeFormula}
                                          onChange={e => setFormulaConfig({ ...formulaConfig, ipeFormula: e.target.value })}
                                          className="mb-2"
                                        />
                                        <div className="text-xs text-gray-500">Variables: consommationL, kilometrage</div>
                                      </div>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </th>
                              <th className="px-4 py-2 text-left min-w-[170px]">
                                IPE (L/100km.Tonne)
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="ml-1 p-1" onClick={() => setEditingFormula('ipeTonne')}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  {editingFormula === 'ipeTonne' && (
                                    <TooltipContent side="bottom" className="max-w-xs">
                                      <div>
                                        <div className="font-semibold mb-1">Formule:</div>
                                        <div className="mb-2 text-xs">{formulaConfig.ipeTonneFormula}</div>
                                        <div className="mb-1">Modifier la formule:</div>
                                        <Input
                                          value={formulaConfig.ipeTonneFormula}
                                          onChange={e => setFormulaConfig({ ...formulaConfig, ipeTonneFormula: e.target.value })}
                                          className="mb-2"
                                        />
                                        <div className="text-xs text-gray-500">Variables: consommationL, kilometrage, produitsTonnes</div>
                                      </div>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </th>
                            </>
                          )}
                          {vehicleType === 'VOITURE' && (
                            <th className="px-4 py-2 text-left min-w-[140px]">
                              IPE (L/100km)
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="ml-1 p-1" onClick={() => setEditingFormula('ipe')}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                {editingFormula === 'ipe' && (
                                  <TooltipContent side="bottom" className="max-w-xs">
                                    <div>
                                      <div className="font-semibold mb-1">Formule:</div>
                                      <div className="mb-2 text-xs">{formulaConfig.ipeFormula}</div>
                                      <div className="mb-1">Modifier la formule:</div>
                                      <Input
                                        value={formulaConfig.ipeFormula}
                                        onChange={e => setFormulaConfig({ ...formulaConfig, ipeFormula: e.target.value })}
                                        className="mb-2"
                                      />
                                      <div className="text-xs text-gray-500">Variables: consommationL, kilometrage</div>
                                    </div>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </th>
                          )}
                          <th className="px-4 py-2 text-left min-w-[60px]">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setIsAddingParameter(true)}
                              className="text-white hover:bg-blue-800 p-1"
                            >
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {((vehicleType in vehicleLists) ? vehicleLists[vehicleType as VehicleType] : []).map((vehicle: VehicleEntry, index: number) => (
                          <tr 
                                  key={vehicle.matricule ? `${vehicle.matricule}-${index}` : index}
                                  style={{ backgroundColor: vehicle.color + '40' }}
                            className="hover:bg-slate-100"
                          >
                            {index === 0 ? (
                              <td className="border px-4 py-2 text-blue-900 font-semibold" rowSpan={(vehicleType in vehicleLists) ? vehicleLists[vehicleType as VehicleType].length : 0}>
                                {selectedMonth}
                              </td>
                            ) : null}
                            <td className="border px-4 py-2">
                                    {vehicle.matricule} {vehicle.type && `(${vehicle.type})`}
                            </td>
                            
                            {/* Parameter inputs */}
                            {parameters
                              .filter(p => p.type.includes(vehicleType))
                              .map((param, paramIndex) => {
                                // Map parameter name to table data field
                                let fieldName = '';
                                
                                if (param.name === "Consommation en L") fieldName = "consommationL";
                                else if (param.name === "Consommation en TEP") fieldName = "consommationTEP";
                                else if (param.name === "Coût en DT") fieldName = "coutDT";
                                else if (param.name === "Kilométrage parcouru en Km") fieldName = "kilometrage";
                                else if (param.name === "Produits transportés en Tonne") fieldName = "produitsTonnes";
                                else fieldName = param.name.toLowerCase().replace(/\s+/g, '_');
                                
                                const isReadOnly = fieldName === "consommationTEP" || fieldName === "coutDT";
                                      const value = (vehicleType in tableData && tableData[vehicleType as VehicleType][index])
                                        ? formatNumber(tableData[vehicleType as VehicleType][index][fieldName as keyof VehicleData])
                                        : '0.00';
                                
                                return (
                                  <td key={paramIndex} className="border px-4 py-2">
                                    <Input 
                                            id={`${vehicleType}-${index}-${fieldName}`}
                                            name={`${vehicleType}-${index}-${fieldName}`}
                                      type="number"
                                            value={value}
                                            onChange={(e) => {
                                              const val = e.target.value === "" ? "" : Number(e.target.value);
                                              handleInputChange(index, fieldName, val === "" ? 0 : val);
                                            }}
                                      readOnly={isReadOnly}
                                      className={isReadOnly ? "bg-gray-100" : ""}
                                      min={0}
                                    />
                                  </td>
                                );
                              })}
                            
                            {/* IPE calculations */}
                            {vehicleType === 'CAMION' && (
                              <>
                                <td className="border px-4 py-2">
                                  <Input 
                                    type="number"
                                          value={((vehicleType in tableData) && tableData[vehicleType as VehicleType][index] && tableData[vehicleType as VehicleType][index].ipeL100km !== undefined) 
                                            ? (tableData[vehicleType as VehicleType][index].ipeL100km as number).toFixed(2)
                                            : "0.00"}
                                    readOnly
                                    className="bg-gray-100"
                                  />
                                </td>
                                <td className="border px-4 py-2">
                                  <Input 
                                    type="number"
                                          value={((vehicleType in tableData) && tableData[vehicleType as VehicleType][index] && tableData[vehicleType as VehicleType][index].ipeL100TonneKm !== undefined)
                                            ? (tableData[vehicleType as VehicleType][index].ipeL100TonneKm as number).toFixed(2)
                                            : "0.00"}
                                    readOnly
                                    className="bg-gray-100"
                                  />
                                </td>
                              </>
                            )}
                            
                            {vehicleType === 'VOITURE' && (
                              <td className="border px-4 py-2">
                                <Input 
                                  type="number"
                                        value={((vehicleType in tableData) && tableData[vehicleType as VehicleType][index] && tableData[vehicleType as VehicleType][index].ipeL100km !== undefined)
                                          ? (tableData[vehicleType as VehicleType][index].ipeL100km as number).toFixed(2)
                                          : "0.00"}
                                  readOnly
                                  className="bg-gray-100"
                                />
                              </td>
                            )}
                            
                            <td className="border px-4 py-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="hover:bg-red-100 text-red-500 p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        
                        {/* Add new matricule row */}
                        {isAddingMatricule && (
                          <tr className="bg-slate-50">
                            {((vehicleType in vehicleLists) && vehicleLists[vehicleType as VehicleType].length === 0) ? (
                              <td className="border px-4 py-2">{selectedMonth}</td>
                            ) : null}
                            <td className="border px-4 py-2">
                              <Input
                                placeholder="Nouveau matricule"
                                value={newMatricule}
                                onChange={(e) => setNewMatricule(e.target.value)}
                              />
                            </td>
                            {parameters
                              .filter(p => p.type.includes(vehicleType))
                              .map((_, i) => (
                                <td key={i} className="border px-4 py-2"></td>
                              ))}
                            {vehicleType === 'CAMION' && (
                              <>
                                <td className="border px-4 py-2"></td>
                                <td className="border px-4 py-2"></td>
                              </>
                            )}
                            {vehicleType === 'VOITURE' && (
                              <td className="border px-4 py-2"></td>
                            )}
                            <td className="border px-4 py-2">
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleAddMatricule}>
                                  Ajouter
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setIsAddingMatricule(false)}>
                                  Annuler
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )}
                        
                        {/* Total Mensuel row */}
                        <tr className="bg-amber-800 text-white font-semibold">
                          <td className="border px-4 py-2 text-center" colSpan={2}>
                            Total Mensuel
                          </td>
                          {parameters
                            .filter(p => p.type.includes(vehicleType))
                            .map((param, i) => {
                              // Calculate total for each parameter
                              let fieldName = '';
                              if (param.name === "Consommation en L") fieldName = "consommationL";
                              else if (param.name === "Consommation en TEP") fieldName = "consommationTEP";
                              else if (param.name === "Coût en DT") fieldName = "coutDT";
                              else if (param.name === "Kilométrage parcouru en Km") fieldName = "kilometrage";
                              else if (param.name === "Produits transportés en Tonne") fieldName = "produitsTonnes";
                              else fieldName = param.name.toLowerCase().replace(/\s+/g, '_');
                              
                              const total = ((vehicleType in tableData) ? 
                              tableData[vehicleType as VehicleType]
                                      .reduce((sum: number, vehicle: VehicleData) => {
                                        const value = vehicle[fieldName as keyof VehicleData];
                                        return sum + (typeof value === 'number' ? value : 0);
                                      }, 0)
                                .toFixed(2) : 
                              "0.00");
                                
                              return (
                                <td key={i} className="border px-4 py-2 text-right">
                                  {total}
                                </td>
                              );
                            })}
                          {vehicleType === 'CAMION' && (
                            <>
                              <td className="border px-4 py-2"></td>
                              <td className="border px-4 py-2"></td>
                            </>
                          )}
                          {vehicleType === 'VOITURE' && (
                            <td className="border px-4 py-2"></td>
                          )}
                          <td className="border px-4 py-2"></td>
                        </tr>
                        
                        {/* Add Matricule button row */}
                        <tr>
                          <td 
                            colSpan={
                              2 + 
                              parameters.filter(p => p.type.includes(vehicleType)).length + 
                              (vehicleType === 'CAMION' ? 2 : vehicleType === 'VOITURE' ? 1 : 0) + 
                              1
                            } 
                            className="px-4 py-2 text-center"
                          >
                            <Button 
                              variant="outline" 
                              onClick={() => setIsAddingMatricule(true)}
                              disabled={isAddingMatricule}
                            >
                              <PlusCircle className="w-4 h-4 mr-2" />
                              Ajouter une matricule
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
        </CardContent>
      </Card>

      {/* New Parameter Modal */}
      {isAddingParameter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Ajouter un paramètre</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="param-name">Nom du paramètre</Label>
                  <Input 
                    id="param-name" 
                    value={newParameter.name}
                    onChange={(e) => setNewParameter({...newParameter, name: e.target.value})}
                    placeholder="ex: Heures de fonctionnement"
                  />
                </div>
                
                <div>
                  <Label htmlFor="param-unit">Unité</Label>
                  <Input 
                    id="param-unit" 
                    value={newParameter.unit}
                    onChange={(e) => setNewParameter({...newParameter, unit: e.target.value})}
                    placeholder="ex: h"
                  />
                </div>
                
                <div>
                  <Label>Type de véhicule</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {vehicleTypes.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`type-${type}`}
                          checked={newParameter.type.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewParameter({
                                ...newParameter,
                                type: [...newParameter.type, type]
                              })
                            } else {
                              setNewParameter({
                                ...newParameter,
                                type: newParameter.type.filter(t => t !== type)
                              })
                            }
                          }}
                          className="form-checkbox h-5 w-5 text-primary"
                        />
                        <Label htmlFor={`type-${type}`}>{type}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddingParameter(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddParameter}>
                    Ajouter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
