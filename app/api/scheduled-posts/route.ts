import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const STORAGE_FILE = path.join(process.cwd(), 'scheduled-posts.json')

function loadScheduledPosts() {
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

export async function GET() {
  try {
    const posts = loadScheduledPosts()
    return NextResponse.json({ success: true, posts })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' })
  }
}
