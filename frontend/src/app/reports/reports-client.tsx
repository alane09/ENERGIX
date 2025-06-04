"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReportsAPI } from "@/lib/api"
import { BarChart4, FileCog, FileDown, FileText, LineChart, PieChart, Plus, Edit, Download, Sparkles } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ReportEditor } from "./components/report-editor"
import { AIAnalysisPanel } from "./components/ai-analysis-panel"

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface SavedReport {
  id: string;
  title: string;
  type: string;
  format: string;
  dateGenerated: string;
  downloadUrl: string;
}

interface ReportsClientProps {
  initialReportTypes: ReportType[];
  initialSavedReports: SavedReport[];
  vehicleTypes: string[];
}

export function ReportsClient({ initialReportTypes, initialSavedReports, vehicleTypes }: ReportsClientProps) {
  const [reportTypes] = useState<ReportType[]>(initialReportTypes);
  const [savedReports, setSavedReports] = useState<SavedReport[]>(initialSavedReports);
  const [selectedReportType, setSelectedReportType] = useState<string>("");
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("all");
  const [selectedFormat, setSelectedFormat] = useState<string>("pdf");
  const [dateRange, setDateRange] = useState<string>("last-month");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("list");
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<string>("");
  
  const handleGenerateReport = async () => {
    if (!selectedReportType) {
      toast.error("Veuillez sélectionner un type de rapport");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Calculate date range based on selection
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      
      switch (dateRange) {
        case "last-month":
          startDate.setMonth(now.getMonth() - 1);
          endDate = now;
          break;
        case "last-quarter":
          startDate.setMonth(now.getMonth() - 3);
          endDate = now;
          break;
        case "last-year":
          startDate.setFullYear(now.getFullYear() - 1);
          endDate = now;
          break;
        case "ytd":
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = now;
          break;
        default:
          startDate.setMonth(now.getMonth() - 1);
          endDate = now;
      }
      
      // Format dates for API
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Get the selected report type details
      const reportType = reportTypes.find(r => r.id === selectedReportType);
      
      // Generate report using the API
      const result = await ReportsAPI.generateReport({
        type: selectedReportType,
        vehicleType: selectedVehicleType,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        options: {
          format: selectedFormat as 'pdf' | 'excel',
          title: `${reportType?.title} - ${selectedVehicleType !== 'all' ? selectedVehicleType : 'Tous les véhicules'}`
        }
      });
      
      if (result) {
        // Add the new report to the list
        const newReport: SavedReport = {
          id: result.reportId,
          title: `${reportType?.title} - ${selectedVehicleType !== 'all' ? selectedVehicleType : 'Tous les véhicules'}`,
          type: selectedReportType,
          format: selectedFormat,
          dateGenerated: new Date().toISOString(),
          downloadUrl: result.downloadUrl
        };
        
        setSavedReports([newReport, ...savedReports]);
        toast.success("Rapport généré avec succès");
        
        // Reset selections
        setSelectedReportType("");
      } else {
        toast.error("Erreur lors de la génération du rapport");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Erreur lors de la génération du rapport");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleDownload = async (report: SavedReport) => {
    try {
      // In a real app, this would trigger the download from the URL
      window.open(report.downloadUrl, '_blank');
      toast.success("Téléchargement démarré");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Erreur lors du téléchargement");
    }
  };
  
  const handleDelete = async (reportId: string) => {
    try {
      // Delete the report using the API
      const success = await ReportsAPI.deleteReport(reportId);
      
      if (success) {
        // Remove the report from the list
        setSavedReports(savedReports.filter(report => report.id !== reportId));
        toast.success("Rapport supprimé");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Erreur lors de la suppression");
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Rapports</h3>
        <p className="text-sm text-muted-foreground">
          Générez et consultez des rapports détaillés sur vos données de consommation
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Générer un rapport</CardTitle>
            <CardDescription>
              Créez un nouveau rapport personnalisé
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Type de rapport</Label>
              <RadioGroup 
                value={selectedReportType} 
                onValueChange={setSelectedReportType}
                className="grid grid-cols-1 gap-4"
            </Button>
          )}
        </div>
        
        <TabsContent value="list" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportTypes.map((reportType) => (
              <Card key={reportType.id} className={`cursor-pointer transition-all ${selectedReportType === reportType.id ? 'ring-2 ring-primary' : 'hover:border-primary/50'}`} onClick={() => setSelectedReportType(reportType.id)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{reportType.title}</CardTitle>
                    {reportType.icon}
                  </div>
                  <CardDescription>{reportType.description}</CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateNewReport();
                      setSelectedReportType(reportType.id);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Éditer
                  </Button>
                  <Button 
                    variant={selectedReportType === reportType.id ? "default" : "outline"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReportType(reportType.id);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Générer
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {selectedReportType && (
            <Card>
              <CardHeader>
                <CardTitle>Paramètres du rapport</CardTitle>
                <CardDescription>
                  Configurez les paramètres pour le rapport {reportTypes.find(r => r.id === selectedReportType)?.title.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Type de véhicule</Label>
                  <Select value={selectedVehicleType} onValueChange={setSelectedVehicleType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type de véhicule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les véhicules</SelectItem>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Période</Label>
                  <RadioGroup value={dateRange} onValueChange={setDateRange} className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="last-month" id="last-month" />
                      <Label htmlFor="last-month">Dernier mois</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="last-quarter" id="last-quarter" />
                      <Label htmlFor="last-quarter">Dernier trimestre</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="last-year" id="last-year" />
                      <Label htmlFor="last-year">Dernière année</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ytd" id="ytd" />
                      <Label htmlFor="ytd">Année en cours</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Format</Label>
                  <RadioGroup value={selectedFormat} onValueChange={setSelectedFormat} className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pdf" id="pdf" />
                      <Label htmlFor="pdf">PDF</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="docx" id="docx" />
                      <Label htmlFor="docx">Word</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="excel" id="excel" />
                      <Label htmlFor="excel">Excel</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleGenerateReport} 
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? 'Génération en cours...' : 'Générer le rapport'}
                </Button>
              </CardFooter>
            </Card>
          )}

          {savedReports.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Rapports sauvegardés</h2>
              <div className="space-y-2">
                {savedReports.map((report) => (
                  <Card key={report.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{report.title}</CardTitle>
                          <CardDescription>Généré le {new Date(report.dateGenerated).toLocaleDateString('fr-FR')}</CardDescription>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleDownload(report)}
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleDelete(report.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
