'use client'

import { useState, useEffect } from 'react'

interface Video {
  id: number
  url: string
  image: string
  duration: number
  user: { name: string }
}

interface ScheduledPost {
  id: string
  video: Video
  scheduledFor: string
  status: 'pending' | 'posted' | 'failed'
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([])
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [pexelsApiKey, setPexelsApiKey] = useState('')
  const [instagramAccessToken, setInstagramAccessToken] = useState('')
  const [instagramUserId, setInstagramUserId] = useState('')

  useEffect(() => {
    fetchScheduledPosts()
  }, [])

  const fetchVideos = async () => {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/fetch-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pexelsApiKey })
      })
      const data = await response.json()
      if (data.success) {
        setVideos(data.videos)
        setMessage(`Found ${data.videos.length} luxury lifestyle videos`)
      } else {
        setMessage('Error: ' + data.error)
      }
    } catch (error) {
      setMessage('Error fetching videos')
    }
    setLoading(false)
  }

  const scheduleVideo = async (video: Video) => {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/schedule-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video,
          instagramAccessToken,
          instagramUserId
        })
      })
      const data = await response.json()
      if (data.success) {
        setMessage('Video scheduled successfully!')
        fetchScheduledPosts()
      } else {
        setMessage('Error: ' + data.error)
      }
    } catch (error) {
      setMessage('Error scheduling video')
    }
    setLoading(false)
  }

  const fetchScheduledPosts = async () => {
    try {
      const response = await fetch('/api/scheduled-posts')
      const data = await response.json()
      if (data.success) {
        setScheduledPosts(data.posts)
      }
    } catch (error) {
      console.error('Error fetching scheduled posts:', error)
    }
  }

  const triggerAutomation = async () => {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/automate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pexelsApiKey,
          instagramAccessToken,
          instagramUserId
        })
      })
      const data = await response.json()
      if (data.success) {
        setMessage('Automation triggered! Videos will be posted daily.')
        fetchScheduledPosts()
      } else {
        setMessage('Error: ' + data.error)
      }
    } catch (error) {
      setMessage('Error triggering automation')
    }
    setLoading(false)
  }

  const runCronManually = async () => {
    setLoading(true)
    setMessage('Running cron job...')
    try {
      const response = await fetch('/api/cron')
      const data = await response.json()
      if (data.success) {
        setMessage(`Cron job completed: ${data.message}`)
        fetchScheduledPosts()
      } else {
        setMessage('Error: ' + data.error)
      }
    } catch (error) {
      setMessage('Error running cron job')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{
          color: 'white',
          fontSize: '3rem',
          marginBottom: '2rem',
          textAlign: 'center',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          🏆 Luxury Lifestyle Automation
        </h1>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{ marginTop: 0 }}>⚙️ Configuration</h2>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Pexels API Key:
            </label>
            <input
              type="text"
              value={pexelsApiKey}
              onChange={(e) => setPexelsApiKey(e.target.value)}
              placeholder="Enter your Pexels API key"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Instagram Access Token:
            </label>
            <input
              type="text"
              value={instagramAccessToken}
              onChange={(e) => setInstagramAccessToken(e.target.value)}
              placeholder="Enter Instagram Graph API access token"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Instagram User ID:
            </label>
            <input
              type="text"
              value={instagramUserId}
              onChange={(e) => setInstagramUserId(e.target.value)}
              placeholder="Enter Instagram User ID"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          <button
            onClick={triggerAutomation}
            disabled={loading || !pexelsApiKey || !instagramAccessToken || !instagramUserId}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '6px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              width: '100%',
              marginTop: '1rem'
            }}
          >
            {loading ? '⏳ Processing...' : '🚀 Start Daily Automation'}
          </button>

          <button
            onClick={runCronManually}
            disabled={loading}
            style={{
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '6px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              width: '100%',
              marginTop: '1rem'
            }}
          >
            {loading ? '⏳ Processing...' : '⚡ Run Post Job Now (Manual)'}
          </button>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{ marginTop: 0 }}>🎬 Browse Luxury Videos</h2>
          <button
            onClick={fetchVideos}
            disabled={loading || !pexelsApiKey}
            style={{
              background: '#764ba2',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '1rem'
            }}
          >
            {loading ? 'Loading...' : 'Fetch Videos from Pexels'}
          </button>

          {message && (
            <div style={{
              padding: '1rem',
              background: message.includes('Error') ? '#fee' : '#efe',
              borderRadius: '6px',
              marginBottom: '1rem',
              border: `2px solid ${message.includes('Error') ? '#fcc' : '#cfc'}`
            }}>
              {message}
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem'
          }}>
            {videos.map(video => (
              <div key={video.id} style={{
                border: '2px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#f9f9f9'
              }}>
                <img
                  src={video.image}
                  alt="Video thumbnail"
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
                <div style={{ padding: '1rem' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                    📹 Duration: {video.duration}s
                  </p>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#666' }}>
                    By: {video.user.name}
                  </p>
                  <button
                    onClick={() => scheduleVideo(video)}
                    disabled={loading || !instagramAccessToken}
                    style={{
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      width: '100%'
                    }}
                  >
                    Schedule Post
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{ marginTop: 0 }}>📅 Scheduled Posts</h2>
          {scheduledPosts.length === 0 ? (
            <p style={{ color: '#666' }}>No posts scheduled yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {scheduledPosts.map(post => (
                <div key={post.id} style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  background: '#f9f9f9'
                }}>
                  <img
                    src={post.video.image}
                    alt="Thumbnail"
                    style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
                      Video #{post.video.id}
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                      📅 Scheduled: {new Date(post.scheduledFor).toLocaleString()}
                    </p>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      background: post.status === 'posted' ? '#cfc' : post.status === 'failed' ? '#fcc' : '#ffc',
                      border: `1px solid ${post.status === 'posted' ? '#9f9' : post.status === 'failed' ? '#f99' : '#ff9'}`
                    }}>
                      {post.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginTop: '2rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <h3 style={{ marginTop: 0 }}>📖 Setup Instructions</h3>
          <ol style={{ lineHeight: '1.8' }}>
            <li><strong>Pexels API:</strong> Get a free API key from <a href="https://www.pexels.com/api/" target="_blank" rel="noopener noreferrer">pexels.com/api</a></li>
            <li><strong>Instagram API:</strong> Create a Facebook App and get Instagram Graph API access token</li>
            <li><strong>Instagram User ID:</strong> Find your Instagram Business Account user ID</li>
            <li>Enter all credentials above and click "Start Daily Automation"</li>
            <li>Click "Run Post Job Now" to manually trigger posting of scheduled videos</li>
          </ol>
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#fff3cd',
            borderRadius: '6px',
            border: '1px solid #ffc107'
          }}>
            <strong>⚠️ Note:</strong> Vercel Cron is at capacity. Use the "Run Post Job Now" button to manually post scheduled videos. Set up an external cron service (like cron-job.org) to call <code>/api/cron</code> every 6 hours for automation.
          </div>
        </div>
      </div>
    </div>
  )
}
