export interface MonthlyData {
  month: string;
  year?: string;
  region?: string;
  kilometrage: number;
  consommation: number;
  tonnage: number;
  referenceConsommation: number;
  targetConsommation: number;
  improvementPercentage: number;
  ipeL100km: number;
  ipeL100TonneKm?: number;
  predictedIpeL100TonneKm?: number;
  matricule?: string;
  vehicleType?: string;
}

export interface ChartData {
  kilometrageScatter: {
    points: Array<{ x: number; y: number }>;
    regressionLine: Array<{ x: number; y: number }>;
    name: string;
  };
  tonnageScatter: {
    points: Array<{ x: number; y: number }>;
    regressionLine: Array<{ x: number; y: number }>;
    name: string;
  };
  monthlyTrends: Array<{
    month: string;
    "Consommation actuelle": number;
    "Consommation de référence": number;
    "Consommation cible": number;
    "Amélioration (%)": number;
    "IPE (L/100km)": number;
    "Distance parcourue (km)": number;
    region?: string;
  }>;
}

export interface OverviewData {
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
  standardErrors: number[];
  tStats: number[];
  pValues: number[];
  lowerConfidence: number[];
  upperConfidence: number[];
  predictedValues: number[];
  residuals: number[];
  equation: string;
}

export interface RegressionResult {
  id: string;
  type: string;
  regressionEquation: string;
  coefficients: {
    kilometrage: number;
    tonnage: number | null;
  };
  intercept: number;
  warnings: string[];
  hasOutliers: boolean;
  hasMulticollinearity: boolean;
  varianceInflationFactors: number[];
  multipleR: number;
  rSquared: number;
  adjustedRSquared: number;
  standardError: number;
  observations: number;
  mse: number;
  rmse: number;
  mae: number;
  aic: number;
  bic: number;
  degreesOfFreedom: number;
  sumOfSquares: number;
  meanSquare: number;
  fStatistic: number;
  significanceF: number;
  standardErrors: number[];
  tStats: number[];
  pValues: number[];
  lowerConfidence: number[];
  upperConfidence: number[];
  predictedValues: number[];
  residuals: number[];
  year?: string;
  region?: string;
}
