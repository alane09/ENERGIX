"use client";

import { CoefficientEditor } from "@/components/ser/coefficient-editor";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber } from "@/lib/utils";

interface OverviewTabProps {
  data: {
    coefficients: {
      kilometrage: number;
      tonnage: number;
    };
    intercept: number;
    multipleR: number;
    rSquared: number;
    adjustedRSquared: number;
    standardError: number;
    observations: number;
    degreesOfFreedom: number;
    sumOfSquares: number;
    meanSquare: number;
    fStatistic: number;
    significanceF: number;
    standardErrors?: number[];
    tStats?: number[];
    pValues?: number[];
    lowerConfidence?: number[];
    upperConfidence?: number[];
    predictedValues?: number[];
    residuals?: number[];
    equation: string;
  } | null;
  onSaveCoefficients?: (coefficients: { kilometrage: number; tonnage: number; intercept: number }) => Promise<void>;
}

export function OverviewTab({ data, onSaveCoefficients }: OverviewTabProps) {
  if (!data) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Aucune donnée disponible</h3>
        <p className="text-muted-foreground">
          Les données de régression ne sont pas encore disponibles. Veuillez vérifier que des données ont été téléchargées pour ce type de véhicule.
        </p>
      </Card>
    );
  }

  const hasResidualsData = data.predictedValues && data.residuals && 
    data.predictedValues.length === data.residuals.length;

  return (
    <div className="grid gap-6">
      {/* Equation Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Modèle de régression linéaire multiple</h3>
          {onSaveCoefficients && (
            <CoefficientEditor
              coefficients={{
                kilometrage: data.coefficients.kilometrage,
                tonnage: data.coefficients.tonnage,
                intercept: data.intercept,
              }}
              onSave={onSaveCoefficients}
            />
          )}
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Équation avec les coefficients :</p>
            <p className="text-xl font-mono bg-muted/50 p-4 rounded-lg text-center">
              {data.equation}
            </p>
          </div>
        </div>
      </Card>

      {/* Regression Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Statistiques de la régression</h3>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Multiple R</TableCell>
              <TableCell>{formatNumber(data.multipleR, 6)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">R²</TableCell>
              <TableCell>{formatNumber(data.rSquared, 6)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">R² ajusté</TableCell>
              <TableCell>{formatNumber(data.adjustedRSquared, 6)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Erreur-type</TableCell>
              <TableCell>{formatNumber(data.standardError, 4)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Observations</TableCell>
              <TableCell>{data.observations}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      {/* ANOVA */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Analyse de la variance</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>ddl</TableHead>
              <TableHead>Somme des carrés</TableHead>
              <TableHead>Moyenne des carrés</TableHead>
              <TableHead>F</TableHead>
              <TableHead>Valeur-P</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Régression</TableCell>
              <TableCell>{formatNumber(data.degreesOfFreedom, 0)}</TableCell>
              <TableCell>{formatNumber(data.sumOfSquares, 2)}</TableCell>
              <TableCell>{formatNumber(data.meanSquare, 2)}</TableCell>
              <TableCell>{formatNumber(data.fStatistic, 6)}</TableCell>
              <TableCell>{formatNumber(data.significanceF, 8)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      {/* Coefficients */}
      {data.standardErrors && data.tStats && data.pValues && data.lowerConfidence && data.upperConfidence && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Coefficients</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Coefficients</TableHead>
                <TableHead>Erreur-type</TableHead>
                <TableHead>Statistique t</TableHead>
                <TableHead>Probabilité</TableHead>
                <TableHead>Limite inférieure 95%</TableHead>
                <TableHead>Limite supérieure 95%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Constante</TableCell>
                <TableCell>{formatNumber(data.intercept, 4)}</TableCell>
                <TableCell>{formatNumber(data.standardErrors[0], 4)}</TableCell>
                <TableCell>{formatNumber(data.tStats[0], 4)}</TableCell>
                <TableCell>{formatNumber(data.pValues[0], 4)}</TableCell>
                <TableCell>{formatNumber(data.lowerConfidence[0], 4)}</TableCell>
                <TableCell>{formatNumber(data.upperConfidence[0], 4)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Kilométrage</TableCell>
                <TableCell>{formatNumber(data.coefficients.kilometrage, 4)}</TableCell>
                <TableCell>{formatNumber(data.standardErrors[1], 4)}</TableCell>
                <TableCell>{formatNumber(data.tStats[1], 4)}</TableCell>
                <TableCell>{formatNumber(data.pValues[1], 4)}</TableCell>
                <TableCell>{formatNumber(data.lowerConfidence[1], 4)}</TableCell>
                <TableCell>{formatNumber(data.upperConfidence[1], 4)}</TableCell>
              </TableRow>
              {data.coefficients.tonnage !== 0 && (
                <TableRow>
                  <TableCell className="font-medium">Tonnage</TableCell>
                  <TableCell>{formatNumber(data.coefficients.tonnage, 4)}</TableCell>
                  <TableCell>{formatNumber(data.standardErrors[2], 4)}</TableCell>
                  <TableCell>{formatNumber(data.tStats[2], 4)}</TableCell>
                  <TableCell>{formatNumber(data.pValues[2], 4)}</TableCell>
                  <TableCell>{formatNumber(data.lowerConfidence[2], 4)}</TableCell>
                  <TableCell>{formatNumber(data.upperConfidence[2], 4)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Residual Output */}
      {hasResidualsData && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Valeurs prédites et résidus</h3>
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Observation</TableHead>
                  <TableHead>Valeur prédite</TableHead>
                  <TableHead>Résidus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.predictedValues!.map((value, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{formatNumber(value, 2)}</TableCell>
                    <TableCell>{formatNumber(data.residuals![index], 2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
