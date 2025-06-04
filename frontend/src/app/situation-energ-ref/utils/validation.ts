import { MonthlyData } from "../types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateRegressionData(data: MonthlyData[]): ValidationResult {
  const errors: string[] = [];

  // Check if we have enough data points
  if (data.length < 3) {
    errors.push("At least 3 data points are required for regression analysis");
    return { isValid: false, errors };
  }

  // Check for missing or invalid values
  data.forEach((point, index) => {
    if (isNaN(point.kilometrage) || point.kilometrage < 0) {
      errors.push(`Invalid kilometrage value at index ${index}`);
    }
    if (isNaN(point.consommation) || point.consommation < 0) {
      errors.push(`Invalid consommation value at index ${index}`);
    }
    if (isNaN(point.tonnage) || point.tonnage < 0) {
      errors.push(`Invalid tonnage value at index ${index}`);
    }
  });

  // Check for zero variance in dependent variable
  const consommationValues = data.map(d => d.consommation);
  const consommationMean = consommationValues.reduce((a, b) => a + b, 0) / consommationValues.length;
  const consommationVariance = consommationValues.reduce((a, b) => a + Math.pow(b - consommationMean, 2), 0);
  
  if (consommationVariance === 0) {
    errors.push("No variance in consumption values - cannot perform regression");
  }

  // Check for zero variance in independent variables
  const kilometrageValues = data.map(d => d.kilometrage);
  const kilometrageMean = kilometrageValues.reduce((a, b) => a + b, 0) / kilometrageValues.length;
  const kilometrageVariance = kilometrageValues.reduce((a, b) => a + Math.pow(b - kilometrageMean, 2), 0);
  
  if (kilometrageVariance === 0) {
    errors.push("No variance in kilometrage values - cannot perform regression");
  }

  const tonnageValues = data.map(d => d.tonnage);
  const tonnageMean = tonnageValues.reduce((a, b) => a + b, 0) / tonnageValues.length;
  const tonnageVariance = tonnageValues.reduce((a, b) => a + Math.pow(b - tonnageMean, 2), 0);
  
  if (tonnageVariance === 0) {
    errors.push("No variance in tonnage values - cannot perform regression");
  }

  // Check for perfect multicollinearity
  const correlation = calculateCorrelation(kilometrageValues, tonnageValues);
  if (Math.abs(correlation) > 0.9999) {
    errors.push("Perfect multicollinearity detected between kilometrage and tonnage");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let xDenominator = 0;
  let yDenominator = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - xMean;
    const yDiff = y[i] - yMean;
    numerator += xDiff * yDiff;
    xDenominator += xDiff * xDiff;
    yDenominator += yDiff * yDiff;
  }
  
  return numerator / Math.sqrt(xDenominator * yDenominator);
}

export function validateRegressionResult(
  result: { rSquared: number; significanceF: number; pValues: number[] }
): ValidationResult {
  const errors: string[] = [];

  // Check R-squared
  if (result.rSquared < 0 || result.rSquared > 1) {
    errors.push("Invalid R-squared value - must be between 0 and 1");
  }

  // Check significance
  if (result.significanceF > 0.05) {
    errors.push("Model is not statistically significant (p > 0.05)");
  }

  // Check coefficient p-values
  result.pValues.forEach((p, i) => {
    if (p > 0.05) {
      errors.push(`Coefficient ${i} is not statistically significant (p > 0.05)`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}
