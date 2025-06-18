/* eslint-disable @typescript-eslint/no-unused-vars */
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

  useEffect(() => {
    setIsMounted(true);
    const fetchData = async () => {
      try {
        // Fetch config and vehicles in parallel
        const [configRes, vehiclesRes] = await Promise.all([
          fetch('/api/config/vehicle-types', { cache: "no-store" }),
          fetch('http://localhost:8080/api/records', { cache: "no-store", headers: { 'Content-Type': 'application/json' } })
        ]);

        let configData = { vehicleTypes: ["CAMION", "VOITURE", "CHARIOT"], regions: ["Tunis", "MJEZ ELBEB"] };
        let vehiclesData: Array<{ type?: string; matricule: string; region?: string }> = [];

        if (configRes.ok) {
          configData = await configRes.json();
        }
        if (vehiclesRes.ok) {
          vehiclesData = await vehiclesRes.json();
        }

        // Process vehicle data by type
        const vehiclesByType: Record<VehicleType, VehicleEntry[]> = {
          CAMION: [],
          VOITURE: [],
          CHARIOT: []
        };
        const colors = [
          "#4ade80", "#facc15", "#3b82f6", "#f87171", "#a855f7", 
          "#14b8a6", "#f97316", "#ec4899", "#64748b", "#84cc16"
        ];
        if (Array.isArray(vehiclesData) && vehiclesData.length > 0) {
          vehiclesData.forEach((vehicle, index) => {
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
        }
        setConfig({
          vehicleTypes: configData.vehicleTypes || ["CAMION", "VOITURE", "CHARIOT"],
          regions: configData.regions || ["Tunis", "MJEZ ELBEB"],
          apiEndpoint: '/api',
          vehicleData: vehiclesByType
        });
      } catch {
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
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!isMounted) return null;
    
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Card only for filters, table, and actions */}
          <Card className="rounded-lg shadow-md border border-gray-200 w-full">
            <CardContent className="p-4 sm:p-8">
              <SaisieManuelleClient 
                vehicleTypes={config.vehicleTypes}
                regions={config.regions}
                apiEndpoint={config.apiEndpoint}
                vehicleData={config.vehicleData}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
