/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API } from "@/lib/api";
import type { VehicleRecord } from "@/types/dashboard";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

// Custom Dashboard Components
import ChartContainer from "@/components/dashboard/chart-container";
import DashboardFilter from "@/components/dashboard/dashboard-filter";
import DashboardTabContent from "@/components/dashboard/dashboard-tab-content";

// Icons
import {
  AlertCircle,
  AlertTriangle,
  Car,
  Droplet,
  FileBarChart,
  Forklift,
  Fuel,
  Gauge,
  LineChart,
  Loader2,
  MapPin,
  Package,
  Truck
} from "lucide-react";

// Hooks and Utilities
import { useVehicleType } from '@/hooks/use-vehicle-type';
import { toast } from 'sonner';

// Chart Types
interface ChartData {
  title: string;
  type: 'pie' | 'bar' | 'line' | 'histogram';
  dataKey: string;
  height?: number;
  color?: string;
}

interface ChartSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  charts: ChartData[];
}

// Data Types
interface MonthlyData {
  month: string;
  consommation: number;
  kilometrage: number;
  ipe: number;
  produitsTonnes?: number;
  ipeTonne?: number;
  ipeL100TonneKm?: number;
  count?: number;
}

interface VehicleTypeBreakdown {
  name: string;
  value: number;
}

interface DashboardData {
  totalVehicles: number;
  totalConsommation: number;
  avgIPE: number;
  totalKilometrage: number;
  monthlyData: MonthlyData[];
  vehicleTypeBreakdown: VehicleTypeBreakdown[];
}

interface ExtendedVehicleRecord extends VehicleRecord {
  matricule: string;
  consommation: number;
  kilometrage: number;
  ipe: number;
  month: string;
}

// Vehicle type options
const vehicleTypeOptions = [
  { id: 'all', name: 'Tous', icon: Truck, noDataMessage: 'Aucune donnée disponible' },
  { id: 'VOITURE', name: 'Voitures', icon: Car, noDataMessage: 'Aucune donnée disponible pour les voitures' },
  { id: 'CAMION', name: 'Camions', icon: Truck, noDataMessage: 'Aucune donnée disponible pour les camions' },
  { id: 'CHARIOT', name: 'Chariots', icon: Forklift, noDataMessage: 'Aucune donnée disponible pour les chariots' }
];

// Dashboard sections configuration
const dashboardSections: ChartSection[] = [
  {
    id: 'consumption-cost',
    title: 'Consommation & Coût',
    icon: <Fuel className="h-4 w-4" />,
    charts: [
      { type: 'pie', title: 'Part du camion / Consommation totale du carburant', dataKey: 'consommation' },
      { type: 'bar', title: 'Répartition de la consommation du carburant / Camion (en litres)', dataKey: 'consommation' },
      { type: 'pie', title: 'Part du camion / Coût total', dataKey: 'cost' },
      { type: 'line', title: 'Évolution mensuelle du coût total de la consommation (en DT)', dataKey: 'consommation' }
    ]
  },
  {
    id: 'mileage',
    title: 'Kilométrage',
    icon: <MapPin className="h-4 w-4" />,
    charts: [
      { type: 'line', title: 'Évolution mensuelle du kilométrage total parcouru des camions', dataKey: 'kilometrage' },
      { type: 'pie', title: 'Part du camion / Kilométrage total parcouru', dataKey: 'kilometrage' }
    ]
  },
  {
    id: 'products',
    title: 'Produits Transportés',
    icon: <Package className="h-4 w-4" />,
    charts: [
      { type: 'pie', title: 'Part du camion / Quantité totale de produits finis transportés', dataKey: 'produitsTonnes' },
      { type: 'bar', title: 'Répartition de la quantité de produits finis transportés / Camion (en Kg)', dataKey: 'produitsTonnes', color: '#8b5cf6' }
    ]
  },
  {
    id: 'ipe',
    title: 'IPE',
    icon: <LineChart className="h-4 w-4" />,
    charts: [
      { type: 'line', title: 'IPE (L/100km) - Global', dataKey: 'ipe' },
      { type: 'line', title: 'IPE (L/100km.Tonne) - Global', dataKey: 'ipeTonne' },
      { type: 'line', title: 'IPE (L/100km) par véhicule (par mois)', dataKey: 'ipe' },
      { type: 'line', title: 'IPE (L/100km.Tonne) par véhicule (par mois)', dataKey: 'ipeTonne' }
    ]
  },
  {
    id: 'reports',
    title: 'Rapports',
    icon: <FileBarChart className="h-4 w-4" />,
    charts: []
  }
];

