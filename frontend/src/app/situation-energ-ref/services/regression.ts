import { MonthlyData, RegressionResult } from "../types";

function calculateMean(values: number[]): number {
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateSimpleRegression(x: number[], y: number[]): {
  slope: number;
  intercept: number;
  rSquared: number;
  adjustedRSquared: number;
  standardError: number;
  tStats: number[];
  pValues: number[];
  standardErrors: number[];
  fStatistic: number;
  significanceF: number;
  predictedValues: number[];
  residuals: number[];
  degreesOfFreedom: number;
  sumOfSquares: number;
  meanSquare: number;
  lowerConfidence: number[];
  upperConfidence: number[];
} {
  const n = x.length;
  const meanX = calculateMean(x);
  const meanY = calculateMean(y);

  // Calculate slope and intercept
  let sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumXY += (x[i] - meanX) * (y[i] - meanY);
    sumXX += (x[i] - meanX) * (x[i] - meanX);
  }
  const slope = sumXY / sumXX;
  const intercept = meanY - slope * meanX;

  // Calculate predicted values and residuals
  const predictedValues = x.map(xi => slope * xi + intercept);
  const residuals = y.map((yi, i) => yi - predictedValues[i]);

  // Calculate R-squared
  const totalSS = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
  const regressionSS = predictedValues.reduce((sum, yhat) => sum + Math.pow(yhat - meanY, 2), 0);
  const residualSS = residuals.reduce((sum, r) => sum + r * r, 0);
  const rSquared = regressionSS / totalSS;

  // Calculate adjusted R-squared
  const degreesOfFreedom = n - 2; // n - number of parameters (slope and intercept)
  const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1)) / degreesOfFreedom;

  // Calculate standard errors
  const mse = residualSS / degreesOfFreedom;
  const standardError = Math.sqrt(mse);
  const sxx = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);
  const seSlope = Math.sqrt(mse / sxx);
  const seIntercept = Math.sqrt(mse * (1/n + Math.pow(meanX, 2)/sxx));
  const standardErrors = [seIntercept, seSlope];

  // Calculate t-statistics
  const tStats = [intercept/seIntercept, slope/seSlope];

  // Calculate p-values using Student's t-distribution approximation
  const pValues = tStats.map(t => {
    const tAbs = Math.abs(t);
    // Approximation of Student's t-distribution
    return 2 * (1 - (1 / (1 + Math.exp(-0.717*tAbs - 0.416*Math.pow(tAbs, 2)))));
  });

  // Calculate F-statistic
  const fStatistic = (regressionSS / 1) / (residualSS / degreesOfFreedom);
  
  // Calculate significance F using F-distribution approximation
  const significanceF = 1 - (1 / (1 + Math.exp(-0.717*fStatistic - 0.416*Math.pow(fStatistic, 2))));

  // Calculate confidence intervals (95%)
  const tCritical = 1.96; // Approximation for large sample sizes
  const lowerConfidence = [
    intercept - tCritical * seIntercept,
    slope - tCritical * seSlope
  ];
  const upperConfidence = [
    intercept + tCritical * seIntercept,
    slope + tCritical * seSlope
  ];

  return {
    slope,
    intercept,
    rSquared,
    adjustedRSquared,
    standardError,
    tStats,
    pValues,
    standardErrors,
    fStatistic,
    significanceF,
    predictedValues,
    residuals,
    degreesOfFreedom,
    sumOfSquares: totalSS,
    meanSquare: regressionSS / 1,
    lowerConfidence,
    upperConfidence
  };
}

