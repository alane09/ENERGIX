// Use relative URLs for API calls to leverage Next.js proxy
export const API_BASE_URL = '/api';

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  endpoints: {
    records: '/records',
    monthlyAggregation: '/records/monthly-aggregation',
    regression: '/regression/analyze'
  }
};

export const APP_CONFIG = {
  regions: ["Tunis", "Mjez el beb"],
  vehicleTypes: ["VOITURE", "CAMION"] as const,
  defaultYear: new Date().getFullYear().toString()
};