// Dynamic imports with SSR disabled
const IPELineChart = dynamic(() => import("@/components/charts/ipe-line-chart"), { ssr: false });
const DashboardCard = dynamic(() => import("@/components/dashboard/dashboard-card"), { ssr: false });
const ConsumptionPieChart = dynamic(() => import("@/components/charts/consumption-pie-chart"), { ssr: false });
const ConsumptionBarChart = dynamic(() => import("@/components/charts/consumption-bar-chart"), { ssr: false });
const ConsumptionLineChart = dynamic(() => import("@/components/charts/consumption-line-chart"), { ssr: false });

const processRecordsForDashboard = (records: ExtendedVehicleRecord[]): DashboardData | null => {
  if (!records || records.length === 0) return null;

  try {
    // Extract monthly data
    const monthsMap: Record<string, MonthlyData> = {};
    const vehicleTypeCount: Record<string, number> = {};
    
    let totalConsommation = 0;
    let totalKilometrage = 0;
    const totalVehicles = new Set<string>();
    
    // Process each record - fetch all data regardless of vehicle type
    records.forEach(record => {
      const month = record.mois || record.month || 'Unknown';
      const consommation = record.consommation || record.consommationL || 0;
      const kilometrage = record.kilometrage || record.distance || 0;
      const vehicleType = record.type || record.vehicleType || 'Unknown';
      const matricule = record.matricule || 'Unknown';
      
      // Add all data for all vehicle types to ensure complete data fetching
      totalConsommation += consommation;
      totalKilometrage += kilometrage;
      totalVehicles.add(matricule);
      
      // Count vehicle types
      vehicleTypeCount[vehicleType] = (vehicleTypeCount[vehicleType] || 0) + 1;
      
      // Aggregate monthly data - collect all data regardless of vehicle type
      if (!monthsMap[month]) {
        monthsMap[month] = {
          month,
          consommation: 0,
          kilometrage: 0,
          ipe: 0,
          count: 0
        };
      }
      
      // Add all data for all vehicle types
      monthsMap[month].consommation += consommation;
      monthsMap[month].kilometrage += kilometrage;
      monthsMap[month].count = (monthsMap[month].count || 0) + 1;
    });
    
    // Calculate averages and finalize monthly data
    const monthlyData = Object.values(monthsMap).map(data => {
      data.ipe = data.kilometrage > 0 ? (data.consommation / data.kilometrage) * 100 : 0;
      return data;
    });
    
    // Sort months chronologically
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    monthlyData.sort((a, b) => {
      const monthA = a.month;
      const monthB = b.month;
      return months.indexOf(monthA) - months.indexOf(monthB);
    });
    
    // Calculate average IPE
    const avgIPE = totalKilometrage > 0 ? (totalConsommation / totalKilometrage) * 100 : 0;
    
    // Format vehicle type breakdown
    const vehicleTypeBreakdown = Object.entries(vehicleTypeCount).map(([name, value]) => ({
      name,
      value
    }));
    
    return {
      totalVehicles: totalVehicles.size,
      totalConsommation,
      totalKilometrage,
      avgIPE,
      monthlyData,
      vehicleTypeBreakdown
    };
  } catch (error) {
    console.error("Error processing records:", error);
    return null;
  }
};

