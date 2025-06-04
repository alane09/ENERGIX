'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from "react";
import { SaisieManuelleClient } from "./saisie-manuelle-client";

// Define vehicle types
type VehicleType = "CAMION" | "VOITURE" | "CHARIOT";

// Define vehicle object structure
interface VehicleEntry {
  matricule: string;
  color: string;
  type: string;
  region: string;
}

interface ConfigState {
  vehicleTypes: string[];
  regions: string[];
  apiEndpoint: string;
  vehicleData: Record<VehicleType, VehicleEntry[]>;
}

export default function SaisieManuelle() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<ConfigState>({
    vehicleTypes: ["CAMION", "VOITURE", "CHARIOT"],
    regions: ["Tunis", "MJEZ ELBEB"],
    apiEndpoint: "/api",
    vehicleData: {
      CAMION: [],
      VOITURE: [],
      CHARIOT: []
    }
  });

  // Set mounted state to ensure client-side rendering
  useEffect(() => {
    setIsMounted(true);
    
    // Fetch configuration and vehicle matricules from API
    const fetchData = async () => {
      try {
        // Track completion status for individual fetch operations
        let configFetched = false;
        let vehiclesFetched = false;
        let configData = { vehicleTypes: ["CAMION", "VOITURE", "CHARIOT"], regions: ["Tunis", "MJEZ ELBEB"] };
        let vehiclesData: Array<{ type?: string; matricule: string; region?: string }> = [];
          try {
          // Fetch vehicle types and regions configuration
          console.log("Fetching vehicle configuration...");
          const configResponse = await fetch('/api/config/vehicle-types', {
            cache: "no-store" // Prevent caching to always get fresh data
          });
          
          if (!configResponse.ok) {
            console.warn(`Config API responded with status: ${configResponse.status}`);
          } else {
            configData = await configResponse.json();
            configFetched = true;
            console.log("Successfully fetched config:", configData);
          }
        } catch (configError) {
          console.error("Error fetching configuration:", configError);
        }
        
        try {
          // Direct connection to the backend for debugging - bypass Next.js API routes
          console.log("Fetching real vehicle records directly...");
          // Direct connection to records endpoint
          const vehiclesResponse = await fetch('http://localhost:8080/records', {
            cache: "no-store", // Prevent caching to always get fresh data
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!vehiclesResponse.ok) {
            console.warn(`Direct vehicles API responded with status: ${vehiclesResponse.status}`);
            
            // Fallback to Next.js API route
            console.log("Falling back to Next.js API route...");
            const fallbackResponse = await fetch('/api/vehicles/matricules', {
              cache: "no-store"
            });
            
            if (!fallbackResponse.ok) {
              console.warn(`Fallback API responded with status: ${fallbackResponse.status}`);
            } else {
              vehiclesData = await fallbackResponse.json();
              vehiclesFetched = true;
              console.log("Successfully fetched vehicles from fallback:", vehiclesData);
            }
          } else {
            vehiclesData = await vehiclesResponse.json();
            vehiclesFetched = true;
            console.log("Successfully fetched vehicles directly:", vehiclesData);
          }
        } catch (vehiclesError) {
          console.error("Error fetching vehicles:", vehiclesError);
          // Try Next.js API route as fallback
          try {
            const fallbackResponse = await fetch('/api/vehicles/matricules');
            if (fallbackResponse.ok) {
              vehiclesData = await fallbackResponse.json();
              vehiclesFetched = true;
            }
          } catch (fallbackError) {
            console.error("Fallback also failed:", fallbackError);
          }
        }
        
        // Process vehicle data by type with proper typings
        const vehiclesByType: Record<VehicleType, VehicleEntry[]> = {
          CAMION: [],
          VOITURE: [],
          CHARIOT: []
        };
        
        // Map vehicles to their types with color assignments
        const colors = [
          "#4ade80", "#facc15", "#3b82f6", "#f87171", "#a855f7", 
          "#14b8a6", "#f97316", "#ec4899", "#64748b", "#84cc16"
        ];
        
        // Only process if we have vehicle data
        if (vehiclesFetched && Array.isArray(vehiclesData) && vehiclesData.length > 0) {
          console.log(`Processing ${vehiclesData.length} vehicles...`);
          vehiclesData.forEach((vehicle: { type?: string; matricule: string; region?: string }, index: number) => {
            if (!vehicle || !vehicle.matricule) return;
            
            const type = (vehicle.type || "CAMION") as VehicleType;
            const colorIndex = index % colors.length;
            
            if (type in vehiclesByType) {
              vehiclesByType[type].push({
                matricule: vehicle.matricule,
                color: colors[colorIndex],
                type: type,
                region: vehicle.region || configData.regions?.[0] || "Tunis"
              });
            }
          });
          
          console.log("Processed vehicles by type:", vehiclesByType);
        } else {
          // No vehicles available from database
          console.warn("No vehicle data available from database");
        }
        
        setConfig({
          vehicleTypes: configData.vehicleTypes || ["CAMION", "VOITURE", "CHARIOT"],
          regions: configData.regions || ["Tunis", "MJEZ ELBEB"],
          apiEndpoint: '/api',
          vehicleData: vehiclesByType
        });
      } catch (error) {
        console.error("Error in data fetching process:", error);
        // Use default configuration but with empty vehicle data
        setConfig({
          vehicleTypes: ["CAMION", "VOITURE", "CHARIOT"],
          regions: ["Tunis", "MJEZ ELBEB"],
          apiEndpoint: '/api',
          vehicleData: {
            CAMION: [],
            VOITURE: [],
            CHARIOT: []
          }
        });
      } finally {
        // Remove loading state
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  // If not mounted yet, show nothing to prevent hydration errors
  if (!isMounted) return null;
    
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-[#111827] dark:text-white">
          Saisie Manuelle des Données
        </h1>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="border-[#E5E7EB] dark:border-[#4A5568] bg-white dark:bg-[#1A202C] shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-[#2D3748] dark:text-[#F7FAFC]">
              Gestion des Données Véhicules
            </CardTitle>
            <CardDescription className="text-sm text-[#6B7280] dark:text-[#A0AEC0]">
              Saisissez des données manuellement pour les différents types de véhicules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SaisieManuelleClient 
              vehicleTypes={config.vehicleTypes}
              regions={config.regions}
              apiEndpoint={config.apiEndpoint}
              vehicleData={config.vehicleData}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
