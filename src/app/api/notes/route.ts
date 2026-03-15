import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { analyzeClassNote } from '@/lib/claude'

export async function GET() {
  const notes = await prisma.classNote.findMany({
    orderBy: { sessionDate: 'desc' },
  })
  return NextResponse.json(notes)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { content, sessionDate } = body

  const note = await prisma.classNote.create({
    data: {
      content,
      sessionDate: new Date(sessionDate),
    },
  })

  // Kick off analysis in the background
  void (async () => {
    try {
      const profile = await prisma.profile.findUnique({ where: { id: 1 } })
      if (!profile) return
      const analysis = await analyzeClassNote(
        {
          name: profile.name,
          weapon: profile.weapon,
          experienceYears: profile.experienceYears,
          experienceMonths: profile.experienceMonths,
        },
        content
      )
      await prisma.classNote.update({
        where: { id: note.id },
        data: { analysis: JSON.stringify(analysis) },
      })
    } catch (e) {
      console.error('Background note analysis failed:', e)
    }
  })()

  return NextResponse.json(note, { status: 201 })
}
