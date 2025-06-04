import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names and Tailwind CSS classes safely
 * Uses clsx for conditional classes and tailwind-merge to handle Tailwind conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number with consistent precision and locale
 */
export function formatNumber(value: number | undefined | null, precision: number = 2): string {
  if (value === undefined || value === null || isNaN(value)) {
    return "N/A"
  }
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  })
}

/**
 * Calculate improvement percentage between actual and reference values
 * Positive value means actual is higher than reference (improvement potential)
 */
export function calculateImprovement(actual: number, reference: number): number {
  if (!actual || !reference || actual === 0) {
    return 0
  }
  return ((actual - reference) / actual) * 100
}

/**
 * Calculate target value based on actual value and improvement goal percentage
 */
export function calculateTarget(actual: number, improvementGoal: number = 3): number {
  if (!actual || actual === 0) {
    return 0
  }
  return actual * (1 - (improvementGoal / 100))
}

/**
 * Format a regression equation with coefficients
 */
export function formatRegressionEquation(
  kilometrageCoef: number,
  tonnageCoef: number,
  intercept: number
): string {
  const formatCoef = (value: number) => value.toLocaleString('fr-FR', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  })

  return `Consommation = ${formatCoef(kilometrageCoef)} × Kilometrage + ${formatCoef(tonnageCoef)} × Tonnage + ${formatCoef(intercept)}`
}

/**
 * Format a date string to a human-readable format
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Date invalide";
  }
}
