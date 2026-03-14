'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Profile {
  id: number
  name: string
  weapon: string
  experienceYears: number
  experienceMonths: number
}

interface ClassNote {
  id: number
  content: string
  sessionDate: string
  analysis: string | null
}

interface Video {
  id: number
  filename: string
  boutDate: string
  analysis: string | null
  thumbnailPath: string | null
}

interface Report {
  id: number
  content: string
  createdAt: string
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [notes, setNotes] = useState<ClassNote[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then((r) => r.json()),
      fetch('/api/notes').then((r) => r.json()),
      fetch('/api/videos').then((r) => r.json()),
      fetch('/api/reports').then((r) => r.json()),
    ]).then(([p, n, v, r]) => {
      setProfile(p)
      setNotes(n)
      setVideos(v)
      setReports(r)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">⚔</div>
        <h1 className="text-2xl font-bold mb-2">Welcome to Fencing Coach AI</h1>
        <p className="text-gray-400 mb-6">Set up your profile to get started.</p>
        <Link
          href="/profile"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Set Up Profile
        </Link>
      </div>
    )
  }

  const latestReport = reports[0]
  const latestReportContent = latestReport ? JSON.parse(latestReport.content) : null
  const analyzedNotes = notes.filter((n) => n.analysis)
  const analyzedVideos = videos.filter((v) => v.analysis)

  const expLabel = () => {
    const parts = []
    if (profile.experienceYears > 0)
      parts.push(`${profile.experienceYears}y`)
    if (profile.experienceMonths > 0)
      parts.push(`${profile.experienceMonths}mo`)
    return parts.length ? parts.join(' ') : 'Beginner'
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {profile.name}</h1>
          <p className="text-gray-400 text-sm mt-1">
            Épée · {expLabel()} experience
          </p>
        </div>
        <Link href="/reports" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Generate Report
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-3xl font-bold text-blue-400">{notes.length}</div>
          <div className="text-gray-400 text-sm mt-1">Training Notes</div>
          <div className="text-gray-500 text-xs mt-0.5">{analyzedNotes.length} analyzed</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-3xl font-bold text-blue-400">{videos.length}</div>
          <div className="text-gray-400 text-sm mt-1">Bout Videos</div>
          <div className="text-gray-500 text-xs mt-0.5">{analyzedVideos.length} analyzed</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-3xl font-bold text-blue-400">{reports.length}</div>
          <div className="text-gray-400 text-sm mt-1">Coaching Reports</div>
          <div className="text-gray-500 text-xs mt-0.5">
            {latestReport
              ? `Latest: ${format(new Date(latestReport.createdAt), 'MMM d')}`
              : 'None yet'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent notes */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Notes</h2>
            <Link href="/notes" className="text-blue-400 hover:text-blue-300 text-sm">
              View all →
            </Link>
          </div>
          {notes.length === 0 ? (
            <div className="text-gray-500 text-sm">No notes yet.</div>
          ) : (
            <div className="space-y-3">
              {notes.slice(0, 3).map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="block p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">
                      {format(new Date(note.sessionDate), 'MMM d, yyyy')}
                    </span>
                    {note.analysis ? (
                      <span className="text-xs text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                        Analyzed
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 truncate">{note.content.slice(0, 80)}…</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent videos */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Videos</h2>
            <Link href="/videos" className="text-blue-400 hover:text-blue-300 text-sm">
              View all →
            </Link>
          </div>
          {videos.length === 0 ? (
            <div className="text-gray-500 text-sm">No videos yet.</div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {videos.slice(0, 6).map((video) => (
                <Link key={video.id} href={`/videos/${video.id}`} className="group relative">
                  <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                    {video.thumbnailPath ? (
                      <img
                        src={`/api/uploads/thumbnails/${video.id}.jpg`}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-2xl">
                        ▶
                      </div>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {format(new Date(video.boutDate), 'MMM d')}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Latest report preview */}
      {latestReportContent && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Latest Coaching Report</h2>
            <Link href="/reports" className="text-blue-400 hover:text-blue-300 text-sm">
              View all →
            </Link>
          </div>
          <p className="text-gray-300 text-sm mb-4">{latestReportContent.executiveSummary}</p>
          {latestReportContent.weaknesses?.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Top Focus Areas
              </div>
              <div className="flex flex-wrap gap-2">
                {latestReportContent.weaknesses.slice(0, 3).map((w: string, i: number) => (
                  <span
                    key={i}
                    className="text-xs bg-orange-400/10 text-orange-300 px-2 py-1 rounded"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
