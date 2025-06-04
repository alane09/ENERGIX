import { NextResponse } from 'next/server';

// Define the vehicle interface
interface Vehicle {
  type: string;
  matricule: string;
  region?: string;
  [key: string]: any; // Allow other properties
}

export async function GET() {
  try {
    // Get backend API URL from environment variables or use default
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8080/api';
    
    // Use the correct endpoint from VehicleController
    const response = await fetch(`${backendUrl}/records`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store' // Prevent caching to always get fresh data
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    
    // Process the response to extract unique vehicles with their types
    const allRecords = await response.json();
    
    // Create a map to store unique vehicles by matricule
    const uniqueVehiclesMap = new Map<string, Vehicle>();
    
    // Process records to extract unique vehicles
    allRecords.forEach((record: any) => {
      const matricule = record.matricule;
      if (matricule && !uniqueVehiclesMap.has(matricule)) {
        uniqueVehiclesMap.set(matricule, {
          matricule: matricule,
          type: record.type || 'CAMION',
          region: record.region || 'Tunis'
        });
      }
    });
    
    // Convert map to array of vehicles
    const uniqueVehicles = Array.from(uniqueVehiclesMap.values());
    
    return NextResponse.json(uniqueVehicles, { status: 200 });  } catch (error) {
    console.error('Error fetching vehicle matricules:', error);
    // Return empty array instead of error to allow frontend to continue
    return NextResponse.json([], { status: 200 });
  }
}
