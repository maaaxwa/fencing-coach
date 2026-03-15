'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

interface ClassNote {
  id: number
  content: string
  sessionDate: string
  analysis: string | null
  createdAt: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<ClassNote[]>([])
  const [showForm, setShowForm] = useState(false)
  const [content, setContent] = useState('')
  const [sessionDate, setSessionDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchNotes()
  }, [])

  // Poll while any note is still being analyzed
  useEffect(() => {
    const hasUnanalyzed = notes.some((n) => !n.analysis)
    if (!hasUnanalyzed) return
    const interval = setInterval(fetchNotes, 5000)
    return () => clearInterval(interval)
  }, [notes])

  async function fetchNotes() {
    const res = await fetch('/api/notes')
    const data = await res.json()
    setNotes(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, sessionDate }),
    })
    setContent('')
    setSessionDate(format(new Date(), 'yyyy-MM-dd'))
    setShowForm(false)
    setSubmitting(false)
    fetchNotes()
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this note?')) return
    await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    fetchNotes()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Training Notes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Note'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Session Date</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              required
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Notes</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={8}
              placeholder="Paste your raw class notes here..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {submitting ? 'Saving...' : 'Save Note'}
          </button>
        </form>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">📝</div>
          <p>No training notes yet. Add your first note above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-400">
                    {format(new Date(note.sessionDate), 'MMMM d, yyyy')}
                  </span>
                  {note.analysis ? (
                    <span className="text-xs text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                      Analyzed
                    </span>
                  ) : (
                    <span className="text-xs text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">
                      Analyzing...
                    </span>
                  )}
                </div>
                <p className="text-gray-300 text-sm line-clamp-2">{note.content}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/notes/${note.id}`}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  View
                </Link>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
