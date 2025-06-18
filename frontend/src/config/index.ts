export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  ENDPOINTS: {
    MONTHLY_DATA: '/api/monthly-data',
    RESULTS: '/api/results',
    ANALYZE: '/api/analyze'
  }
} as const;

export const APP_CONFIG = {
  DEFAULT_YEAR: '2024',
  DEFAULT_VEHICLE_TYPE: 'VOITURE',
  REGIONS: ['Tunis', 'Mjez el beb'] as const,
  VEHICLE_TYPES: ['VOITURE', 'CAMION'] as const,
  MONTHS: [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ] as const
} as const; 