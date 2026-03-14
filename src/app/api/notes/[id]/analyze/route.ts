import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { analyzeClassNote } from '@/lib/claude'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const noteId = parseInt(id)

  const note = await prisma.classNote.findUnique({ where: { id: noteId } })
  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

  const profile = await prisma.profile.findUnique({ where: { id: 1 } })
  if (!profile) return NextResponse.json({ error: 'Profile not set up' }, { status: 400 })

  const analysis = await analyzeClassNote(
    {
      name: profile.name,
      weapon: profile.weapon,
      experienceYears: profile.experienceYears,
      experienceMonths: profile.experienceMonths,
    },
    note.content
  )

  const updated = await prisma.classNote.update({
    where: { id: noteId },
    data: { analysis: JSON.stringify(analysis) },
  })

  return NextResponse.json({ analysis, note: updated })
}
