"use client"

import { PDFGeneratorService } from "@/app/reports/services/pdf-generator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { API } from "@/lib/api"
import { ConsumptionData, ReportGenerationOptions, ReportTemplate, VehicleData } from "@/types/report"
import { FileDown, FileText, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ReportPreview } from "./report-preview"

type ReportFormat = 'pdf' | 'excel' | 'word'

interface ReportGenerationParams {
  type: string
  startDate: string
  endDate: string
  format: ReportFormat
  consumption?: ConsumptionData[]
  vehicles?: VehicleData[]
}

interface ReportGeneratorClientProps {
  reportTemplates: ReportTemplate[]
  vehicleTypes: string[]
}

export function ReportGeneratorClient({ reportTemplates, vehicleTypes }: ReportGeneratorClientProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("")
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>("pdf")
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [includeCharts, setIncludeCharts] = useState<boolean>(true)
  const [includeSummary, setIncludeSummary] = useState<boolean>(true)
  const [includeFooter, setIncludeFooter] = useState<boolean>(true)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>("settings")

  const selectedTemplate = reportTemplates.find(t => t.id === selectedTemplateId)

  const validateForm = () => {
    if (!selectedTemplateId) {
      toast.error("Veuillez sélectionner un modèle de rapport")
      return false
    }
    if (!selectedVehicleType) {
      toast.error("Veuillez sélectionner un type de véhicule")
      return false
    }
    return true
  }

  const handleGenerateReport = async () => {
    if (!validateForm()) return

    setIsGenerating(true)
    try {
      const template = reportTemplates.find(t => t.id === selectedTemplateId)
      if (!template) {
        throw new Error("Modèle de rapport invalide")
      }

      // Fetch real data for the report
      const reportData = {
        consumption: await fetch(`/api/consumption?vehicleType=${selectedVehicleType}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => []) as ConsumptionData[],
        vehicles: await fetch(`/api/vehicles?vehicleType=${selectedVehicleType}`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => []) as VehicleData[]
      }

      // Prepare report generation options
      const options: ReportGenerationOptions = {
        template,
        data: {
          metadata: {
            id: "",
            title: template.name,
            type: template.id as any,
            dateGenerated: new Date().toISOString(),
            dateRange: { 
              start: startDate.toISOString(),
              end: endDate.toISOString()
            },
            vehicleType: selectedVehicleType,
            format: selectedFormat,
            generatedBy: "user"
          },
          consumption: reportData.consumption,
          vehicles: reportData.vehicles
        },
        sections: {
          include: [
            includeCharts ? "charts" : "",
            includeSummary ? "summary" : "",
            includeFooter ? "footer" : ""
          ].filter(Boolean)
        }
      }

      let downloadUrl: string | undefined

      if (selectedFormat === "pdf") {
        const pdfService = new PDFGeneratorService()
        const result = await pdfService.generateReport(options)
        downloadUrl = result?.downloadUrl || undefined
      } else {
        // For Excel and Word, call backend API
        const params: ReportGenerationParams = {
          type: selectedTemplateId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          format: selectedFormat,
          consumption: reportData.consumption,
          vehicles: reportData.vehicles
        }
        const apiResult = await API.Reports.generateReport(params)
        downloadUrl = apiResult || undefined
      }

      if (downloadUrl) {
        toast.success("Rapport généré avec succès")
        window.open(downloadUrl, "_blank")
      } else {
        toast.error("Erreur lors de la génération du rapport")
      }

    } catch (error) {
      console.error("Erreur lors de la génération du rapport:", error)
      toast.error("Erreur lors de la génération du rapport")
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePreview = () => {
    if (validateForm()) {
      setActiveTab("preview")
    }
  }

  if (!reportTemplates.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Générateur de rapport</CardTitle>
        <CardDescription>Créez des rapports professionnels et bien structurés</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
            <TabsTrigger value="preview">Aperçu</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            <div>
              <Label>Modèle de rapport</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un modèle" />
                </SelectTrigger>
                <SelectContent>
                  {reportTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type de véhicule</Label>
              <Select value={selectedVehicleType} onValueChange={setSelectedVehicleType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Période</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date de début</Label>
                    <input
                      type="date"
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={startDate.toISOString().split('T')[0]}
                      onChange={(e) => setStartDate(new Date(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Date de fin</Label>
                    <input
                      type="date"
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={endDate.toISOString().split('T')[0]}
                      onChange={(e) => setEndDate(new Date(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Format</Label>
                <RadioGroup
                  value={selectedFormat}
                  onValueChange={(value: ReportFormat) => setSelectedFormat(value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pdf" id="pdf" />
                    <Label htmlFor="pdf">PDF</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="excel" id="excel" />
                    <Label htmlFor="excel">Excel</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="word" id="word" />
                    <Label htmlFor="word">Word</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-charts"
                    checked={includeCharts}
                    onCheckedChange={(checked) => setIncludeCharts(!!checked)}
                  />
                  <Label htmlFor="include-charts">Inclure les graphiques</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-summary"
                    checked={includeSummary}
                    onCheckedChange={(checked) => setIncludeSummary(!!checked)}
                  />
                  <Label htmlFor="include-summary">Inclure le résumé</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-footer"
                    checked={includeFooter}
                    onCheckedChange={(checked) => setIncludeFooter(!!checked)}
                  />
                  <Label htmlFor="include-footer">Inclure l'en-tête et le pied de page</Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handlePreview}
                  disabled={isGenerating}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Aperçu
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                  )}
                  {isGenerating ? "Génération..." : "Générer"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <ReportPreview
              template={selectedTemplate || null}
              vehicleType={selectedVehicleType}
              includeCharts={includeCharts}
              includeSummary={includeSummary}
              includeFooter={includeFooter}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
