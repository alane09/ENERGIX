"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoIcon } from "lucide-react";

export function DashboardHeader() {
  return (
    <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Situation Énergétique de Référence
            </h1>
            <p className="text-blue-100">
              Analyse et suivi des performances énergétiques de la flotte
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
              <InfoIcon className="w-4 h-4 mr-2" />
              Données en temps réel
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 