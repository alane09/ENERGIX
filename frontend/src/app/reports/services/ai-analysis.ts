import { ConsumptionData } from "@/types/report"

export interface AIAnalysisResult {
  trends: {
    description: string
    significance: number
    direction: 'increasing' | 'decreasing' | 'stable'
  }[]
  anomalies: {
    timestamp: string
    metric: string
    value: number
    expectedValue: number
    severity: 'low' | 'medium' | 'high'
  }[]
  recommendations: {
    category: 'consumption' | 'cost' | 'efficiency' | 'maintenance'
    priority: 'high' | 'medium' | 'low'
    description: string
    potentialImpact: string
    actionItems: string[]
  }[]
  predictions: {
    metric: string
    value: number
    confidence: number
    timestamp: string
  }[]
  summary: {
    overallHealth: number // 0-100
    keyFindings: string[]
    riskAreas: string[]
    opportunities: string[]
  }
}

export class AIAnalysisService {
  static async analyzeConsumptionTrends(data: ConsumptionData[]): Promise<AIAnalysisResult> {
    // Calculate basic statistics
    const values = data.map(d => d.consumption)
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length)

    // Detect trends
    const trends = this.detectTrends(data)
    
    // Find anomalies
    const anomalies = this.detectAnomalies(data, mean, stdDev)
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(data, trends, anomalies)
    
    // Make predictions
    const predictions = this.makePredictions(data)

    return {
      trends,
      anomalies,
      recommendations,
      predictions,
      summary: this.generateSummary(trends, anomalies, recommendations)
    }
  }

  private static detectTrends(data: ConsumptionData[]) {
    const trends: AIAnalysisResult['trends'] = []
    
    // Calculate moving averages
    const movingAvg = this.calculateMovingAverage(data.map(d => d.consumption), 3)
    
    // Detect overall trend
    const firstHalf = movingAvg.slice(0, Math.floor(movingAvg.length / 2))
    const secondHalf = movingAvg.slice(Math.floor(movingAvg.length / 2))
    const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    
    const trendDiff = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
    
    trends.push({
      description: `Consommation ${Math.abs(trendDiff).toFixed(1)}% ${trendDiff > 0 ? 'plus élevée' : 'plus basse'} dans la deuxième moitié de la période`,
      significance: Math.abs(trendDiff) / 10, // Scale to 0-1
      direction: trendDiff > 0 ? 'increasing' : trendDiff < 0 ? 'decreasing' : 'stable'
    })

    return trends
  }

  private static detectAnomalies(data: ConsumptionData[], mean: number, stdDev: number) {
    const anomalies: AIAnalysisResult['anomalies'] = []
    const threshold = 2 // Number of standard deviations for anomaly

    data.forEach(d => {
      const zScore = Math.abs(d.consumption - mean) / stdDev
      if (zScore > threshold) {
        anomalies.push({
          timestamp: d.date,
          metric: 'consumption',
          value: d.consumption,
          expectedValue: mean,
          severity: zScore > 3 ? 'high' : zScore > 2.5 ? 'medium' : 'low'
        })
      }
    })

    return anomalies
  }

  private static generateRecommendations(
    data: ConsumptionData[],
    trends: AIAnalysisResult['trends'],
    anomalies: AIAnalysisResult['anomalies']
  ) {
    const recommendations: AIAnalysisResult['recommendations'] = []

    // Check for increasing consumption trend
    if (trends.some(t => t.direction === 'increasing')) {
      recommendations.push({
        category: 'consumption',
        priority: 'high',
        description: 'Tendance à la hausse de la consommation détectée',
        potentialImpact: 'Réduction potentielle de 10-15% des coûts de carburant',
        actionItems: [
          'Analyser les habitudes de conduite',
          'Vérifier l\'état des véhicules',
          'Optimiser les itinéraires'
        ]
      })
    }

    // Check for frequent anomalies
    if (anomalies.length > data.length * 0.1) {
      recommendations.push({
        category: 'efficiency',
        priority: 'medium',
        description: 'Variations importantes de consommation détectées',
        potentialImpact: 'Amélioration possible de 5-8% de l\'efficacité',
        actionItems: [
          'Standardiser les procédures de conduite',
          'Former les conducteurs aux meilleures pratiques',
          'Mettre en place un système de suivi en temps réel'
        ]
      })
    }

    return recommendations
  }

  private static makePredictions(data: ConsumptionData[]) {
    const predictions: AIAnalysisResult['predictions'] = []

    // Defensive: Ensure data is not empty and last element has a valid date
    if (!data.length || !data[data.length - 1] || !data[data.length - 1].date) {
      return predictions
    }

    // Simple linear regression for prediction
    const n = data.length
    const x = Array.from({ length: n }, (_, i) => i)
    const y = data.map(d => d.consumption)

    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((a, b, i) => a + b * y[i], 0)
    const sumXX = x.reduce((a, b) => a + b * b, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Predict next 3 periods
    for (let i = 1; i <= 3; i++) {
      const predictedValue = slope * (n + i) + intercept
      predictions.push({
        metric: 'consumption',
        value: predictedValue,
        confidence: 0.8 - (i * 0.1), // Decreasing confidence for further predictions
        timestamp: new Date(new Date(data[data.length - 1].date).getTime() + i * 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    }

    return predictions
  }

  private static generateSummary(
    trends: AIAnalysisResult['trends'],
    anomalies: AIAnalysisResult['anomalies'],
    recommendations: AIAnalysisResult['recommendations']
  ) {
    // Calculate overall health score
    const healthFactors = {
      trends: trends.every(t => t.direction !== 'increasing') ? 40 : 20,
      anomalies: Math.max(0, 30 - anomalies.length * 5),
      recommendations: Math.max(0, 30 - recommendations.length * 5)
    }
    
    const overallHealth = Object.values(healthFactors).reduce((a, b) => a + b, 0)

    return {
      overallHealth,
      keyFindings: [
        ...trends.map(t => t.description),
        `${anomalies.length} anomalies détectées`,
        `${recommendations.length} recommandations d'amélioration`
      ],
      riskAreas: [
        ...anomalies.filter(a => a.severity === 'high').map(a => 
          `Consommation anormale le ${new Date(a.timestamp).toLocaleDateString('fr-FR')}`
        )
      ],
      opportunities: recommendations.map(r => r.description)
    }
  }

  private static calculateMovingAverage(values: number[], window: number) {
    const result = []
    for (let i = 0; i <= values.length - window; i++) {
      const avg = values.slice(i, i + window).reduce((a, b) => a + b, 0) / window
      result.push(avg)
    }
    return result
  }
}
