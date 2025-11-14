import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { pexelsApiKey } = await request.json()

    if (!pexelsApiKey) {
      return NextResponse.json({ success: false, error: 'Pexels API key required' })
    }

    const response = await fetch(
      'https://api.pexels.com/videos/search?query=luxury+lifestyle&per_page=15&orientation=portrait',
      {
        headers: {
          Authorization: pexelsApiKey
        }
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch from Pexels' })
    }

    const videos = data.videos.map((video: any) => ({
      id: video.id,
      url: video.video_files[0]?.link || '',
      image: video.image,
      duration: video.duration,
      user: {
        name: video.user.name
      }
    }))

    return NextResponse.json({ success: true, videos })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' })
  }
}
