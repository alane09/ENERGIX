import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get backend API URL from environment variables or use default
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8080/api';

    // Forward request to backend API
    const response = await fetch(`${backendUrl}/config/vehicle-types`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If backend is not available, return default configuration
      if (response.status === 404 || response.status === 500) {
        return NextResponse.json({
          vehicleTypes: ["CAMION", "VOITURE", "CHARIOT"],
          regions: ["Tunis", "MJEZ ELBEB"]
        }, { status: 200 });
      }
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    // Forward the backend response
    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching vehicle configuration:', error);
    // Return default configuration as fallback
    return NextResponse.json({
      vehicleTypes: ["CAMION", "VOITURE", "CHARIOT"],
      regions: ["Tunis", "MJEZ ELBEB"]
    }, { status: 200 });
  }
}
