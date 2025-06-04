'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Vehicle } from "../types";
import { GeneralTab } from "./tabs/GeneralTab";
import { VehiclesTab } from "./tabs/VehiclesTab";

interface TabsContainerProps {
  vehicles: Vehicle[];
  selectedMatricules: string[];
  onSelectionChange: (matricules: string[]) => void;
  isLoading: boolean;
  region: string;
  year: string;
}

export function TabsContainer({
  vehicles,
  selectedMatricules,
  onSelectionChange,
  isLoading,
  region,
  year
}: TabsContainerProps) {
  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger
          value="general"
          className={cn(
            "transition-all duration-200"
          )}
        >
          Vue Générale
        </TabsTrigger>
        <TabsTrigger 
          value="vehicles"
          className={cn(
            "transition-all duration-200"
          )}
        >
          Par Véhicule
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GeneralTab
            vehicles={vehicles}
            selectedMatricules={selectedMatricules}
            onSelectionChange={onSelectionChange}
            isLoading={isLoading}
            region={region}
            year={year}
          />
        </motion.div>
      </TabsContent>

      <TabsContent value="vehicles">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <VehiclesTab
            vehicles={vehicles}
            selectedMatricules={selectedMatricules}
            onSelectionChange={onSelectionChange}
            isLoading={isLoading}
            region={region}
          />
        </motion.div>
      </TabsContent>
    </Tabs>
  );
}
