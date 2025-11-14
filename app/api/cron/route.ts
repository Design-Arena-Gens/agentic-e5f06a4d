import { NextResponse } from 'next/server'
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

async function downloadVideo(url: string): Promise<Buffer> {
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function postToInstagram(post: ScheduledPost): Promise<boolean> {
  try {
    const { video, instagramUserId, instagramAccessToken } = post

    // Download video
    console.log('Downloading video:', video.url)
    const videoBuffer = await downloadVideo(video.url)

    // Step 1: Create container for Instagram video
    // Note: Instagram Graph API requires the video to be publicly accessible
    // In production, you'd upload to a temporary public URL first
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramUserId}/media`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          media_type: 'REELS',
          video_url: video.url, // Use Pexels URL directly
          caption: `✨ Luxury Lifestyle ✨\n\n📹 Video by ${video.user.name}\n\n#luxury #lifestyle #luxurylifestyle #wealth #success #motivation`,
          access_token: instagramAccessToken
        })
      }
    )

    const containerData = await containerResponse.json()

    if (!containerResponse.ok || !containerData.id) {
      console.error('Failed to create media container:', containerData)
      return false
    }

    // Step 2: Wait for video to be processed
    let attempts = 0
    let isReady = false

    while (attempts < 30 && !isReady) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds

      const statusResponse = await fetch(
        `https://graph.facebook.com/v18.0/${containerData.id}?fields=status_code&access_token=${instagramAccessToken}`
      )

      const statusData = await statusResponse.json()

      if (statusData.status_code === 'FINISHED') {
        isReady = true
      } else if (statusData.status_code === 'ERROR') {
        console.error('Video processing error')
        return false
      }

      attempts++
    }

    if (!isReady) {
      console.error('Video processing timeout')
      return false
    }

    // Step 3: Publish the media
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramUserId}/media_publish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: instagramAccessToken
        })
      }
    )

    const publishData = await publishResponse.json()

    if (!publishResponse.ok || !publishData.id) {
      console.error('Failed to publish media:', publishData)
      return false
    }

    console.log('Successfully posted to Instagram:', publishData.id)
    return true

  } catch (error) {
    console.error('Error posting to Instagram:', error)
    return false
  }
}

// This endpoint will be called by Vercel Cron
export async function GET() {
  try {
    console.log('Cron job started at', new Date().toISOString())

    const posts = loadScheduledPosts()
    const now = new Date()

    let processedCount = 0

    // Find posts that are due to be posted
    for (const post of posts) {
      if (post.status === 'pending') {
        const scheduledTime = new Date(post.scheduledFor)

        // If scheduled time has passed, post it
        if (scheduledTime <= now) {
          console.log(`Posting video ${post.id}...`)

          const success = await postToInstagram(post)

          post.status = success ? 'posted' : 'failed'
          processedCount++

          console.log(`Post ${post.id} status: ${post.status}`)
        }
      }
    }

    // Save updated posts
    saveScheduledPosts(posts)

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} posts`,
      timestamp: now.toISOString()
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({
      success: false,
      error: 'Cron job failed',
      timestamp: new Date().toISOString()
    })
  }
}
