'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'

interface CoachingReport {
  id: number
  content: string
  createdAt: string
}

interface ReportContent {
  executiveSummary: string
  strengths: string[]
  weaknesses: string[]
  patterns: string[]
  priorityDrills: { drill: string; targetIssue: string; frequency: string }[]
  shortTermGoals: string[]
  longTermGoals: string[]
  overallAssessment: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<CoachingReport[]>([])
  const [generating, setGenerating] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    const res = await fetch('/api/reports')
    const data = await res.json()
    setReports(data)
    if (data.length > 0) setExpandedId(data[0].id)
  }

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    const res = await fetch('/api/reports/generate', { method: 'POST' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Failed to generate report')
      setGenerating(false)
      return
    }
    const data = await res.json()
    await fetchReports()
    setExpandedId(data.report.id)
    setGenerating(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Coaching Reports</h1>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          {generating ? (
            <>
              <span className="animate-spin">⟳</span> Generating...
            </>
          ) : (
            '✦ Generate Report'
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {generating && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center mb-6">
          <div className="text-gray-400 text-sm">
            Claude is generating your unified coaching report...
            <br />
            <span className="text-gray-600 text-xs">
              This cross-references all your notes and video analyses
            </span>
          </div>
        </div>
      )}

      {reports.length === 0 && !generating ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">📊</div>
          <p>No reports yet. Generate your first coaching report above.</p>
          <p className="text-sm mt-2 text-gray-600">
            Make sure you have analyzed some notes or videos first.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const content = JSON.parse(report.content) as ReportContent
            const isExpanded = expandedId === report.id

            return (
              <div
                key={report.id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-850 transition-colors"
                >
                  <div>
                    <div className="font-medium">
                      Coaching Report — {format(new Date(report.createdAt), 'MMMM d, yyyy')}
                    </div>
                    <div className="text-sm text-gray-400 mt-0.5 line-clamp-1">
                      {content.executiveSummary}
                    </div>
                  </div>
                  <span className="text-gray-500 text-lg ml-4">{isExpanded ? '▲' : '▼'}</span>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 space-y-5 border-t border-gray-800 pt-5">
                    {/* Executive Summary */}
                    <div>
                      <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                        Executive Summary
                      </h3>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {content.executiveSummary}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Strengths */}
                      <div className="bg-green-900/10 border border-green-800/30 rounded-lg p-4">
                        <h3 className="text-xs text-green-400 uppercase tracking-wide mb-2 font-medium">
                          Strengths
                        </h3>
                        <ul className="space-y-1.5">
                          {content.strengths.map((s, i) => (
                            <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                              <span className="text-green-600 mt-0.5 shrink-0">✓</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Weaknesses */}
                      <div className="bg-orange-900/10 border border-orange-800/30 rounded-lg p-4">
                        <h3 className="text-xs text-orange-400 uppercase tracking-wide mb-2 font-medium">
                          Areas to Improve
                        </h3>
                        <ul className="space-y-1.5">
                          {content.weaknesses.map((w, i) => (
                            <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                              <span className="text-orange-600 mt-0.5 shrink-0">!</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Patterns */}
                    {content.patterns?.length > 0 && (
                      <div>
                        <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                          Patterns Observed
                        </h3>
                        <ul className="space-y-1">
                          {content.patterns.map((p, i) => (
                            <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
                              <span className="text-gray-600">•</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Priority Drills */}
                    {content.priorityDrills?.length > 0 && (
                      <div>
                        <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">
                          Priority Drills
                        </h3>
                        <div className="space-y-2">
                          {content.priorityDrills.map((d, i) => (
                            <div
                              key={i}
                              className="bg-gray-800 rounded-lg p-3 border border-gray-700"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="text-sm font-medium text-gray-200">{d.drill}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    Targets: {d.targetIssue}
                                  </div>
                                </div>
                                <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded shrink-0">
                                  {d.frequency}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {/* Short-term goals */}
                      {content.shortTermGoals?.length > 0 && (
                        <div>
                          <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                            Short-Term Goals (1-4 weeks)
                          </h3>
                          <ul className="space-y-1">
                            {content.shortTermGoals.map((g, i) => (
                              <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
                                <span className="text-blue-600 shrink-0">→</span>
                                <span>{g}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Long-term goals */}
                      {content.longTermGoals?.length > 0 && (
                        <div>
                          <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                            Long-Term Goals (3-6 months)
                          </h3>
                          <ul className="space-y-1">
                            {content.longTermGoals.map((g, i) => (
                              <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
                                <span className="text-purple-600 shrink-0">→</span>
                                <span>{g}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Overall assessment */}
                    {content.overallAssessment && (
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                          Overall Assessment
                        </h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {content.overallAssessment}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
