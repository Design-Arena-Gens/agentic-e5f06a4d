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
    const { video, instagramAccessToken, instagramUserId } = await request.json()

    if (!video || !instagramAccessToken || !instagramUserId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' })
    }

    const posts = loadScheduledPosts()

    // Calculate next scheduled time (find next available day)
    const lastPost = posts.filter(p => p.status === 'pending').sort((a, b) =>
      new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime()
    )[0]

    let scheduledFor = new Date()
    if (lastPost) {
      scheduledFor = new Date(lastPost.scheduledFor)
      scheduledFor.setDate(scheduledFor.getDate() + 1)
    } else {
      scheduledFor.setDate(scheduledFor.getDate() + 1)
    }
    scheduledFor.setHours(10, 0, 0, 0) // Schedule for 10 AM

    const newPost: ScheduledPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      video,
      scheduledFor: scheduledFor.toISOString(),
      status: 'pending',
      instagramAccessToken,
      instagramUserId
    }

    posts.push(newPost)
    saveScheduledPosts(posts)

    return NextResponse.json({ success: true, post: newPost })
  } catch (error) {
    console.error('Error scheduling post:', error)
    return NextResponse.json({ success: false, error: 'Server error' })
  }
}