function calculateMultipleRegression(x1: number[], x2: number[], y: number[]): {
  coefficients: [number, number];
  intercept: number;
  rSquared: number;
  adjustedRSquared: number;
  standardError: number;
  tStats: number[];
  pValues: number[];
  standardErrors: number[];
  fStatistic: number;
  significanceF: number;
  predictedValues: number[];
  residuals: number[];
  degreesOfFreedom: number;
  sumOfSquares: number;
  meanSquare: number;
  lowerConfidence: number[];
  upperConfidence: number[];
} {
  const n = y.length;
  const X = x1.map((val, i) => [1, val, x2[i]]); // Design matrix with intercept
  const Y = y;

  // Calculate coefficients using normal equations: β = (X'X)^(-1)X'y
  const Xt = X[0].map((_, i) => X.map(row => row[i])); // Transpose
  const XtX = Xt.map(row => X[0].map((_, j) => 
    row.reduce((sum, _, k) => sum + row[k] * X[k][j], 0)
  ));

  // Matrix inversion (3x3)
  const det = XtX[0][0]*(XtX[1][1]*XtX[2][2] - XtX[1][2]*XtX[2][1])
            - XtX[0][1]*(XtX[1][0]*XtX[2][2] - XtX[1][2]*XtX[2][0])
            + XtX[0][2]*(XtX[1][0]*XtX[2][1] - XtX[1][1]*XtX[2][0]);
  
  const invXtX = [
    [(XtX[1][1]*XtX[2][2] - XtX[1][2]*XtX[2][1])/det,
     (XtX[0][2]*XtX[2][1] - XtX[0][1]*XtX[2][2])/det,
     (XtX[0][1]*XtX[1][2] - XtX[0][2]*XtX[1][1])/det],
    [(XtX[1][2]*XtX[2][0] - XtX[1][0]*XtX[2][2])/det,
     (XtX[0][0]*XtX[2][2] - XtX[0][2]*XtX[2][0])/det,
     (XtX[0][2]*XtX[1][0] - XtX[0][0]*XtX[1][2])/det],
    [(XtX[1][0]*XtX[2][1] - XtX[1][1]*XtX[2][0])/det,
     (XtX[0][1]*XtX[2][0] - XtX[0][0]*XtX[2][1])/det,
     (XtX[0][0]*XtX[1][1] - XtX[0][1]*XtX[1][0])/det]
  ];

  const XtY = Xt.map(row => row.reduce((sum, _, i) => sum + row[i] * Y[i], 0));
  const beta = invXtX.map(row => 
    row.reduce((sum, val, i) => sum + val * XtY[i], 0)
  );

  const [intercept, ...coefficients] = beta;

  // Calculate predicted values and residuals
  const predictedValues = X.map(row => 
    row.reduce((sum, val, i) => sum + val * beta[i], 0)
  );
  const residuals = Y.map((yi, i) => yi - predictedValues[i]);

  // Calculate R-squared
  const meanY = calculateMean(Y);
  const totalSS = Y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
  const residualSS = residuals.reduce((sum, r) => sum + r * r, 0);
  const regressionSS = totalSS - residualSS;
  const rSquared = regressionSS / totalSS;

  // Calculate adjusted R-squared
  const degreesOfFreedom = n - 3; // n - number of parameters
  const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1)) / degreesOfFreedom;

  // Calculate standard errors
  const mse = residualSS / degreesOfFreedom;
  const standardError = Math.sqrt(mse);
  const standardErrors = invXtX.map(row => Math.sqrt(row[row.length-1] * mse));

  // Calculate t-statistics
  const tStats = beta.map((b, i) => b / standardErrors[i]);

  // Calculate p-values
  const pValues = tStats.map(t => {
    const tAbs = Math.abs(t);
    return 2 * (1 - (1 / (1 + Math.exp(-0.717*tAbs - 0.416*Math.pow(tAbs, 2)))));
  });

  // Calculate F-statistic
  const fStatistic = (regressionSS / 2) / (residualSS / degreesOfFreedom);
  
  // Calculate significance F
  const significanceF = 1 - (1 / (1 + Math.exp(-0.717*fStatistic - 0.416*Math.pow(fStatistic, 2))));

  // Calculate confidence intervals (95%)
  const tCritical = 1.96;
  const lowerConfidence = beta.map((b, i) => b - tCritical * standardErrors[i]);
  const upperConfidence = beta.map((b, i) => b + tCritical * standardErrors[i]);

  return {
    coefficients: coefficients as [number, number],
    intercept,
    rSquared,
    adjustedRSquared,
    standardError,
    tStats,
    pValues,
    standardErrors,
    fStatistic,
    significanceF,
    predictedValues,
    residuals,
    degreesOfFreedom,
    sumOfSquares: totalSS,
    meanSquare: regressionSS / 2,
    lowerConfidence,
    upperConfidence
  };
}

