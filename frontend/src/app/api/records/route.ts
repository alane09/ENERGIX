import { NextRequest, NextResponse } from 'next/server';

// Define the vehicle record interface
interface VehicleRecord {
  id?: string;
  type: string;
  matricule: string;
  mois: string;
  year: string;
  region: string;
  consommationL: number;
  consommationTEP?: number;
  coutDT?: number;
  kilometrage?: number;
  produitsTonnes?: number;
  ipeL100km?: number;
  ipeL100TonneKm?: number;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    // Get backend API URL from environment variables or use default
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8080';
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // Forward request to backend API
    const response = await fetch(`${backendUrl}/api/records${queryString ? '?' + queryString : ''}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store' // Prevent caching to always get fresh data
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    
    const records: VehicleRecord[] = await response.json();
    
    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    console.error('Error fetching vehicle records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle records from database' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get backend API URL from environment variables or use default
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8080';
    
    // Get the request body
    const records: VehicleRecord[] = await request.json();
    
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected array of vehicle records.' },
        { status: 400 }
      );
    }

    // Save each record individually to the backend
    const savedRecords: VehicleRecord[] = [];
    const errors: string[] = [];

    for (const record of records) {
      try {
        const response = await fetch(`${backendUrl}/api/records`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(record),
        });

        if (!response.ok) {
          const errorText = await response.text();
          errors.push(`Failed to save record for ${record.matricule}: ${errorText}`);
          continue;
        }

        const savedRecord: VehicleRecord = await response.json();
        savedRecords.push(savedRecord);
      } catch (error) {
        errors.push(`Error saving record for ${record.matricule}: ${error}`);
      }
    }

    if (errors.length > 0 && savedRecords.length === 0) {
      // All records failed to save
      return NextResponse.json(
        { 
          error: 'Failed to save any records',
          details: errors
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      savedCount: savedRecords.length,
      totalCount: records.length,
      records: savedRecords,
      errors: errors.length > 0 ? errors : undefined
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving vehicle records:', error);
    return NextResponse.json(
      { error: 'Failed to save vehicle records' },
      { status: 500 }
    );
  }
}
