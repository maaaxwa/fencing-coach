'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

interface Video {
  id: number
  filename: string
  boutDate: string
  analysis: string | null
  thumbnailPath: string | null
  createdAt: string
}

interface VideoAnalysis {
  footwork: { assessment: string; issues: string[]; strengths: string[] }
  bladeWork: { assessment: string; issues: string[]; strengths: string[] }
  posture: { assessment: string; issues: string[]; strengths: string[] }
  speedAndTiming: { assessment: string; notes: string[] }
  tacticalDecisions: { assessment: string; notes: string[] }
  overallScore: number
  topSuggestions: string[]
}

export default function VideoDetailPage() {
  const params = useParams()
  const [video, setVideo] = useState<Video | null>(null)
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/videos/${params.id}`)
      .then((r) => r.json())
      .then((v) => {
        setVideo(v)
        if (v.analysis) {
          setAnalysis(JSON.parse(v.analysis))
        }
      })
  }, [params.id])

  async function handleAnalyze() {
    setAnalyzing(true)
    setError('')
    const res = await fetch(`/api/videos/${params.id}/analyze`, { method: 'POST' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Analysis failed')
      setAnalyzing(false)
      return
    }
    const data = await res.json()
    setAnalysis(data.analysis)
    setVideo((prev) => (prev ? { ...prev, analysis: JSON.stringify(data.analysis) } : prev))
    setAnalyzing(false)
  }

  if (!video) return <div className="text-gray-400">Loading...</div>

  const scoreColor =
    !analysis
      ? ''
      : analysis.overallScore >= 8
        ? 'text-green-400'
        : analysis.overallScore >= 5
          ? 'text-yellow-400'
          : 'text-red-400'

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/videos" className="text-gray-500 hover:text-gray-300 text-sm">
          ← Videos
        </Link>
      </div>

      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">
            Bout — {format(new Date(video.boutDate), 'MMMM d, yyyy')}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Uploaded {format(new Date(video.createdAt), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {analysis && (
            <div className="text-center">
              <div className={`text-2xl font-bold ${scoreColor}`}>
                {analysis.overallScore}/10
              </div>
              <div className="text-xs text-gray-500">Score</div>
            </div>
          )}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {analyzing ? (
              <>
                <span className="animate-spin">⟳</span> Analyzing...
              </>
            ) : analysis ? (
              '↻ Re-analyze'
            ) : (
              '✦ Analyze with AI'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Video player */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
        <video
          controls
          className="w-full"
          src={`/api/uploads/videos/${video.filename}`}
        >
          Your browser does not support the video tag.
        </video>
      </div>

      {analyzing && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center mb-6">
          <div className="text-gray-400 text-sm">
            Extracting frames and analyzing with Claude...
            <br />
            <span className="text-gray-600 text-xs">
              This may take 30-60 seconds for longer videos
            </span>
          </div>
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-blue-400">AI Analysis</h2>

          {/* Top suggestions */}
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-blue-300 uppercase tracking-wide mb-3">
              Top Improvement Suggestions
            </h3>
            <ul className="space-y-2">
              {analysis.topSuggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold text-sm shrink-0">{i + 1}.</span>
                  <span className="text-gray-200 text-sm">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <AnalysisCategory
            title="Footwork"
            assessment={analysis.footwork.assessment}
            issues={analysis.footwork.issues}
            strengths={analysis.footwork.strengths}
          />
          <AnalysisCategory
            title="Blade Work"
            assessment={analysis.bladeWork.assessment}
            issues={analysis.bladeWork.issues}
            strengths={analysis.bladeWork.strengths}
          />
          <AnalysisCategory
            title="Posture & Guard"
            assessment={analysis.posture.assessment}
            issues={analysis.posture.issues}
            strengths={analysis.posture.strengths}
          />

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
              Speed & Timing
            </h3>
            <p className="text-gray-300 text-sm mb-2">{analysis.speedAndTiming.assessment}</p>
            {analysis.speedAndTiming.notes.map((n, i) => (
              <div key={i} className="text-gray-400 text-sm flex items-start gap-2">
                <span className="text-gray-600">•</span>
                <span>{n}</span>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
              Tactical Decisions
            </h3>
            <p className="text-gray-300 text-sm mb-2">{analysis.tacticalDecisions.assessment}</p>
            {analysis.tacticalDecisions.notes.map((n, i) => (
              <div key={i} className="text-gray-400 text-sm flex items-start gap-2">
                <span className="text-gray-600">•</span>
                <span>{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AnalysisCategory({
  title,
  assessment,
  issues,
  strengths,
}: {
  title: string
  assessment: string
  issues: string[]
  strengths: string[]
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">{title}</h3>
      <p className="text-gray-300 text-sm mb-3">{assessment}</p>
      <div className="grid grid-cols-2 gap-4">
        {strengths.length > 0 && (
          <div>
            <div className="text-xs text-green-400 mb-1.5 font-medium">Strengths</div>
            <ul className="space-y-1">
              {strengths.map((s, i) => (
                <li key={i} className="text-gray-400 text-xs flex items-start gap-1.5">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {issues.length > 0 && (
          <div>
            <div className="text-xs text-orange-400 mb-1.5 font-medium">Issues</div>
            <ul className="space-y-1">
              {issues.map((s, i) => (
                <li key={i} className="text-gray-400 text-xs flex items-start gap-1.5">
                  <span className="text-orange-600 mt-0.5">!</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
