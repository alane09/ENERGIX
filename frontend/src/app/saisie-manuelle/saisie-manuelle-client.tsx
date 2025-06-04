"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { PlusCircle, Save, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

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

interface Vehicle {
  matricule: string;
  type: string;
  region: string;
  color: string;
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
  [key: string]: any;
}

interface Parameter {
  name: string;
  unit: string;
  type: string[];
  isCustom: boolean;
  isRequired: boolean;
}

export function SaisieManuelleClient({ vehicleTypes, regions, apiEndpoint, vehicleData }: SaisieManuelleClientProps) {
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState<VehicleType>("CAMION")
  const [vehicleLists, setVehicleLists] = useState<Record<VehicleType, VehicleEntry[]>>({
    CAMION: [],
    VOITURE: [],
    CHARIOT: []
  })
  const [allAvailableVehicles, setAllAvailableVehicles] = useState<VehicleEntry[]>([])
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
    // Use these variables to avoid dependency array issues
    const currentApiEndpoint = apiEndpoint;
    const currentRegions = regions;
    try {
      let vehicleLists: Record<VehicleType, VehicleEntry[]>;
      
      // Initialize empty vehicle lists
      vehicleLists = {
        CAMION: [],
        VOITURE: [],
        CHARIOT: []
      } as Record<VehicleType, VehicleEntry[]>;
      
      // Use vehicleData from props if available, otherwise fetch from API
      if (vehicleData && Object.keys(vehicleData).length > 0) {
        // Use directly provided vehicle data (typically from server-side)
        Object.keys(vehicleData).forEach(type => {
          if (type in vehicleLists && Array.isArray(vehicleData[type])) {
            vehicleLists[type as VehicleType] = vehicleData[type].map(v => ({
              matricule: v.matricule,
              color: v.color || colors[Math.floor(Math.random() * colors.length)],
              type: v.type || type,
              region: v.region || currentRegions[0]
            }));
          }
        });
        
        console.log("Using provided vehicle data:", vehicleLists);
      } else {
        // Fetch real vehicle matricules from API
        console.log("Fetching vehicles from API...");
        try {
          const response = await fetch(`${currentApiEndpoint}/vehicles/matricules`, {
            cache: "no-store"
          });
          
          if (response.ok) {
            const fetchedVehicles = await response.json();
            console.log("Fetched vehicles from API route:", fetchedVehicles);
            
            if (Array.isArray(fetchedVehicles) && fetchedVehicles.length > 0) {
              fetchedVehicles.forEach((vehicle: any, index: number) => {
                if (!vehicle || !vehicle.matricule) return;
                
                const type = (vehicle.type || "CAMION").toUpperCase() as VehicleType;
                
                if (type in vehicleLists) {
                  const colorIndex = index % colors.length;
                  
                  vehicleLists[type].push({
                    matricule: vehicle.matricule,
                    color: colors[colorIndex],
                    type: type,
                    region: vehicle.region || currentRegions[0]
                  });
                }
              });
            }
          } else {
            console.warn(`API responded with status: ${response.status}`);
            console.log("No vehicle data available, starting with empty lists for manual input");
          }
        } catch (error) {
          console.error("Error fetching vehicles:", error);
          console.log("Starting with empty vehicle lists for manual input");
        }
      }
      
      // Create a flat list of all available vehicles for dropdown
      const allVehicles: VehicleEntry[] = [];
      Object.values(vehicleLists).forEach(typeList => {
        allVehicles.push(...typeList);
      });
      
      setVehicleLists(vehicleLists)
      setAllAvailableVehicles(allVehicles)
      
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
      console.error("Error fetching vehicles:", error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer la liste des véhicules",
        variant: "destructive"
      })
    }
  }

  // Fetch parameters from API
  const fetchParameters = async () => {
    try {
      const response = await fetch(`${apiEndpoint}/parameters`);
      if (!response.ok) {
        // If API call fails, use default parameters
        setParameters(defaultParameters[activeTab] || []);
        return;
      }
      
      const data = await response.json();
      
      // Merge API parameters with default ones
      if (Array.isArray(data) && data.length > 0) {
        const mergedParams = [
          ...(defaultParameters[activeTab] || []),
          ...data.filter((p: Parameter) => 
            p.type.includes(activeTab) && 
            !defaultParameters[activeTab]?.some(dp => dp.name === p.name)
          )
        ];
        setParameters(mergedParams);
      } else {
        setParameters(defaultParameters[activeTab] || []);
      }
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

  const handleInputChange = (index: number, field: string, value: any) => {
    const updatedData = [...tableData[activeTab]]
    updatedData[index][field] = value

    // Perform auto-calculations
    if (field === 'consommationL') {
      // TEP conversion (1L = 0.00098 TEP)
      updatedData[index].consommationTEP = value * 0.00098
      
      // Cost calculation (1L = 2.5 DT)
      updatedData[index].coutDT = value * 2.5
    }

    // Calculate IPE for CAMION and VOITURE
    if ((activeTab === 'CAMION' || activeTab === 'VOITURE') && 
        (field === 'consommationL' || field === 'kilometrage')) {
      const consommation = updatedData[index].consommationL || 0
      const km = updatedData[index].kilometrage || 0
      
      if (km > 0) {
        updatedData[index].ipeL100km = (consommation * 100) / km
      }
    }

    // Calculate IPE per tonne.km for CAMION
    if (activeTab === 'CAMION' && 
        (field === 'consommationL' || field === 'kilometrage' || field === 'produitsTonnes')) {
      const consommation = updatedData[index].consommationL || 0
      const km = updatedData[index].kilometrage || 0
      const tonnes = updatedData[index].produitsTonnes || 0
      
      if (km > 0 && tonnes > 0) {
        updatedData[index].ipeL100TonneKm = (consommation * 100) / (km * tonnes)
      }
    }

    setTableData({
      ...tableData,
      [activeTab]: updatedData
    })
  }

  const handleSaveData = async () => {
    try {
      // Validation
      const hasErrors = tableData[activeTab].some(vehicle => {
        // Check required fields based on vehicle type
        if (vehicle.consommationL <= 0) return true
        
        if ((activeTab === 'CAMION' || activeTab === 'VOITURE') && 
            (vehicle.kilometrage === undefined || vehicle.kilometrage <= 0)) {
          return true
        }
        
        if (activeTab === 'CAMION' && 
            (vehicle.produitsTonnes === undefined || vehicle.produitsTonnes <= 0)) {
          return true
        }
        
        return false
      })
      
      if (hasErrors) {
        toast({
          title: "Erreur de validation",
          description: "Veuillez remplir tous les champs obligatoires correctement",
          variant: "destructive"
        })
        return
      }

      // Call the API to save data
      const response = await fetch(`${apiEndpoint}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tableData[activeTab])
      })
      
      if (!response.ok) {
        throw new Error(`Failed to save data: ${response.status}`)
      }
      
      const result = await response.json()

      toast({
        title: "Données enregistrées",
        description: `Les données de ${tableData[activeTab].length} véhicules ont été enregistrées avec succès`,
        variant: "default"
      })
    } catch (error) {
      console.error("Error saving data:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les données",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="month">Mois</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger id="month">
              <SelectValue placeholder="Sélectionner un mois" />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="year">Année</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger id="year">
              <SelectValue placeholder="Sélectionner une année" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="region">Région</Label>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger id="region">
              <SelectValue placeholder="Sélectionner une région" />
            </SelectTrigger>
            <SelectContent>
              {regions.map(region => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button onClick={handleSaveData} className="w-full">
            <Save className="w-4 h-4 mr-2" /> Enregistrer
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as VehicleType)}>
        <TabsList className="mb-4">
          {vehicleTypes.map((type) => (
            <TabsTrigger key={type} value={type}>
              {type === 'CAMION' ? 'Camions' : type === 'VOITURE' ? 'Voitures' : 'Chariots'}
            </TabsTrigger>
          ))}
        </TabsList>

        {vehicleTypes.map((vehicleType) => (
          <TabsContent key={vehicleType} value={vehicleType}>
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <div className="bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-blue-900 text-white">
                          <th className="px-4 py-2 text-left">Mois</th>
                          <th className="px-4 py-2 text-left">Matricule {vehicleType.toLowerCase()}</th>
                          {parameters
                            .filter(p => p.type.includes(vehicleType))
                            .map((param, i) => (
                              <th key={i} className="px-4 py-2 text-left">
                                {param.name}{param.isRequired ? ' *' : ''}
                              </th>
                            ))}
                          {vehicleType === 'CAMION' && (
                            <>
                              <th className="px-4 py-2 text-left">IPE (L/100km)</th>
                              <th className="px-4 py-2 text-left">IPE (L/100km.Tonne)</th>
                            </>
                          )}
                          {vehicleType === 'VOITURE' && (
                            <th className="px-4 py-2 text-left">IPE (L/100km)</th>
                          )}
                          <th className="px-4 py-2 text-left">
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
                            key={vehicle.matricule} 
                            style={{ backgroundColor: vehicle.color + '40' }} // Adding transparency
                            className="hover:bg-slate-100"
                          >
                            {index === 0 ? (
                              <td className="border px-4 py-2 text-blue-900 font-semibold" rowSpan={(vehicleType in vehicleLists) ? vehicleLists[vehicleType as VehicleType].length : 0}>
                                {selectedMonth}
                              </td>
                            ) : null}
                            <td className="border px-4 py-2">
                              <Select 
                                value={vehicle.matricule}
                                onValueChange={(value) => {
                                  // Find the selected vehicle from all available vehicles
                                  const selectedVehicle = allAvailableVehicles.find(v => v.matricule === value);
                                  if (!selectedVehicle) return;

                                  // Update the vehicle list
                                  const updatedList = [...vehicleLists[activeTab]];
                                  updatedList[index] = {
                                    ...selectedVehicle,
                                    type: vehicleType // Ensure the vehicle type matches the current tab
                                  };
                                  setVehicleLists({
                                    ...vehicleLists,
                                    [activeTab]: updatedList
                                  });

                                  // Update the table data
                                  const updatedTableData = [...tableData[activeTab]];
                                  updatedTableData[index] = {
                                    ...updatedTableData[index],
                                    matricule: value,
                                    type: vehicleType
                                  };
                                  setTableData({
                                    ...tableData,
                                    [activeTab]: updatedTableData
                                  });
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Sélectionner un matricule" />
                                </SelectTrigger>
                                <SelectContent>
                                  {allAvailableVehicles
                                    .filter(v => v.type === vehicleType || !v.type)
                                    .map((v: VehicleEntry) => (
                                      <SelectItem 
                                        key={v.matricule} 
                                        value={v.matricule}
                                        style={{ backgroundColor: v.color + '40' }}
                                      >
                                        {v.matricule} {v.type && `(${v.type})`}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
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
                                
                                return (
                                  <td key={paramIndex} className="border px-4 py-2">
                                    <Input 
                                      type="number"
                                      value={((vehicleType in tableData) && tableData[vehicleType as VehicleType][index]?.[fieldName]) || 0}
                                      onChange={(e) => handleInputChange(index, fieldName, Number(e.target.value))}
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
                                    value={((vehicleType in tableData) && tableData[vehicleType as VehicleType][index]?.ipeL100km?.toFixed(2)) || 0}
                                    readOnly
                                    className="bg-gray-100"
                                  />
                                </td>
                                <td className="border px-4 py-2">
                                  <Input 
                                    type="number"
                                    value={((vehicleType in tableData) && tableData[vehicleType as VehicleType][index]?.ipeL100TonneKm?.toFixed(5)) || 0}
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
                                  value={((vehicleType in tableData) && tableData[vehicleType as VehicleType][index]?.ipeL100km?.toFixed(2)) || 0}
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
                                .reduce((sum: number, vehicle: VehicleData) => sum + (vehicle[fieldName] || 0), 0)
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
