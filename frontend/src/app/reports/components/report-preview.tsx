"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ReportTemplate } from "@/types/report"
import { FileText, LineChart, Table } from "lucide-react"

interface ReportPreviewProps {
  template: ReportTemplate | null
  vehicleType: string
  includeCharts: boolean
  includeSummary: boolean
  includeFooter: boolean
}

export function ReportPreview({
  template,
  vehicleType,
  includeCharts,
  includeSummary,
  includeFooter
}: ReportPreviewProps) {
  if (!template) {
    return (
      <Card className="h-full flex items-center justify-center text-muted-foreground">
        <CardContent className="pt-6">
          Sélectionnez un modèle pour voir l'aperçu
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardContent className="pt-6">
        {/* Header Preview */}
        <div className="border-b pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">{template.name}</h3>
              <p className="text-sm text-muted-foreground">
                Type de véhicule: {vehicleType || "Non sélectionné"}
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              {new Date().toLocaleDateString("fr-FR")}
            </div>
          </div>
        </div>

        {/* Sections Preview */}
        <div className="space-y-4">
          {includeSummary && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                <h4 className="font-medium">Résumé</h4>
              </div>
              <div className="pl-6 space-y-2">
                <div className="h-4 bg-muted/30 rounded w-3/4" />
                <div className="h-4 bg-muted/30 rounded w-1/2" />
              </div>
            </div>
          )}

          {includeCharts && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <LineChart className="h-4 w-4" />
                <h4 className="font-medium">Graphiques</h4>
              </div>
              <div className="pl-6">
                <div className="h-32 bg-muted/30 rounded flex items-center justify-center">
                  Aperçu du graphique
                </div>
              </div>
            </div>
          )}

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Table className="h-4 w-4" />
              <h4 className="font-medium">Données</h4>
            </div>
            <div className="pl-6">
              <div className="space-y-2">
                <div className="h-4 bg-muted/30 rounded w-full" />
                <div className="h-4 bg-muted/30 rounded w-full" />
                <div className="h-4 bg-muted/30 rounded w-3/4" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Preview */}
        {includeFooter && (
          <div className="border-t mt-4 pt-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>COFICAB - Gestion Énergétique</span>
              <span>Page 1</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
