'use client'

import { useEffect, useState } from 'react'

export default function ProfilePage() {
  const [name, setName] = useState('')
  const [weapon] = useState('epee')
  const [experienceYears, setExperienceYears] = useState(0)
  const [experienceMonths, setExperienceMonths] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((p) => {
        if (p) {
          setName(p.name)
          setExperienceYears(p.experienceYears)
          setExperienceMonths(p.experienceMonths)
        }
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, weapon, experienceYears, experienceMonths }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your name"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Weapon</label>
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300">
            Épée
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Fencing Experience
          </label>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="number"
                min={0}
                max={50}
                value={experienceYears}
                onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-xs text-gray-500 mt-1">Years</div>
            </div>
            <div className="flex-1">
              <input
                type="number"
                min={0}
                max={11}
                value={experienceMonths}
                onChange={(e) => setExperienceMonths(parseInt(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-xs text-gray-500 mt-1">Months</div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-2.5 rounded-lg font-medium transition-colors"
        >
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}
