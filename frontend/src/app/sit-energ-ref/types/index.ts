export interface MonthlyData {
  month: string;
  year?: string;
  region?: string;
  kilometrage: number; // total kilometrage
  consommation: number; // total consommation
  produitsTonnes: number; // total tonnage
  ipeL100km: number; // average IPE
  count: number; // vehicle count
  // Calculated fields
  totalKilometrage?: number;
  totalConsommation?: number;
  totalTonnage?: number;
  averageIpe?: number;
  averageIpeSer?: number;
  vehicleCount?: number;
  averageConsommation?: number;
  averageKilometrage?: number;
  referenceConsommation?: number;
  targetConsommation?: number;
  improvementPercentage?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  success: boolean;
}

export interface VehicleDetails extends VehicleData {}

export type VehicleType = 'CAMION' | 'VOITURE'| 'all';
export type Region = 'Tunis' | 'Mjezelbeb' | 'all';

export interface VehicleData {
  id: string;
  type: string;
  matricule: string;
  mois: string;
  year: string;
  region: string;
  consommationL: number;
  consommationTEP: number;
  coutDT: number;
  kilometrage: number;
  produitsTonnes: number;
  ipeL100km: number;
  ipeL100TonneKm: number;
  ipeSerL100km?: number;
  ipeSerL100TonneKm?: number;
  predictedIpe?: number;
}

export interface RegressionCoefficients {
  kilometrage: number;
  tonnage?: number;
  [key: string]: number | undefined;
}

export interface RegressionData {
  id: string;
  type: string;
  regressionEquation: string;
  coefficients: RegressionCoefficients;
  intercept: number;
  
  // Validation Results
  warnings: string[];
  hasOutliers: boolean;
  hasMulticollinearity: boolean;
  varianceInflationFactors: number[];
  
  // Regression Statistics
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
  
  // ANOVA
  degreesOfFreedom: number;
  sumOfSquares: number;
  meanSquare: number;
  fStatistic: number;
  significanceF: number;
  
  // Coefficient Statistics
  standardErrors: number[];
  tStats: number[];
  pValues: number[];
  lowerConfidence: number[];
  upperConfidence: number[];
  
  // Residual Output
  predictedValues: number[];
  residuals: number[];
  
  // Additional fields
  year: string;
  vehicleType: string;
  region?: string;
}