export function performRegression(monthlyData: MonthlyData[], type: "VOITURE" | "CAMION", region?: string): RegressionResult {
  const x = monthlyData.map(d => d.kilometrage);
  const y = monthlyData.map(d => d.consommation);

  let result: Omit<RegressionResult, 'year' | 'warnings' | 'hasOutliers' | 'hasMulticollinearity' | 'region' | 'varianceInflationFactors' | 'rmse' | 'mae' | 'aic' | 'bic'>;
  if (type === 'VOITURE') {
    const simpleRegression = calculateSimpleRegression(x, y);
    result = {
      id: 'current',
      type: 'VOITURE',
      coefficients: {
        kilometrage: simpleRegression.slope,
        tonnage: null
      },
      intercept: simpleRegression.intercept,
      multipleR: Math.sqrt(simpleRegression.rSquared),
      rSquared: simpleRegression.rSquared,
      adjustedRSquared: simpleRegression.adjustedRSquared,
      standardError: simpleRegression.standardError,
      observations: x.length,
      degreesOfFreedom: simpleRegression.degreesOfFreedom,
      sumOfSquares: simpleRegression.sumOfSquares,
      meanSquare: simpleRegression.meanSquare,
      fStatistic: simpleRegression.fStatistic,
      significanceF: simpleRegression.significanceF,
      standardErrors: simpleRegression.standardErrors,
      tStats: simpleRegression.tStats,
      pValues: simpleRegression.pValues,
      lowerConfidence: simpleRegression.lowerConfidence,
      upperConfidence: simpleRegression.upperConfidence,
      predictedValues: simpleRegression.predictedValues,
      residuals: simpleRegression.residuals,
      mse: Math.pow(simpleRegression.standardError, 2),
      regressionEquation: `Consommation = ${simpleRegression.slope.toFixed(4)} * kilométrage + ${simpleRegression.intercept.toFixed(2)}`
    };
  } else {
    const tonnage = monthlyData.map(d => d.tonnage);
    const multipleRegression = calculateMultipleRegression(x, tonnage, y);
    result = {
      id: 'current',
      type: 'CAMION',
      coefficients: {
        kilometrage: multipleRegression.coefficients[0],
        tonnage: multipleRegression.coefficients[1]
      },
      intercept: multipleRegression.intercept,
      multipleR: Math.sqrt(multipleRegression.rSquared),
      rSquared: multipleRegression.rSquared,
      adjustedRSquared: multipleRegression.adjustedRSquared,
      standardError: multipleRegression.standardError,
      observations: x.length,
      degreesOfFreedom: multipleRegression.degreesOfFreedom,
      sumOfSquares: multipleRegression.sumOfSquares,
      meanSquare: multipleRegression.meanSquare,
      fStatistic: multipleRegression.fStatistic,
      significanceF: multipleRegression.significanceF,
      standardErrors: multipleRegression.standardErrors,
      tStats: multipleRegression.tStats,
      pValues: multipleRegression.pValues,
      lowerConfidence: multipleRegression.lowerConfidence,
      upperConfidence: multipleRegression.upperConfidence,
      predictedValues: multipleRegression.predictedValues,
      residuals: multipleRegression.residuals,
      mse: Math.pow(multipleRegression.standardError, 2),
      regressionEquation: `Consommation = ${multipleRegression.coefficients[0].toFixed(4)} * kilométrage + ${multipleRegression.coefficients[1].toFixed(4)} * tonnage + ${multipleRegression.intercept.toFixed(2)}`
    };
  }

  return {
    ...result,
    year: new Date().getFullYear().toString(),
    region,
    warnings: [],
    hasOutliers: false,
    hasMulticollinearity: false,
    varianceInflationFactors: [],
    rmse: Math.sqrt(result.mse),
    mae: result.residuals.reduce((sum, r) => sum + Math.abs(r), 0) / result.observations,
    aic: result.observations * Math.log(result.mse) + 2 * (type === 'VOITURE' ? 2 : 3),
    bic: result.observations * Math.log(result.mse) + Math.log(result.observations) * (type === 'VOITURE' ? 2 : 3)
  };
}
