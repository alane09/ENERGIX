"use client";

import { Card } from "@/components/ui/card";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { OverviewData } from "../types";
import { CustomTooltip } from "./ui/custom-tooltip";

interface OverviewTabProps {
  data: OverviewData | null;
  onSaveCoefficients: (coefficients: { kilometrage: number; tonnage: number; intercept: number }) => Promise<void>;
}

export function OverviewTab({ data, onSaveCoefficients }: OverviewTabProps) {
  if (!data) return null;

  const formatNumber = (num: number) => num.toFixed(4);
  const formatPercent = (num: number) => (num * 100).toFixed(2) + "%";

  return (
    <div className="space-y-6">
      {/* Equation Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Équation de régression</h3>
          <CustomTooltip
            trigger={<InfoCircledIcon className="h-5 w-5 text-muted-foreground" />}
            content="L'équation qui décrit la relation entre les variables"
          />
        </div>
        <p className="text-xl font-mono">{data.equation}</p>
      </Card>

      {/* Model Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            R² (Coefficient de détermination)
            <CustomTooltip
              trigger={<InfoCircledIcon className="h-4 w-4 text-muted-foreground" />}
              content="Mesure de la qualité de l'ajustement du modèle"
            />
          </h4>
          <p className="text-2xl font-semibold">{formatPercent(data.rSquared)}</p>
        </Card>

        <Card className="p-6">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            R² ajusté
            <CustomTooltip
              trigger={<InfoCircledIcon className="h-4 w-4 text-muted-foreground" />}
              content="R² ajusté pour le nombre de variables"
            />
          </h4>
          <p className="text-2xl font-semibold">{formatPercent(data.adjustedRSquared)}</p>
        </Card>

        <Card className="p-6">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            Erreur standard
            <CustomTooltip
              trigger={<InfoCircledIcon className="h-4 w-4 text-muted-foreground" />}
              content="Mesure de la précision des prédictions"
            />
          </h4>
          <p className="text-2xl font-semibold">{formatNumber(data.standardError)}</p>
        </Card>
      </div>

      {/* ANOVA Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Analyse de la variance (ANOVA)</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Source</th>
                <th className="text-right py-2">ddl</th>
                <th className="text-right py-2">Somme des carrés</th>
                <th className="text-right py-2">Carré moyen</th>
                <th className="text-right py-2">F</th>
                <th className="text-right py-2">Sig. F</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2">Régression</td>
                <td className="text-right">{data.degreesOfFreedom}</td>
                <td className="text-right">{formatNumber(data.sumOfSquares)}</td>
                <td className="text-right">{formatNumber(data.meanSquare)}</td>
                <td className="text-right">{formatNumber(data.fStatistic)}</td>
                <td className="text-right">{formatNumber(data.significanceF)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Coefficients Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Coefficients</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Variable</th>
                <th className="text-right py-2">Coefficient</th>
                <th className="text-right py-2">Erreur std.</th>
                <th className="text-right py-2">Stat. t</th>
                <th className="text-right py-2">p-value</th>
                <th className="text-right py-2">IC inf. 95%</th>
                <th className="text-right py-2">IC sup. 95%</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2">Constante</td>
                <td className="text-right">{formatNumber(data.intercept)}</td>
                <td className="text-right">{formatNumber(data.standardErrors[0])}</td>
                <td className="text-right">{formatNumber(data.tStats[0])}</td>
                <td className="text-right">{formatNumber(data.pValues[0])}</td>
                <td className="text-right">{formatNumber(data.lowerConfidence[0])}</td>
                <td className="text-right">{formatNumber(data.upperConfidence[0])}</td>
              </tr>
              <tr>
                <td className="py-2">Kilométrage</td>
                <td className="text-right">{formatNumber(data.coefficients.kilometrage)}</td>
                <td className="text-right">{formatNumber(data.standardErrors[1])}</td>
                <td className="text-right">{formatNumber(data.tStats[1])}</td>
                <td className="text-right">{formatNumber(data.pValues[1])}</td>
                <td className="text-right">{formatNumber(data.lowerConfidence[1])}</td>
                <td className="text-right">{formatNumber(data.upperConfidence[1])}</td>
              </tr>
              {data.coefficients.tonnage !== undefined && (
                <tr>
                  <td className="py-2">Tonnage</td>
                  <td className="text-right">{formatNumber(data.coefficients.tonnage)}</td>
                  <td className="text-right">{formatNumber(data.standardErrors[2])}</td>
                  <td className="text-right">{formatNumber(data.tStats[2])}</td>
                  <td className="text-right">{formatNumber(data.pValues[2])}</td>
                  <td className="text-right">{formatNumber(data.lowerConfidence[2])}</td>
                  <td className="text-right">{formatNumber(data.upperConfidence[2])}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
