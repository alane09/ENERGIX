"use client";

import { MonthlyData } from "@/app/situation-energ-ref/types";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber } from "@/lib/utils";

interface MonthlyDataTabProps {
  data: MonthlyData[] | null;
}

export function MonthlyDataTab({ data }: MonthlyDataTabProps) {
  if (!data) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Aucune donnée disponible</h3>
        <p className="text-muted-foreground">
          Les données mensuelles ne sont pas encore disponibles. Veuillez vérifier que des données ont été téléchargées pour ce type de véhicule.
        </p>
      </Card>
    );
  }

  // Calculate totals
  const totals = {
    kilometrage: data.reduce((sum, m) => sum + m.kilometrage, 0),
    tonnage: data.reduce((sum, m) => sum + m.tonnage, 0),
    consommation: data.reduce((sum, m) => sum + m.consommation, 0),
    referenceConsommation: data.reduce((sum, m) => sum + m.referenceConsommation, 0),
    targetConsommation: data.reduce((sum, m) => sum + m.targetConsommation, 0),
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Mois</TableHead>
              <TableHead className="text-right font-semibold">Kilométrage (X₁)</TableHead>
              <TableHead className="text-right font-semibold">Tonnage (X₂)</TableHead>
              <TableHead className="text-right font-semibold">Consommation actuelle (Y)</TableHead>
              <TableHead className="text-right font-semibold">Consommation de référence</TableHead>
              <TableHead className="text-right font-semibold">Amélioration (%)</TableHead>
              <TableHead className="text-right font-semibold">Consommation cible</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((month, index) => (
              <TableRow key={index} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                <TableCell className="font-medium">{month.month}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(month.kilometrage)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(month.tonnage)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(month.consommation)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(month.referenceConsommation)}
                </TableCell>
                <TableCell 
                  className={`text-right ${
                    month.improvementPercentage > 0 
                      ? "text-destructive font-medium" 
                      : "text-success font-medium"
                  }`}
                >
                  {formatNumber(month.improvementPercentage, 1)}%
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(month.targetConsommation)}
                </TableCell>
              </TableRow>
            ))}
            {/* Total Row */}
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">
                {formatNumber(totals.kilometrage)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(totals.tonnage)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(totals.consommation)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(totals.referenceConsommation)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(
                  ((totals.consommation - totals.referenceConsommation) / totals.consommation) * 100,
                  1
                )}%
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(totals.targetConsommation)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Formula Explanation */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Modèle de régression linéaire multiple</h3>
        <div className="space-y-4">
          <div>
            <p className="text-lg font-mono mb-2">Y = a·X₁ + b·X₂ + c</p>
            <p className="text-sm text-muted-foreground">où :</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm text-muted-foreground">
              <li>Y est la consommation (en litres)</li>
              <li>X₁ est le kilométrage (en km)</li>
              <li>X₂ est le tonnage transporté (en tonnes)</li>
              <li>a, b, et c sont des coefficients réels déterminés par régression</li>
            </ul>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mt-4">Calculs effectués :</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm text-muted-foreground">
              <li>Consommation de référence = Y (calculée à partir de la formule de régression)</li>
              <li>Amélioration (%) = ((Consommation actuelle – Consommation de référence) / Consommation actuelle) × 100</li>
              <li>Consommation cible = Consommation actuelle × (1 - 3%)</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
