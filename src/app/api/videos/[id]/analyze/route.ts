import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { analyzeVideoFrames } from '@/lib/claude'
import { extractFrames, framePathToBase64, cleanupFrames } from '@/lib/video'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const videoId = parseInt(id)

  const video = await prisma.video.findUnique({ where: { id: videoId } })
  if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 })

  const profile = await prisma.profile.findUnique({ where: { id: 1 } })
  if (!profile) return NextResponse.json({ error: 'Profile not set up' }, { status: 400 })

  // Extract frames
  const framePaths = await extractFrames(video.filepath, videoId)
  const base64Frames = framePaths.map(framePathToBase64)

  // Analyze with Claude
  const analysis = await analyzeVideoFrames(
    {
      name: profile.name,
      weapon: profile.weapon,
      experienceYears: profile.experienceYears,
      experienceMonths: profile.experienceMonths,
    },
    base64Frames
  )

  // Clean up frames after analysis to save disk space
  cleanupFrames(videoId)

  const updated = await prisma.video.update({
    where: { id: videoId },
    data: { analysis: JSON.stringify(analysis) },
  })

  return NextResponse.json({ analysis, video: updated })
}
