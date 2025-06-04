'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Car, 
  Truck, 
  Package, 
  Droplets, 
  MapPin, 
  Gauge, 
  DollarSign, 
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Loader2,
  Globe,
  Building,
  Factory
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  DashboardData, 
  VEHICLE_TYPES, 
  YEAR_OPTIONS,
  REGION_OPTIONS,
  formatMetricValue,
  hasVehicleKilometrageData,
  hasVehicleTonnageData
} from '../types/dashboard';
import { fetchDashboardData } from '../dashboard';
import { LineChart } from './charts/LineChart';
import { BarChart } from './charts/BarChart';
import { PieChart } from './charts/PieChart';

// Define chart item type with proper TypeScript interface
interface ChartItem {
  type: 'bar' | 'line' | 'pie';
  title: string;
  dataKey: string;
  isIPETonne?: boolean;
}

// Dashboard sections configuration
const DASHBOARD_SECTIONS = [
  {
    id: 'consumption',
    title: 'Consommation',
    icon: 'Droplets',
    metrics: ['consumption'],
    charts: [
      { type: 'bar', title: 'Consommation mensuelle (en litres)', dataKey: 'consumption', isIPETonne: false },
      { type: 'line', title: 'Évolution de la consommation', dataKey: 'consumption', isIPETonne: false },
      { type: 'pie', title: 'Répartition par véhicule', dataKey: 'consumption', isIPETonne: false }
    ] as ChartItem[]
  },
  {
    id: 'cost',
    title: 'Coûts',
    icon: 'DollarSign',
    metrics: ['cost'],
    charts: [
      { type: 'bar', title: 'Coûts mensuels (en DT)', dataKey: 'cost', isIPETonne: false },
      { type: 'line', title: 'Évolution des coûts', dataKey: 'cost', isIPETonne: false },
      { type: 'pie', title: 'Répartition par véhicule', dataKey: 'cost', isIPETonne: false }
    ] as ChartItem[]
  },
  {
    id: 'kilometrage',
    title: 'Kilométrage',
    icon: 'MapPin',
    metrics: ['kilometrage'],
    charts: [
      { type: 'bar', title: 'Kilométrage mensuel', dataKey: 'kilometrage', isIPETonne: false },
      { type: 'line', title: 'Évolution du kilométrage', dataKey: 'kilometrage', isIPETonne: false },
      { type: 'pie', title: 'Répartition par véhicule', dataKey: 'kilometrage', isIPETonne: false }
    ] as ChartItem[]
  },
  {
    id: 'ipe',
    title: 'IPE',
    icon: 'Gauge',
    metrics: ['ipe'],
    charts: [
      { type: 'bar', title: 'IPE mensuel (L/100km)', dataKey: 'ipe', isIPETonne: false },
      { type: 'line', title: 'Évolution de l\'IPE', dataKey: 'ipe', isIPETonne: false }
    ] as ChartItem[]
  },
  {
    id: 'tonnage',
    title: 'Produits Transportés',
    icon: 'Package',
    metrics: ['tonnage'],
    charts: [
      { type: 'bar', title: 'Tonnage mensuel (en tonnes)', dataKey: 'tonnage', isIPETonne: false },
      { type: 'line', title: 'Évolution du tonnage', dataKey: 'tonnage', isIPETonne: false },
      { type: 'pie', title: 'Répartition par véhicule', dataKey: 'tonnage', isIPETonne: false }
    ] as ChartItem[]
  },
  {
    id: 'ipeTonne',
    title: 'IPE/Tonne',
    icon: 'Gauge',
    metrics: ['ipeTonne'],
    charts: [
      { type: 'bar', title: 'IPE/Tonne mensuel (L/100km.T)', dataKey: 'ipeTonne', isIPETonne: true },
      { type: 'line', title: 'Évolution de l\'IPE/Tonne', dataKey: 'ipeTonne', isIPETonne: true }
    ] as ChartItem[]
  }
];

