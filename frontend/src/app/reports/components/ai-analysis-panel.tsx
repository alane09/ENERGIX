"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Loader2, Sparkles, TrendingUp, AlertTriangle, LineChart, BarChart } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"

interface AIAnalysisPanelProps {
  data: any
  onAnalysisComplete?: (analysis: any) => void
  className?: string
}

export function AIAnalysisPanel({ data, onAnalysisComplete, className }: AIAnalysisPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("summary")

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      // In a real implementation, this would call the API
      // const result = await fetch('/api/reports/ai/analyze', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ data }),
      // }).then(res => res.json())
      
      // For now, simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const result = {
        summary: "L'analyse de la consommation de carburant sur la période montre une amélioration globale de l'efficacité énergétique de 12%. Les camions ont réalisé les progrès les plus significatifs avec une réduction de 8% de leur consommation moyenne. Les véhicules utilisés principalement en zone urbaine présentent toujours une consommation plus élevée, mais des optimisations d'itinéraires pourraient permettre des économies supplémentaires.",
        insights: [
          "La consommation de carburant a diminué de 12% par rapport à la période précédente",
          "Les véhicules de type 'camion' ont montré une amélioration de l'efficacité de 8%",
          "Les trajets urbains ont une consommation 15% plus élevée que les trajets sur autoroute",
          "La maintenance préventive a permis de réduire les incidents techniques de 23%"
        ],
        recommendations: [
          "Optimiser les itinéraires pour réduire les trajets urbains de 10%",
          "Programmer la maintenance des véhicules à haute consommation",
          "Former les conducteurs aux techniques de conduite économique",
          "Remplacer progressivement les véhicules les moins efficaces",
          "Mettre en place un système de suivi en temps réel de la consommation"
        ],
        metrics: {
          efficaciteMoyenne: 24.5,
          economiesPotentielles: 1250.75,
          reductionEmissionsCO2: 875.2,
          coutCarburantEvite: 1875.50
        },
        trends: {
          tendanceConsommation: "decroissante",
          tendanceEfficacite: "croissante",
          tendanceCouts: "decroissante",
          saisonalite: "forte en hiver"
        },
        anomalies: {
          vehiculesAtypiques: ["CAM-123", "VOI-456"],
          consommationInattendue: [
            { date: "2024-04-15", vehicule: "CAM-123", valeur: 45.2, attendu: 32.1 },
            { date: "2024-05-02", vehicule: "VOI-456", valeur: 12.8, attendu: 8.5 }
          ],
          maintenanceRecommandee: ["CAM-123", "VOI-789"]
        }
      }
      
      setAnalysis(result)
      onAnalysisComplete?.(result)
      toast.success("Analyse IA générée avec succès")
    } catch (error) {
      console.error('AI analysis failed:', error)
      toast.error("L'analyse IA a échoué")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Analyse IA
        </CardTitle>
        <CardDescription>
          Générez des insights et des recommandations basés sur l'intelligence artificielle
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!analysis ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Sparkles className="h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium mb-2 text-center">Analyse IA</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Notre IA peut analyser vos données pour identifier des tendances, des anomalies 
              et générer des recommandations personnalisées.
            </p>
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyser les données
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="summary" className="text-xs">Résumé</TabsTrigger>
                <TabsTrigger value="recommendations" className="text-xs">Recommandations</TabsTrigger>
                <TabsTrigger value="trends" className="text-xs">Tendances</TabsTrigger>
                <TabsTrigger value="anomalies" className="text-xs">Anomalies</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="space-y-4">
                <div className="p-4 border rounded-md bg-muted/50">
                  <p className="italic text-muted-foreground">{analysis.summary}</p>
                </div>
                
                <h4 className="font-medium text-sm">Insights clés</h4>
                <ul className="space-y-2">
                  {analysis.insights.map((insight: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
                
                <h4 className="font-medium text-sm">Métriques</h4>
                <div className="grid grid-cols-2 gap-2">
                  <MetricCard 
                    label="Efficacité moyenne" 
                    value={`${analysis.metrics.efficaciteMoyenne} L/100km`} 
                  />
                  <MetricCard 
                    label="Économies potentielles" 
                    value={`${analysis.metrics.economiesPotentielles.toLocaleString('fr-FR')} €`} 
                  />
                  <MetricCard 
                    label="Réduction CO2" 
                    value={`${analysis.metrics.reductionEmissionsCO2.toLocaleString('fr-FR')} kg`} 
                  />
                  <MetricCard 
                    label="Coût carburant évité" 
                    value={`${analysis.metrics.coutCarburantEvite.toLocaleString('fr-FR')} €`} 
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="recommendations" className="space-y-4">
                <div className="space-y-4">
                  {analysis.recommendations.map((rec: string, i: number) => (
                    <RecommendationCard key={i} recommendation={rec} priority={i < 2 ? "high" : i < 4 ? "medium" : "low"} />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="trends" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <TrendCard 
                    label="Consommation" 
                    trend={analysis.trends.tendanceConsommation} 
                    icon={<LineChart className="h-5 w-5" />}
                  />
                  <TrendCard 
                    label="Efficacité" 
                    trend={analysis.trends.tendanceEfficacite} 
                    icon={<BarChart className="h-5 w-5" />}
                  />
                  <TrendCard 
                    label="Coûts" 
                    trend={analysis.trends.tendanceCouts} 
                    icon={<LineChart className="h-5 w-5" />}
                  />
                  <TrendCard 
                    label="Saisonalité" 
                    trend={analysis.trends.saisonalite} 
                    icon={<BarChart className="h-5 w-5" />}
                  />
                </div>
                
                <div className="p-4 border rounded-md bg-muted/50 text-sm text-muted-foreground">
                  <p>L'analyse des tendances montre une amélioration générale des indicateurs de performance. 
                  La consommation et les coûts sont en baisse, tandis que l'efficacité est en hausse. 
                  Une forte saisonalité est observée en hiver, probablement due aux conditions climatiques.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="anomalies" className="space-y-4">
                <h4 className="font-medium text-sm">Véhicules atypiques</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {analysis.anomalies.vehiculesAtypiques.map((vehicule: string, i: number) => (
                    <Badge key={i} variant="outline" className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400">
                      {vehicule}
                    </Badge>
                  ))}
                </div>
                
                <h4 className="font-medium text-sm">Consommation inattendue</h4>
                <div className="space-y-2 mb-4">
                  {analysis.anomalies.consommationInattendue.map((anomalie: any, i: number) => (
                    <div key={i} className="p-3 border rounded-md bg-amber-50 dark:bg-amber-950/20 text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{anomalie.vehicule}</span>
                        <span>{anomalie.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span>
                          Consommation: <strong>{anomalie.valeur} L/100km</strong> (attendu: {anomalie.attendu} L/100km)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <h4 className="font-medium text-sm">Maintenance recommandée</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.anomalies.maintenanceRecommandee.map((vehicule: string, i: number) => (
                    <Badge key={i} variant="outline" className="bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                      {vehicule}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
      {analysis && (
        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="outline" size="sm" onClick={handleAnalyze}>
            <Sparkles className="h-4 w-4 mr-2" />
            Actualiser l'analyse
          </Button>
          <Button size="sm" onClick={() => toast.success("Analyse ajoutée au rapport")}>
            Ajouter au rapport
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

interface MetricCardProps {
  label: string
  value: string
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="p-3 border rounded-md bg-card">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  )
}

interface RecommendationCardProps {
  recommendation: string
  priority: "high" | "medium" | "low"
}

function RecommendationCard({ recommendation, priority }: RecommendationCardProps) {
  return (
    <div className="p-4 border rounded-md bg-card">
      <div className="flex items-start gap-3">
        <div className={`mt-1 h-2 w-2 rounded-full ${
          priority === "high" 
            ? "bg-red-500" 
            : priority === "medium" 
            ? "bg-amber-500" 
            : "bg-green-500"
        }`} />
        <div>
          <p className="text-sm">{recommendation}</p>
          <div className="flex items-center mt-2">
            <Badge variant="outline" className={`text-xs ${
              priority === "high" 
                ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400" 
                : priority === "medium" 
                ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400" 
                : "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400"
            }`}>
              {priority === "high" 
                ? "Priorité haute" 
                : priority === "medium" 
                ? "Priorité moyenne" 
                : "Priorité basse"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}

interface TrendCardProps {
  label: string
  trend: string
  icon: React.ReactNode
}

function TrendCard({ label, trend, icon }: TrendCardProps) {
  const isPositive = trend === "croissante" || trend === "forte en hiver"
  const isNegative = trend === "decroissante"
  
  return (
    <div className="p-3 border rounded-md bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="flex items-center gap-2">
        <TrendingUp className={`h-4 w-4 ${
          isPositive 
            ? "text-green-500" 
            : isNegative 
            ? "text-red-500 transform rotate-180" 
            : "text-amber-500"
        }`} />
        <span className="font-medium capitalize">{trend}</span>
      </div>
    </div>
  )
}
