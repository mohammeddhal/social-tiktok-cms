import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  const filename = req.nextUrl.searchParams.get('filename') || 'video.mp4'

  if (!url) {
    return new NextResponse('Missing URL', { status: 400 })
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`)
    }

    // Pass through the response body and set Content-Disposition
    const headers = new Headers(response.headers)
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    headers.set('Content-Type', 'application/octet-stream')
    
    return new NextResponse(response.body, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Download error:', error)
    return new NextResponse('Error downloading file', { status: 500 })
  }
}