export default function DashboardClient() {
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Determine which sections to show based on vehicle type
  const getFilteredSections = useCallback(() => {
    // For Chariots, only show consumption and cost
    if (selectedVehicleType === 'chariots') {
      return DASHBOARD_SECTIONS.filter(section => 
        ['consumption', 'cost'].includes(section.id)
      );
    }
    
    // For Voitures, show all except tonnage and ipeTonne
    if (selectedVehicleType === 'voitures') {
      return DASHBOARD_SECTIONS.filter(section => 
        !['tonnage', 'ipeTonne'].includes(section.id)
      );
    }
    
    // For Camions or 'all', show all sections
    // Note: When 'all' is selected, we still show tonnage and IPE/Tonne sections
    // but the charts will display a note that these are for camions only
    return DASHBOARD_SECTIONS;
  }, [selectedVehicleType]);
  
  // Fetch dashboard data
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchDashboardData(selectedVehicleType, selectedYear, selectedRegion);
      
      if (!data) {
        setError(`Aucune donnée disponible pour les critères sélectionnés (${selectedVehicleType}, ${selectedYear}, ${selectedRegion})`);
        setDashboardData(null);
      } else {
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Erreur lors du chargement des données');
      setDashboardData(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedVehicleType, selectedYear, selectedRegion]);
  
  // Fetch data on component mount and when filters change
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);
  
  // Get the icon component for a section
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Car':
        return <Car className="h-4 w-4" />;
      case 'Truck':
        return <Truck className="h-4 w-4" />;
      case 'Package':
        return <Package className="h-4 w-4" />;
      case 'Droplets':
        return <Droplets className="h-4 w-4" />;
      case 'MapPin':
        return <MapPin className="h-4 w-4" />;
      case 'Gauge':
        return <Gauge className="h-4 w-4" />;
      case 'DollarSign':
        return <DollarSign className="h-4 w-4" />;
      case 'BarChart':
        return <BarChartIcon className="h-4 w-4" />;
      case 'LineChart':
        return <LineChartIcon className="h-4 w-4" />;
      case 'PieChart':
        return <PieChartIcon className="h-4 w-4" />;
      default:
        return <Droplets className="h-4 w-4" />;
    }
  };
  
  // Get the icon for a vehicle type
  const getVehicleTypeIcon = (vehicleType: string) => {
    switch (vehicleType.toLowerCase()) {
      case 'camion':
      case 'camions':
        return <Truck className="h-4 w-4" />;
      case 'voiture':
      case 'voitures':
        return <Car className="h-4 w-4" />;
      case 'chariot':
      case 'chariots':
        return <Package className="h-4 w-4" />;
      default:
        return <Car className="h-4 w-4" />;
    }
  };
  
  // Get the icon for a region
  const getRegionIcon = (region: string) => {
    switch (region.toLowerCase()) {
      case 'tunis':
        return <Building className="h-4 w-4" />;
      case 'mjez':
        return <Factory className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };
  
  // Render summary cards with total values and breakdowns by vehicle type
  const renderSummaryCards = () => {
    if (!dashboardData) return null;
    
    // Get vehicle type metrics
    const metrics = dashboardData.vehicleTypeMetrics || {};
    const showBreakdown = selectedVehicleType === 'all' && Object.keys(metrics).length > 0;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Consumption Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Consommation Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMetricValue(dashboardData.totalConsommation, 'consumption')}
            </div>
            {showBreakdown && (
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                {Object.entries(metrics).map(([type, data]) => (
                  data.consommation > 0 && (
                    <div key={type} className="flex justify-between">
                      <span className="flex items-center gap-1">
                        {getVehicleTypeIcon(type)}
                        {type === 'camions' ? 'Camions' : type === 'voitures' ? 'Voitures' : 'Chariots'}
                      </span>
                      <span>{formatMetricValue(data.consommation, 'consumption')}</span>
                    </div>
                  )
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Cost Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Coût Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMetricValue(dashboardData.totalCost || 0, 'cost')}
            </div>
            {showBreakdown && (
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                {Object.entries(metrics).map(([type, data]) => (
                  data.cost > 0 && (
                    <div key={type} className="flex justify-between">
                      <span className="flex items-center gap-1">
                        {getVehicleTypeIcon(type)}
                        {type === 'camions' ? 'Camions' : type === 'voitures' ? 'Voitures' : 'Chariots'}
                      </span>
                      <span>{formatMetricValue(data.cost, 'cost')}</span>
                    </div>
                  )
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Kilometrage Card */}
        {hasVehicleKilometrageData(selectedVehicleType) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Kilométrage Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMetricValue(dashboardData.totalKilometrage, 'kilometrage')}
              </div>
              {showBreakdown && (
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  {Object.entries(metrics).map(([type, data]) => (
                    hasVehicleKilometrageData(type) && data.kilometrage > 0 && (
                      <div key={type} className="flex justify-between">
                        <span className="flex items-center gap-1">
                          {getVehicleTypeIcon(type)}
                          {type === 'camions' ? 'Camions' : type === 'voitures' ? 'Voitures' : 'Chariots'}
                        </span>
                        <span>{formatMetricValue(data.kilometrage, 'kilometrage')}</span>
                      </div>
                    )
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* IPE Card */}
        {hasVehicleKilometrageData(selectedVehicleType) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">IPE Moyen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMetricValue(dashboardData.avgIPE, 'ipe')}
              </div>
              {showBreakdown && (
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  {Object.entries(metrics).map(([type, data]) => (
                    hasVehicleKilometrageData(type) && data.ipe > 0 && (
                      <div key={type} className="flex justify-between">
                        <span className="flex items-center gap-1">
                          {getVehicleTypeIcon(type)}
                          {type === 'camions' ? 'Camions' : type === 'voitures' ? 'Voitures' : 'Chariots'}
                        </span>
                        <span>{formatMetricValue(data.ipe, 'ipe')}</span>
                      </div>
                    )
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Tonnage Card */}
        {hasVehicleTonnageData(selectedVehicleType) && dashboardData.totalTonnage && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tonnage Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMetricValue(dashboardData.totalTonnage, 'tonnage')}
              </div>
              {showBreakdown && (
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  {Object.entries(metrics).map(([type, data]) => (
                    hasVehicleTonnageData(type) && data.tonnage > 0 && (
                      <div key={type} className="flex justify-between">
                        <span className="flex items-center gap-1">
                          {getVehicleTypeIcon(type)}
                          {type === 'camions' ? 'Camions' : type === 'voitures' ? 'Voitures' : 'Chariots'}
                        </span>
                        <span>{formatMetricValue(data.tonnage, 'tonnage')}</span>
                      </div>
                    )
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* IPE/Tonne Card */}
        {hasVehicleTonnageData(selectedVehicleType) && dashboardData.avgIPETonne && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">IPE/Tonne Moyen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMetricValue(dashboardData.avgIPETonne, 'ipeTonne')}
              </div>
              {showBreakdown && (
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  {Object.entries(metrics).map(([type, data]) => (
                    hasVehicleTonnageData(type) && data.ipeTonne > 0 && (
                      <div key={type} className="flex justify-between">
                        <span className="flex items-center gap-1">
                          {getVehicleTypeIcon(type)}
                          {type === 'camions' ? 'Camions' : type === 'voitures' ? 'Voitures' : 'Chariots'}
                        </span>
                        <span>{formatMetricValue(data.ipeTonne, 'ipeTonne')}</span>
                      </div>
                    )
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };
  
  // Render the appropriate chart component based on type
  const renderChart = (type: string, dataKey: string, title: string, isIPETonne: boolean = false) => {
    if (!dashboardData) return null;
    
    // Special handling for tonnage and IPE/Tonne charts - these only apply to camions
    const isTonnageRelated = dataKey === 'tonnage' || dataKey === 'ipeTonne';
    
    // For tonnage-related charts, we always use camions data regardless of selected vehicle type
    const effectiveVehicleType = isTonnageRelated ? 'camions' : selectedVehicleType;
    
    // For tonnage-related charts, modify the title to indicate it's for camions only
    let effectiveTitle = title;
    if (isTonnageRelated && !title.includes('(Camions)')) {
      effectiveTitle = `${title} (Camions uniquement)`;
    }
    
    switch (type) {
      case 'line':
        return (
          <LineChart 
            data={dashboardData.monthlyData}
            dataKey={dataKey}
            title={effectiveTitle}
            isIPETonne={isIPETonne}
            selectedRegion={selectedRegion}
            selectedVehicleType={effectiveVehicleType}
          />
        );
      case 'bar':
        return (
          <BarChart 
            data={dashboardData.monthlyData}
            dataKey={dataKey}
            title={effectiveTitle}
            isIPETonne={isIPETonne}
            selectedRegion={selectedRegion}
            selectedVehicleType={effectiveVehicleType}
          />
        );
      case 'pie':
        // For tonnage-related pie charts, we should only show camions data
        return (
          <PieChart 
            data={dashboardData.vehicleTypeBreakdown}
            title={effectiveTitle}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className=" mt-2 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Suivi de la consommation énergétique des véhicules
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            {VEHICLE_TYPES.map((type) => (
              <Button
                key={type.id}
                variant={selectedVehicleType === type.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedVehicleType(type.id)}
                className="flex items-center gap-1"
              >
                {getVehicleTypeIcon(type.id)}
                <span className="hidden sm:inline">{type.name}</span>
              </Button>
            ))}
          </div>
          
          <div className="flex gap-2">
            {YEAR_OPTIONS.map((year) => (
              <Button
                key={year.id}
                variant={selectedYear === year.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedYear(year.id)}
              >
                {year.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Region selection */}
      <div className="flex justify-center">
        <Tabs 
          value={selectedRegion} 
          onValueChange={setSelectedRegion}
          className="w-full max-w-md"
        >
          <TabsList className="grid grid-cols-3 w-full">
            {REGION_OPTIONS.map((region) => (
              <TabsTrigger 
                key={region.id} 
                value={region.id}
                className="flex items-center gap-2"
              >
                {getRegionIcon(region.id)}
                <span>{region.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {renderSummaryCards()}
          
          <Tabs defaultValue={getFilteredSections()[0]?.id}>
            <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-4">
              {getFilteredSections().map((section) => (
                <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
                  {getIconComponent(section.icon)}
                  <span className="hidden md:inline">{section.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {getFilteredSections().map((section) => (
              <TabsContent key={section.id} value={section.id} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.charts.map((chart, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getIconComponent(section.icon)}
                          {chart.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="h-[300px]">
                          {renderChart(chart.type, chart.dataKey, chart.title, chart.isIPETonne)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  );
}
