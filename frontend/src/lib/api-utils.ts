/**
 * Utility functions for API data handling
 */

import { VehicleRecord } from '@/types/dashboard';

/**
 * Calculate monthly aggregates from vehicle records
 */
export function calculateMonthlyAggregates(records: VehicleRecord[]) {
  const monthlyData = records.reduce((acc, record) => {
    const month = record.mois;
    if (!acc[month]) {
      acc[month] = {
        month,
        consommation: 0,
        kilometrage: 0,
        produitsTonnes: 0,
        ipe: 0,
        ipeTonne: 0,
        count: 0,
      };
    }
    
    acc[month].consommation += record.consommationL;
    acc[month].kilometrage += record.kilometrage;
    acc[month].produitsTonnes += record.produitsTonnes;
    acc[month].ipe += record.ipeL100km;
    acc[month].ipeTonne += record.ipeL100TonneKm;
    acc[month].count++;
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate averages and convert to array
  return Object.values(monthlyData).map(data => ({
    ...data,
    ipe: data.ipe / data.count,
    ipeTonne: data.ipeTonne / data.count,
  }));
}

/**
 * Calculate vehicle type breakdown
 */
export function calculateVehicleTypeBreakdown(records: VehicleRecord[]) {
  const breakdown = records.reduce((acc, record) => {
    const type = record.type;
    if (!acc[type]) {
      acc[type] = {
        name: type,
        value: 0,
      };
    }
    acc[type].value += record.consommationL;
    return acc;
  }, {} as Record<string, any>);

  return Object.values(breakdown);
}

/**
 * Format number with French locale
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format date to French locale
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
  });
}
