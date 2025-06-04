import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Fetch files from the backend API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/files/history`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    const files = await response.json()
    return NextResponse.json(files)
  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}