// Dashboard client component
export default function DashboardClient() {
  // State
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("consumption-cost");
  const [chartHeight] = useState<number>(250);

  // Vehicle type hook
  const { types: vehicleTypes } = useVehicleType();

  // Determine if we're viewing Chariots data
  const isChariotView = selectedType.toLowerCase() === 'chariot';

  // Filter dashboard sections based on vehicle type
  const filteredDashboardSections = dashboardSections.map(section => {
    // For Chariots, only show consumption charts
    if (isChariotView) {
      if (section.id === 'consumption-cost') {
        return {
          ...section,
          charts: section.charts.filter(chart => 
            chart.title.toLowerCase().includes('consommation') && !chart.title.toLowerCase().includes('coût')
          )
        };
      } else if (section.id === 'reports') {
        return section; // Keep reports section as is
      } else {
        return {
          ...section,
          charts: [] // Remove all charts from other sections for Chariots
        };
      }
    }
    return section; // Return original section for non-Chariot views
  });

  // Data fetching function
  const fetchData = useCallback(async () => {
    if (!isMounted) {
      console.log('Not fetching data: component not mounted');
      return;
    }

    console.log('Fetching dashboard data...', { selectedType, selectedYear });
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all records with optional filters
      console.log('Fetching records with filters:', { 
        type: selectedType !== 'all' ? selectedType : undefined, 
        year: selectedYear !== 'all' ? selectedYear : undefined 
      });
      
      const records: VehicleRecord[] = await API.Vehicle.getRecords({
        type: selectedType !== 'all' ? selectedType : undefined,
        year: selectedYear !== 'all' ? selectedYear : undefined
      });
      
      console.log('Records fetched:', records.length, 'First few records:', records.slice(0, 3));
      
      if (records && records.length > 0) {
        // Process records to calculate dashboard metrics
        const totalVehicles = new Set(records.map((r: VehicleRecord) => r.matricule)).size;
        const totalConsommation = records.reduce((sum: number, r: VehicleRecord) => sum + (r.consommationL || 0), 0);
        const totalKilometrage = records.reduce((sum: number, r: VehicleRecord) => sum + (r.kilometrage || 0), 0);
        const avgIPE = records.length > 0 
          ? records.reduce((sum: number, r: VehicleRecord) => sum + (r.ipeL100km || 0), 0) / records.length 
          : 0;
        
        console.log('Raw records sample:', records.slice(0, 3));
        
        // Group by month for monthly data
        const monthlyDataMap = records.reduce((acc: Record<string, any>, record: VehicleRecord) => {
          if (!acc[record.mois]) {
            acc[record.mois] = {
              month: record.mois,
              consommation: 0,
              kilometrage: 0,
              ipe: 0,
              count: 0
            };
          }
          acc[record.mois].consommation += record.consommationL || 0;
          acc[record.mois].kilometrage += record.kilometrage || 0;
          acc[record.mois].ipe += record.ipeL100km || 0;
          acc[record.mois].count += 1;
          return acc;
        }, {} as Record<string, any>);
        
        // Calculate averages for IPE
        const monthlyData = Object.values(monthlyDataMap).map((month: any) => ({
          ...month,
          ipe: month.count > 0 ? month.ipe / month.count : 0
        }));
        
        // Debug the monthly data
        console.log('Monthly data processed:', monthlyData);
        
        // Group by vehicle type for breakdown
        const typeBreakdown = records.reduce((acc: Record<string, number>, record: VehicleRecord) => {
          // Get the type from the record, normalize it to uppercase for consistency
          const type = (record.type || 'Inconnu').toUpperCase();
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        // Debug the breakdown directly
        console.log('Vehicle type breakdown raw:', typeBreakdown);
        
        const vehicleTypeBreakdown = Object.entries(typeBreakdown).map(([name, value]) => {
          // Transform the data for chart consumption
          return {
            name,
            value: Number(value) || 0
          };
        });
        
        // Debug the processed breakdown
        console.log('Transformed vehicle type breakdown:', vehicleTypeBreakdown);
        
        const transformedData: DashboardData = {
          totalVehicles,
          totalConsommation,
          avgIPE,
          totalKilometrage,
          monthlyData,
          vehicleTypeBreakdown
        };
        
        // Create sample vehicle breakdown data for testing if none exists
        if (!transformedData.vehicleTypeBreakdown || transformedData.vehicleTypeBreakdown.length === 0) {
          console.log('No vehicle type breakdown data, creating sample data for testing');
          transformedData.vehicleTypeBreakdown = [
            { name: 'VOITURE', value: 30 },
            { name: 'CAMION', value: 50 },
            { name: 'CHARIOT', value: 20 }
          ];
        }
        
        // Create sample monthly data if none exists
        if (!transformedData.monthlyData || transformedData.monthlyData.length === 0) {
          console.log('No monthly data, creating sample data for testing');
          transformedData.monthlyData = [
            { month: 'Jan', consommation: 1200, kilometrage: 5000, ipe: 24 },
            { month: 'Feb', consommation: 1500, kilometrage: 6000, ipe: 25 },
            { month: 'Mar', consommation: 1300, kilometrage: 5500, ipe: 23.6 }
          ];
        }
        
        console.log('Processed dashboard data:', transformedData);
        // Debug log the data being set
        console.log('Setting dashboard data:', {
          monthlyData: transformedData.monthlyData,
          vehicleTypeBreakdown: transformedData.vehicleTypeBreakdown,
          totalVehicles: transformedData.totalVehicles,
          totalConsommation: transformedData.totalConsommation,
          totalKilometrage: transformedData.totalKilometrage,
          avgIPE: transformedData.avgIPE
        });
        
        // Ensure we have valid data for the charts
        const validData = {
          ...transformedData,
          // Make sure monthlyData is an array with properly formatted data
          monthlyData: Array.isArray(transformedData.monthlyData) ? transformedData.monthlyData.map(m => ({
            ...m,
            month: m.month || 'Unknown',
            consommation: typeof m.consommation === 'number' ? m.consommation : 0,
            kilometrage: typeof m.kilometrage === 'number' ? m.kilometrage : 0,
            ipe: typeof m.ipe === 'number' ? m.ipe : 0
          })) : [],
          // Make sure vehicleTypeBreakdown is an array with properly formatted data
          vehicleTypeBreakdown: Array.isArray(transformedData.vehicleTypeBreakdown) ? 
            transformedData.vehicleTypeBreakdown.map(v => ({
              name: v.name || 'Unknown',
              value: typeof v.value === 'number' ? v.value : 0
            })) : []
        };
        
        setDashboardData(validData);
        setError(null);
      } else {
        console.warn('No records returned from API');
        setError('Aucune donnée disponible');
        setDashboardData(null);
      }
    } catch (err: any) {
      console.error('Error in fetchData:', {
        message: err.message,
        stack: err.stack,
        response: err.response
      });
      setError('Erreur lors de la récupération des données');
      setDashboardData(null);
      toast.error(`Erreur: ${err.message || 'Impossible de charger les données'}`);
    } finally {
      console.log('Finished loading data');
      setIsLoading(false);
    }
  }, [isMounted, selectedYear, selectedType]);

  // Fetch data on component mount and when filters change
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (isMounted) {
      fetchData();
    }
  }, [isMounted, selectedYear, selectedType, fetchData]);

  // Get vehicle type details by ID
  const getVehicleTypeById = (id: string) => {
    return vehicleTypeOptions.find((type: { id: string }) => type.id === id) || vehicleTypeOptions[0];
  };

  // Method to show no data message based on selected vehicle type
  const renderNoDataMessage = () => {
    const vehicleType = getVehicleTypeById(selectedType);
    return vehicleType.noDataMessage;
  };

  if (!isMounted) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error && !dashboardData) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
        <div className="flex items-center justify-center rounded-full bg-destructive/10 p-3">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          Réessayer
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => {
            setSelectedYear("all");
            setSelectedType("all");
            setError(null);
            toast.info('Tentative de récupération des données avec les paramètres par défaut');
          }}
        >
          Réessayer avec les paramètres par défaut
        </Button>
      </div>
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
        <div className="flex items-center justify-center rounded-full bg-warning/10 p-3">
          <AlertTriangle className="h-6 w-6 text-warning" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">Aucune donnée</h3>
          <p className="text-muted-foreground">
            Aucune donnée disponible pour les filtres sélectionnés
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedYear}
            onValueChange={setSelectedYear}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les années</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={selectedType}
            onValueChange={setSelectedType}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Type de véhicule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {vehicleTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={fetchData} variant="outline">
          Rafraîchir
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => {
            setSelectedYear("all");
            setSelectedType("all");
            setError(null);
            toast.info('Tentative de récupération des données avec les paramètres par défaut');
          }}
        >
          Réessayer avec les paramètres par défaut
        </Button>
      </div>
    );
  }

  // Main dashboard content when data is available
  return (
    <div className="space-y-4">
      {/* Enhanced Dashboard Filter Component */}
      <DashboardFilter
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        vehicleTypeOptions={vehicleTypeOptions}
        isLoading={isLoading}
        onRefresh={fetchData}
        onReset={() => {
          setSelectedYear("all");
          setSelectedType("all");
          setError(null);
          toast.info('Réinitialisation des filtres');
        }}
        className="mb-4"
      />

      {/* Overview cards row - improved responsive layout */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Véhicules"
          value={dashboardData.totalVehicles.toString()}
          icon={<Truck className="h-4 w-4 text-muted-foreground" />}
          description={`Total des véhicules ${selectedType !== 'all' ? getVehicleTypeById(selectedType).name.toLowerCase() : ''}`}
        />
        <DashboardCard
          title="Consommation"
          value={`${(dashboardData.totalConsommation / 1000).toFixed(1)}K L`}
          icon={<Droplet className="h-4 w-4 text-muted-foreground" />}
          description="Total de carburant consommé"
        />
        <DashboardCard
          title="Distance"
          value={`${(dashboardData.totalKilometrage / 1000).toFixed(1)}K km`}
          icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
          description="Total de distance parcourue"
        />
        <DashboardCard
          title="IPE Moyen"
          value={`${dashboardData.avgIPE.toFixed(1)} L/100km`}
          icon={<Gauge className="h-4 w-4 text-muted-foreground" />}
          description="Indice de performance énergétique"
          trend={dashboardData.avgIPE < 40 ? "down" : "up"}
          trendValue={dashboardData.avgIPE < 40 ? "Bon" : "Élevé"}
        />
      </div>

      {/* Tabs section - enhanced responsive behavior */}
      <Tabs defaultValue="consumption-cost" className="space-y-4" onValueChange={setActiveTab} value={activeTab}>
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-5 gap-2">
            {dashboardSections.map((section) => (
              <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2 whitespace-nowrap">
                {section.icon}
                <span className="hidden sm:inline">{section.title}</span>
                <span className="sm:hidden">{section.icon ? null : section.title.charAt(0)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        {/* Consommation & Coût tab */}
        <TabsContent value="consumption-cost" className="space-y-4">
          <DashboardTabContent 
            title="Consommation & Coût" 
            showContent={true}
            noDataMessage={renderNoDataMessage()}
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {dashboardSections[0].charts.map((chart, index) => (
                <ChartContainer 
                  key={index}
                  title={chart.title}
                  isEmpty={!dashboardData || !dashboardData.vehicleTypeBreakdown || dashboardData.vehicleTypeBreakdown.length === 0}
                  className="h-[500px] min-h-[500px] w-full"
                >
                  {chart.type === 'pie' && (
                    <ConsumptionPieChart 
                      data={dashboardData.vehicleTypeBreakdown || []}
                      title={chart.title}
                    />
                  )}
                  {chart.type === 'bar' && (
                    <ConsumptionBarChart 
                      data={dashboardData.monthlyData || []}
                      dataKey={chart.dataKey}
                      title={chart.title}
                    />
                  )}
                  {chart.type === 'line' && (
                    <ConsumptionLineChart 
                      data={dashboardData.monthlyData || []}
                      dataKey={chart.dataKey}
                      title={chart.title}
                    />
                  )}
                </ChartContainer>
              ))}
            </div>
          </DashboardTabContent>
        </TabsContent>
        
        {/* Kilométrage tab */}
        <TabsContent value="mileage" className="space-y-4">
          <DashboardTabContent 
            title="Kilométrage" 
            showContent={true}
            noDataMessage={renderNoDataMessage()}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {dashboardSections[1].charts.map((chart, index) => (
                <ChartContainer 
                  key={index}
                  title={chart.title}
                  isEmpty={!dashboardData || !dashboardData.monthlyData || dashboardData.monthlyData.length === 0}
                  className="h-[500px] min-h-[500px] w-full"
                >
                  {chart.type === 'line' && (
                    <ConsumptionLineChart 
                      data={dashboardData.monthlyData || []}
                      dataKey={chart.dataKey}
                      title={chart.title}
                    />
                  )}
                  {chart.type === 'pie' && (
                    <ConsumptionPieChart 
                      data={dashboardData.vehicleTypeBreakdown || []}
                      title={chart.title}
                    />
                  )}
                </ChartContainer>
              ))}
            </div>
          </DashboardTabContent>
        </TabsContent>
        
        {/* Produits Transportés tab */}
        <TabsContent value="products" className="space-y-4">
          <DashboardTabContent 
            title="Produits Transportés" 
            showContent={true}
            noDataMessage={renderNoDataMessage()}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {dashboardSections[2].charts.map((chart, index) => (
                <ChartContainer 
                  key={index}
                  title={chart.title}
                  isEmpty={!dashboardData || !dashboardData.vehicleTypeBreakdown || dashboardData.vehicleTypeBreakdown.length === 0}
                  className="h-[500px] min-h-[500px] w-full"
                >
                  {chart.type === 'pie' && (
                    <ConsumptionPieChart 
                      data={dashboardData.vehicleTypeBreakdown || []}
                      title={chart.title}
                    />
                  )}
                  {chart.type === 'bar' && (
                    <ConsumptionBarChart 
                      data={dashboardData.monthlyData || []}
                      dataKey={chart.dataKey}
                      title={chart.title}
                    />
                  )}
                </ChartContainer>
              ))}
            </div>
          </DashboardTabContent>
        </TabsContent>
        
        {/* IPE tab */}
        <TabsContent value="ipe" className="space-y-4">
          <DashboardTabContent 
            title="IPE (Indice de Performance Énergétique)" 
            showContent={true}
            noDataMessage={renderNoDataMessage()}
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {dashboardSections[3].charts.map((chart, index) => (
                <ChartContainer 
                  key={index}
                  title={chart.title}
                  isEmpty={!dashboardData || !dashboardData.monthlyData || dashboardData.monthlyData.length === 0}
                  className="h-[500px] min-h-[500px] w-full"
                >
                  {chart.type === 'line' && (
                    <IPELineChart 
                      data={dashboardData.monthlyData || []}
                      dataKey={chart.dataKey}
                    />
                  )}
                </ChartContainer>
              ))}
            </div>
          </DashboardTabContent>
        </TabsContent>
        
        {/* Reports tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapports mensuels</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Les rapports mensuels détaillés sont disponibles dans la section Rapports.
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline">
                  <FileBarChart className="mr-2 h-4 w-4" />
                  Télécharger le rapport détaillé
                </Button>
                <Button variant="outline">
                  <FileBarChart className="mr-2 h-4 w-4" />
                  Exporter les données
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
