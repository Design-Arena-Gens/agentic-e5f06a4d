import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const STORAGE_FILE = path.join(process.cwd(), 'scheduled-posts.json')

interface ScheduledPost {
  id: string
  video: any
  scheduledFor: string
  status: 'pending' | 'posted' | 'failed'
  instagramAccessToken: string
  instagramUserId: string
}

function loadScheduledPosts(): ScheduledPost[] {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading scheduled posts:', error)
  }
  return []
}

function saveScheduledPosts(posts: ScheduledPost[]) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(posts, null, 2))
  } catch (error) {
    console.error('Error saving scheduled posts:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pexelsApiKey, instagramAccessToken, instagramUserId } = await request.json()

    if (!pexelsApiKey || !instagramAccessToken || !instagramUserId) {
      return NextResponse.json({ success: false, error: 'Missing required credentials' })
    }

    // Fetch luxury lifestyle videos from Pexels
    const pexelsResponse = await fetch(
      'https://api.pexels.com/videos/search?query=luxury+lifestyle&per_page=30&orientation=portrait',
      {
        headers: {
          Authorization: pexelsApiKey
        }
      }
    )

    const pexelsData = await pexelsResponse.json()

    if (!pexelsResponse.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch from Pexels' })
    }

    const videos = pexelsData.videos.map((video: any) => ({
      id: video.id,
      url: video.video_files[0]?.link || '',
      image: video.image,
      duration: video.duration,
      user: {
        name: video.user.name
      }
    }))

    // Load existing posts
    const existingPosts = loadScheduledPosts()

    // Create scheduled posts for next 7 days
    const newPosts: ScheduledPost[] = []
    const startDate = new Date()

    for (let i = 0; i < Math.min(videos.length, 7); i++) {
      const scheduledFor = new Date(startDate)
      scheduledFor.setDate(scheduledFor.getDate() + i + 1)
      scheduledFor.setHours(10, 0, 0, 0) // Schedule for 10 AM daily

      const post: ScheduledPost = {
        id: `post_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        video: videos[i],
        scheduledFor: scheduledFor.toISOString(),
        status: 'pending',
        instagramAccessToken,
        instagramUserId
      }

      newPosts.push(post)
    }

    // Save all posts
    const allPosts = [...existingPosts, ...newPosts]
    saveScheduledPosts(allPosts)

    return NextResponse.json({
      success: true,
      message: `Scheduled ${newPosts.length} posts`,
      posts: newPosts
    })
  } catch (error) {
    console.error('Error in automation:', error)
    return NextResponse.json({ success: false, error: 'Server error' })
  }
}
