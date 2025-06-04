/**
 * Utility functions for formatting numbers and values in the SER (Situation Énergétique de Référence) module
 */

/**
 * Format a number with high precision without trailing zeros
 * Used for displaying regression metrics with appropriate precision
 */
export const formatPreciseNumber = (num: number | undefined) => {
  if (num === undefined || num === null || isNaN(num)) return "N/A";
  
  // Convert to string and remove trailing zeros
  const str = num.toString();
  
  // Display at least 6 decimal places for precision
  if (str.includes('.')) {
    const [whole, decimal] = str.split('.');
    if (decimal.length < 6) {
      return `${whole}.${decimal.padEnd(6, '0')}`;
    }
    return str;
  }
  
  return `${str}.000000`;
};

/**
 * Format coefficient for display with Excel-equivalent precision (3 decimal places)
 * Used for displaying regression coefficients in a more readable format
 */
export const formatCoefficient = (value: number | undefined) => {
  if (value === undefined || value === null || isNaN(value)) return "N/A";
  // Format with exactly three digits after decimal point as in Excel
  return value.toFixed(3);
};

/**
 * Format percentage values with appropriate precision
 * Used for displaying improvement percentages
 */
export const formatPercentage = (value: number | undefined) => {
  if (value === undefined || value === null || isNaN(value)) return "N/A";
  return `${value.toFixed(1)}%`;
};

/**
 * Format a number as a locale-specific currency string
 * Used for displaying cost values
 */
export const formatCurrency = (value: number | undefined, locale = 'fr-FR', currency = 'TND') => {
  if (value === undefined || value === null || isNaN(value)) return "N/A";
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Format a number with thousands separators
 * Used for displaying large numbers like kilometers or consumption
 */
export const formatNumber = (value: number | undefined, locale = 'fr-FR') => {
  if (value === undefined || value === null || isNaN(value)) return "N/A";
  return new Intl.NumberFormat(locale).format(value);
};
