import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/files/${fileId}/download`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      }
    )

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    const file = await response.blob()
    return new NextResponse(file, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Disposition': response.headers.get('Content-Disposition') || 'attachment',
      },
    })
  } catch (error) {
    console.error('Error downloading file:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/files/${fileId}/delete`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      }
    )

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
