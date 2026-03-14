import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateCoachingReport, NoteAnalysis, VideoAnalysis } from '@/lib/claude'

export async function POST() {
  const profile = await prisma.profile.findUnique({ where: { id: 1 } })
  if (!profile) return NextResponse.json({ error: 'Profile not set up' }, { status: 400 })

  const notes = await prisma.classNote.findMany({ where: { analysis: { not: null } } })
  const videos = await prisma.video.findMany({ where: { analysis: { not: null } } })

  const noteAnalyses: NoteAnalysis[] = notes
    .map((n) => {
      try {
        return JSON.parse(n.analysis!) as NoteAnalysis
      } catch {
        return null
      }
    })
    .filter(Boolean) as NoteAnalysis[]

  const videoAnalyses: VideoAnalysis[] = videos
    .map((v) => {
      try {
        return JSON.parse(v.analysis!) as VideoAnalysis
      } catch {
        return null
      }
    })
    .filter(Boolean) as VideoAnalysis[]

  const reportContent = await generateCoachingReport(
    {
      name: profile.name,
      weapon: profile.weapon,
      experienceYears: profile.experienceYears,
      experienceMonths: profile.experienceMonths,
    },
    noteAnalyses,
    videoAnalyses
  )

  const report = await prisma.coachingReport.create({
    data: { content: JSON.stringify(reportContent) },
  })

  return NextResponse.json({ report, content: reportContent }, { status: 201 })
}
