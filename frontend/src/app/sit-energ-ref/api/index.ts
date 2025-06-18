'use client';

import { MonthlyData, Region, RegressionData, VehicleDetails, VehicleType } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

async function fetchWithTimeout<T>(url: string, options: RequestInit = {}, timeout = 5000): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    clearTimeout(id);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error) {
      throw new Error(`API Error: ${error.message}`);
    }
    throw new Error('Unknown API error occurred');
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isString(value: any): value is string {
  return typeof value === 'string';
}

export async function fetchRegressionData(
  vehicleType: VehicleType,
  year: string,
  region: Region
): Promise<RegressionData> {
  try {
    return await fetchWithTimeout<RegressionData>(
      `${API_BASE_URL}/regression/search?type=${vehicleType}&year=${year}${region !== 'all' ? `&region=${region}` : ''}`
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      // If 404, try to analyze and save new regression
      return await performRegressionAnalysis(vehicleType, year, region);
    }
    throw error;
  }
}

export async function fetchVehicleDetails(
  vehicleType: VehicleType,
  year: string,
  region: Region
): Promise<VehicleDetails[]> {
  return fetchWithTimeout<VehicleDetails[]>(
    `${API_BASE_URL}/records?type=${vehicleType}&year=${year}${region ? `&region=${region}` : ''}`
  );
}

export async function fetchMonthlyData(
  vehicleType: VehicleType,
  year: string,
  region: Region
): Promise<MonthlyData[]> {
  try {
    return await fetchWithTimeout<MonthlyData[]>(
      `${API_BASE_URL}/regression/monthly-data?vehicleType=${vehicleType}&year=${year}${region !== 'all' ? `&region=${region}` : ''}`
    );
  } catch (error) {
    // If we get a 404, return an empty array rather than throwing
    if (error instanceof Error && error.message.includes('404')) {
      return [];
    }
    throw error;
  }
}

export async function performRegressionAnalysis(
  vehicleType: VehicleType,
  year: string,
  region: Region
): Promise<RegressionData> {
  return fetchWithTimeout<RegressionData>(
    `${API_BASE_URL}/regression/analyze?vehicleType=${vehicleType}&year=${year}${region ? `&region=${region}` : ''}`,
    { method: 'POST' }
  );
}

export async function getMonthlyAggregation(
  vehicleType: VehicleType,
  year: string,
  region: Region
): Promise<MonthlyData[]> {
  return fetchWithTimeout<MonthlyData[]>(
    `${API_BASE_URL}/records/monthly-aggregation?vehicleType=${vehicleType}&year=${year}${region !== 'all' ? `&region=${region}` : ''}`
  );
}
