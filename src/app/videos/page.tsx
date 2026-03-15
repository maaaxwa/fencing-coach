'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Video {
  id: number
  filename: string
  boutDate: string
  fencerDescription: string | null
  analysis: string | null
  thumbnailPath: string | null
  createdAt: string
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [showForm, setShowForm] = useState(false)
  const [boutDate, setBoutDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [fencerSide, setFencerSide] = useState<'left' | 'right'>('left')
  const [fencerNote, setFencerNote] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchVideos()
  }, [])

  // Poll while any video is still being analyzed
  useEffect(() => {
    const hasUnanalyzed = videos.some((v) => !v.analysis)
    if (!hasUnanalyzed) return
    const interval = setInterval(fetchVideos, 5000)
    return () => clearInterval(interval)
  }, [videos])

  async function fetchVideos() {
    const res = await fetch('/api/videos')
    setVideos(await res.json())
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadProgress('Uploading video...')

    const fencerDescription = fencerNote.trim()
      ? `${fencerSide} side — ${fencerNote.trim()}`
      : `${fencerSide} side`

    const formData = new FormData()
    formData.append('video', file)
    formData.append('boutDate', boutDate)
    formData.append('fencerDescription', fencerDescription)

    const res = await fetch('/api/videos', { method: 'POST', body: formData })
    if (res.ok) {
      setShowForm(false)
      setBoutDate(format(new Date(), 'yyyy-MM-dd'))
      setFencerSide('left')
      setFencerNote('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchVideos()
    } else {
      setUploadProgress('Upload failed.')
    }
    setUploading(false)
    setUploadProgress('')
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this video?')) return
    await fetch(`/api/videos/${id}`, { method: 'DELETE' })
    fetchVideos()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bout Videos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ Upload Video'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleUpload}
          className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Bout Date</label>
            <input
              type="date"
              value={boutDate}
              onChange={(e) => setBoutDate(e.target.value)}
              required
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Which fencer are you?</label>
            <div className="flex gap-3 mb-2">
              {(['left', 'right'] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => setFencerSide(side)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    fencerSide === side
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {side === 'left' ? '← Left side' : 'Right side →'}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={fencerNote}
              onChange={(e) => setFencerNote(e.target.value)}
              placeholder="Optional: e.g. red jacket, taller fencer"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Video File (one point per video)
            </label>
            <input
              type="file"
              accept="video/*"
              ref={fileInputRef}
              required
              className="text-gray-300 text-sm file:mr-3 file:bg-gray-700 file:text-gray-300 file:border-0 file:rounded-lg file:px-3 file:py-1.5 file:text-sm hover:file:bg-gray-600"
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {uploading ? uploadProgress || 'Uploading...' : 'Upload Video'}
          </button>
        </form>
      )}

      {videos.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">🎬</div>
          <p>No bout videos yet. Upload your first video above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {videos.map((video) => (
            <div key={video.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <Link href={`/videos/${video.id}`}>
                <div className="aspect-video bg-gray-800 relative">
                  {video.thumbnailPath ? (
                    <img
                      src={`/api/uploads/thumbnails/${video.id}.jpg`}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">
                      ▶
                    </div>
                  )}
                  {video.analysis ? (
                    <span className="absolute top-2 right-2 text-xs text-green-400 bg-green-400/20 backdrop-blur px-1.5 py-0.5 rounded">
                      Analyzed
                    </span>
                  ) : (
                    <span className="absolute top-2 right-2 text-xs text-yellow-400 bg-black/40 backdrop-blur px-1.5 py-0.5 rounded">
                      Analyzing...
                    </span>
                  )}
                </div>
              </Link>
              <div className="p-3 flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  {format(new Date(video.boutDate), 'MMM d, yyyy')}
                </span>
                <div className="flex gap-2">
                  <Link href={`/videos/${video.id}`} className="text-blue-400 hover:text-blue-300 text-sm">
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(video.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
