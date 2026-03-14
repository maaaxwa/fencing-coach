'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

interface ClassNote {
  id: number
  content: string
  sessionDate: string
  analysis: string | null
  createdAt: string
}

interface NoteAnalysis {
  techniques: string[]
  drills: string[]
  corrections: string[]
  keyInsights: string[]
  areasToImprove: string[]
}

export default function NoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [note, setNote] = useState<ClassNote | null>(null)
  const [analysis, setAnalysis] = useState<NoteAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/notes/${params.id}`)
      .then((r) => r.json())
      .then((n) => {
        setNote(n)
        if (n.analysis) {
          setAnalysis(JSON.parse(n.analysis))
        }
      })
  }, [params.id])

  async function handleAnalyze() {
    setAnalyzing(true)
    setError('')
    const res = await fetch(`/api/notes/${params.id}/analyze`, { method: 'POST' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Analysis failed')
      setAnalyzing(false)
      return
    }
    const data = await res.json()
    setAnalysis(data.analysis)
    setNote((prev) => (prev ? { ...prev, analysis: JSON.stringify(data.analysis) } : prev))
    setAnalyzing(false)
  }

  if (!note) {
    return <div className="text-gray-400">Loading...</div>
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/notes" className="text-gray-500 hover:text-gray-300 text-sm">
          ← Notes
        </Link>
      </div>

      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">
            {format(new Date(note.sessionDate), 'MMMM d, yyyy')}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Added {format(new Date(note.createdAt), 'MMM d, yyyy')}
          </p>
        </div>
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

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Raw notes */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
          Raw Notes
        </h2>
        <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
          {note.content}
        </pre>
      </div>

      {/* Analysis */}
      {analysis && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-blue-400">AI Analysis</h2>

          <AnalysisSection title="Techniques Covered" items={analysis.techniques} color="blue" />
          <AnalysisSection title="Drills" items={analysis.drills} color="purple" />
          <AnalysisSection title="Corrections Given" items={analysis.corrections} color="yellow" />
          <AnalysisSection title="Key Insights" items={analysis.keyInsights} color="green" />
          <AnalysisSection
            title="Areas to Improve"
            items={analysis.areasToImprove}
            color="orange"
          />
        </div>
      )}

      {analyzing && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <div className="text-gray-400 text-sm">
            Claude is analyzing your training notes...
            <br />
            <span className="text-gray-600 text-xs">This may take 10-20 seconds</span>
          </div>
        </div>
      )}
    </div>
  )
}

function AnalysisSection({
  title,
  items,
  color,
}: {
  title: string
  items: string[]
  color: string
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-300 bg-blue-400/10',
    purple: 'text-purple-300 bg-purple-400/10',
    yellow: 'text-yellow-300 bg-yellow-400/10',
    green: 'text-green-300 bg-green-400/10',
    orange: 'text-orange-300 bg-orange-400/10',
  }

  if (!items || items.length === 0) return null

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className={`text-xs px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${colorMap[color]}`}>
              {i + 1}
            </span>
            <span className="text-gray-300 text-sm">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
