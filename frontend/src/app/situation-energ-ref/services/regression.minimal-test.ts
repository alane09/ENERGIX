import { performRegression } from "./regression";

// Minimal sample data with loose typing to avoid type errors
const sampleData: any[] = [
  { month: "Mars", kilometrage: 43261.00, tonnage: 1775501.14, consommation: 11577.97 },
  { month: "Décembre", kilometrage: 26880.00, tonnage: 1723230.00, consommation: 6959.56 },
  { month: "Septembre", kilometrage: 43689.00, tonnage: 1773931.39, consommation: 11475.00 },
  { month: "Juillet", kilometrage: 41295.00, tonnage: 1689208.25, consommation: 10877.69 },
  { month: "Juin", kilometrage: 34410.00, tonnage: 1663554.42, consommation: 8076.36 },
  { month: "Octobre", kilometrage: 45681.00, tonnage: 1815822.00, consommation: 11614.40 },
  { month: "Mai", kilometrage: 46850.00, tonnage: 2154503.27, consommation: 12257.57 },
  { month: "Novembre", kilometrage: 39844.00, tonnage: 1758817.86, consommation: 10807.87 },
  { month: "Février", kilometrage: 42271.00, tonnage: 1927385.28, consommation: 11591.84 },
  { month: "Août", kilometrage: 40617.00, tonnage: 1446642.35, consommation: 9496.04 },
  { month: "Avril", kilometrage: 40845.00, tonnage: 1766076.48, consommation: 10548.92 },
  { month: "Janvier", kilometrage: 45376.00, tonnage: 1923750.47, consommation: 11997.92 }
];

// Test multiple regression (CAMION type)
const truckResult = performRegression(sampleData, "CAMION");
console.log("Truck Regression Results:");
console.log("Coefficients:", {
  kilometrage: truckResult.coefficients.kilometrage.toFixed(6),
  tonnage: truckResult.coefficients.tonnage?.toFixed(6),
  intercept: truckResult.intercept.toFixed(6)
});
console.log("R²:", truckResult.rSquared.toFixed(6));
console.log("Adjusted R²:", truckResult.adjustedRSquared.toFixed(6));
console.log("Standard Error:", truckResult.standardError.toFixed(6));
console.log("F-statistic:", truckResult.fStatistic.toFixed(6));
console.log("P-value:", truckResult.significanceF.toFixed(6));

// Test simple regression (VOITURE type)
const carResult = performRegression(sampleData, "VOITURE");
console.log("Car Regression Results (using only kilometrage):");
console.log("Coefficients:", {
  kilometrage: carResult.coefficients.kilometrage.toFixed(6),
  intercept: carResult.intercept.toFixed(6)
});
console.log("R²:", carResult.rSquared.toFixed(6));
console.log("Adjusted R²:", carResult.adjustedRSquared.toFixed(6));
console.log("Standard Error:", carResult.standardError.toFixed(6));
console.log("F-statistic:", carResult.fStatistic.toFixed(6));
console.log("P-value:", carResult.significanceF.toFixed(6));
