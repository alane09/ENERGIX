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
  ipe: number;
  ipeL100km: number;
  ipeL100TonneKm?: number;
  predictedIpeL100TonneKm?: number;
  // New IPE_SER fields
  ipe_ser_L100km: number;
  ipe_ser_L100TonneKm?: number;
  matricule?: string;
  vehicleType?: string;
}

export interface VehicleData {
  id: string; // Unique identifier from backend
  month: string;
  matricule: string;    // Vehicle ID
  kilometrage: number;  // Distance traveled
  consommation: number; // Actual consumption in L
  tonnage: number;      // Only relevant for CAMION
  ipeL100km: number;    // IPE (L/100km) 
  ipeL100TonneKm: number | null; // IPE (L/100km.Tonne) - only for CAMION
  referenceConsommation: number; // Reference consumption from regression equation
  ipe_ser_L100km: number;        // IPE_SER (L/100km)
  ipe_ser_L100TonneKm: number | null; // IPE_SER (L/100km.Tonne) - only for CAMION
  vehicleType: "VOITURE" | "CAMION";
  year: string;
  region: string;
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
