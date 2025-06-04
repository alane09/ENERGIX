"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText, FileType, FileSpreadsheet, Loader2, Save, Download, 
  Eye, Edit, Sparkles, Image, FileImage
} from "lucide-react"
import { RichTextEditor } from "./rich-text-editor"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ReportsAPI } from "@/lib/api"

interface ReportEditorProps {
  reportId?: string
  initialContent?: string
  reportType?: string
  onSave?: (reportId: string) => void
  onCancel?: () => void
}

export function ReportEditor({ 
  reportId, 
  initialContent = "", 
  reportType = "consumption",
  onSave,
  onCancel
}: ReportEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [activeTab, setActiveTab] = useState("edit")
  const [selectedFormat, setSelectedFormat] = useState("PDF")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [includeAiAnalysis, setIncludeAiAnalysis] = useState(true)
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeBranding, setIncludeBranding] = useState(true)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoadingTemplates(true)
      try {
        // In a real implementation, this would call the API
        // const templates = await ReportsAPI.getTemplates()
        // setTemplates(templates)
        
        // For now, use mock data
        setTemplates([
          { id: "template1", name: "Rapport standard", description: "Template de base pour les rapports" },
          { id: "template2", name: "Rapport détaillé", description: "Template avec analyses approfondies" },
          { id: "template3", name: "Rapport exécutif", description: "Template concis pour les décideurs" },
        ])
      } catch (error) {
        console.error("Failed to load templates:", error)
        toast.error("Erreur lors du chargement des templates")
      } finally {
        setIsLoadingTemplates(false)
      }
    }
    
    loadTemplates()
  }, [])

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      // In a real implementation, this would call the API
      // const result = await ReportsAPI.saveReport({
      //   id: reportId,
      //   content,
      //   type: reportType,
      //   format: selectedFormat,
      //   includeAiAnalysis,
      //   includeCharts,
      //   includeBranding,
      //   templateId: selectedTemplate
      // })
      
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success("Rapport enregistré avec succès")
      onSave?.(reportId || "new-report-id")
    } catch (error) {
      console.error("Failed to save report:", error)
      toast.error("Erreur lors de l'enregistrement du rapport")
    } finally {
      setIsSaving(false)
    }
  }, [content, reportId, reportType, selectedFormat, includeAiAnalysis, includeCharts, includeBranding, selectedTemplate, onSave])

  // Generate preview
  const handleGeneratePreview = useCallback(async () => {
    setIsGeneratingPreview(true)
    try {
      // In a real implementation, this would call the API
      // const preview = await ReportsAPI.generatePreview({
      //   content,
      //   type: reportType,
      //   format: selectedFormat,
      //   includeAiAnalysis,
      //   includeCharts,
      //   includeBranding,
      //   templateId: selectedTemplate
      // })
      
      // For now, simulate API call and use a placeholder PDF
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Use a placeholder PDF URL
      setPreviewUrl("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf")
      setActiveTab("preview")
      toast.success("Aperçu généré avec succès")
    } catch (error) {
      console.error("Failed to generate preview:", error)
      toast.error("Erreur lors de la génération de l'aperçu")
    } finally {
      setIsGeneratingPreview(false)
    }
  }, [content, reportType, selectedFormat, includeAiAnalysis, includeCharts, includeBranding, selectedTemplate])

  // Generate AI analysis
  const handleGenerateAiAnalysis = useCallback(async () => {
    setIsAnalyzing(true)
    try {
      // In a real implementation, this would call the API
      // const analysis = await ReportsAPI.generateAiAnalysis({
      //   content,
      //   type: reportType
      // })
      
      // For now, simulate API call and use mock data
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setAiAnalysis({
        summary: "L'analyse de la consommation de carburant sur la période montre une amélioration globale de l'efficacité énergétique de 12%. Les camions ont réalisé les progrès les plus significatifs avec une réduction de 8% de leur consommation moyenne.",
        insights: [
          "La consommation de carburant a diminué de 12% par rapport à la période précédente",
          "Les véhicules de type 'camion' ont montré une amélioration de l'efficacité de 8%",
          "Les trajets urbains ont une consommation 15% plus élevée que les trajets sur autoroute"
        ],
        recommendations: [
          "Optimiser les itinéraires pour réduire les trajets urbains de 10%",
          "Programmer la maintenance des véhicules à haute consommation",
          "Former les conducteurs aux techniques de conduite économique",
          "Remplacer progressivement les véhicules les moins efficaces"
        ]
      })
      
      toast.success("Analyse IA générée avec succès")
    } catch (error) {
      console.error("Failed to generate AI analysis:", error)
      toast.error("Erreur lors de la génération de l'analyse IA")
    } finally {
      setIsAnalyzing(false)
    }
  }, [content, reportType])

  // Handle export
  const handleExport = useCallback(async (format: string) => {
    try {
      toast.info(`Préparation de l'export en format ${format}...`)
      
      // In a real implementation, this would call the API
      // const result = await ReportsAPI.exportReport({
      //   content,
      //   type: reportType,
      //   format,
      //   includeAiAnalysis,
      //   includeCharts,
      //   includeBranding,
      //   templateId: selectedTemplate
      // })
      
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success(`Rapport exporté en format ${format}`)
    } catch (error) {
      console.error(`Failed to export report as ${format}:`, error)
      toast.error(`Erreur lors de l'export en format ${format}`)
    }
  }, [content, reportType, includeAiAnalysis, includeCharts, includeBranding, selectedTemplate])

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <TabsList className="mb-2 md:mb-0">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Éditer
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Aperçu
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="flex items-center gap-2"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Enregistrer
            </Button>
          </div>
        </div>

        <TabsContent value="edit" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Éditeur de rapport
                  </CardTitle>
                  <CardDescription>
                    Modifiez le contenu de votre rapport
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor 
                    value={content} 
                    onChange={setContent} 
                    placeholder="Commencez à rédiger votre rapport..."
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {reportType === "consumption" ? "Consommation" : 
                       reportType === "efficiency" ? "Efficacité" : 
                       reportType === "ser" ? "SER" : reportType}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedFormat}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGeneratePreview}
                    disabled={isGeneratingPreview}
                    className="flex items-center gap-2"
                  >
                    {isGeneratingPreview ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    Aperçu
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileImage className="h-5 w-5 text-primary" />
                    Template
                  </CardTitle>
                  <CardDescription>
                    Sélectionnez un template pour votre rapport
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={selectedTemplate || ""}
                    onValueChange={setSelectedTemplate}
                    disabled={isLoadingTemplates}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedTemplate && (
                    <div className="text-sm text-muted-foreground">
                      {templates.find(t => t.id === selectedTemplate)?.description}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    Analyse IA
                  </CardTitle>
                  <CardDescription>
                    Générez des insights et des recommandations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!aiAnalysis ? (
                    <Button 
                      onClick={handleGenerateAiAnalysis} 
                      disabled={isAnalyzing}
                      className="w-full"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyse en cours...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Analyser les données
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-1">Résumé</h4>
                        <p className="text-sm text-muted-foreground">
                          {aiAnalysis.summary}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-1">Recommandations</h4>
                        <ul className="space-y-1 text-sm">
                          {aiAnalysis.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary">•</span>
                              <span className="text-muted-foreground">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="include-ai"
                          checked={includeAiAnalysis}
                          onCheckedChange={setIncludeAiAnalysis}
                        />
                        <Label htmlFor="include-ai">Inclure dans le rapport</Label>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Image className="h-5 w-5 text-primary" />
                    Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-charts"
                      checked={includeCharts}
                      onCheckedChange={setIncludeCharts}
                    />
                    <Label htmlFor="include-charts">Inclure les graphiques</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-branding"
                      checked={includeBranding}
                      onCheckedChange={setIncludeBranding}
                    />
                    <Label htmlFor="include-branding">Inclure le branding COFICAB</Label>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="space-y-2">
                    <Label htmlFor="format">Format d'export</Label>
                    <Select
                      value={selectedFormat}
                      onValueChange={setSelectedFormat}
                    >
                      <SelectTrigger id="format">
                        <SelectValue placeholder="Sélectionner un format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="DOCX">Word (DOCX)</SelectItem>
                        <SelectItem value="XLSX">Excel (XLSX)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Aperçu du rapport
              </CardTitle>
              <CardDescription>
                Visualisez votre rapport avant de l'exporter
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewUrl ? (
                <div className="border rounded-md overflow-hidden h-[600px]">
                  <iframe 
                    src={previewUrl} 
                    className="w-full h-full"
                    title="Aperçu du rapport"
                  />
                </div>
              ) : (
                <div className="border rounded-md p-8 text-center h-[600px] flex flex-col items-center justify-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucun aperçu disponible</h3>
                  <p className="text-muted-foreground mb-4">
                    Générez un aperçu pour visualiser votre rapport
                  </p>
                  <Button
                    onClick={handleGeneratePreview}
                    disabled={isGeneratingPreview}
                    className="flex items-center gap-2"
                  >
                    {isGeneratingPreview ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    Générer un aperçu
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setActiveTab("edit")}
              >
                Retour à l'édition
              </Button>
              <Button
                onClick={() => setActiveTab("export")}
              >
                Passer à l'export
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Options d'exportation
              </CardTitle>
              <CardDescription>
                Choisissez le format dans lequel exporter votre rapport
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ExportOption
                  title="PDF"
                  description="Format haute qualité pour l'impression"
                  icon={<FileText className="h-10 w-10 text-red-500" />}
                  features={["Mise en page professionnelle", "Idéal pour l'impression", "Non modifiable"]}
                  onExport={() => handleExport("PDF")}
                />
                <ExportOption
                  title="Word"
                  description="Document modifiable"
                  icon={<FileType className="h-10 w-10 text-blue-500" />}
                  features={["Facilement modifiable", "Format standard", "Compatible Microsoft Office"]}
                  onExport={() => handleExport("DOCX")}
                />
                <ExportOption
                  title="Excel"
                  description="Données brutes et tableaux"
                  icon={<FileSpreadsheet className="h-10 w-10 text-green-500" />}
                  features={["Données tabulaires", "Calculs et formules", "Graphiques modifiables"]}
                  onExport={() => handleExport("XLSX")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ExportOptionProps {
  title: string
  description: string
  icon: React.ReactNode
  features: string[]
  onExport: () => void
}

function ExportOption({ title, description, icon, features, onExport }: ExportOptionProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <ul className="space-y-1 text-sm">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onExport} 
          className="w-full flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Exporter en {title}
        </Button>
      </CardFooter>
    </Card>
  )
}
