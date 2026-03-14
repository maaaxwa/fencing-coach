import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cleanupFrames } from '@/lib/video'
import fs from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const video = await prisma.video.findUnique({ where: { id: parseInt(id) } })
  if (!video) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(video)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const videoId = parseInt(id)

  const video = await prisma.video.findUnique({ where: { id: videoId } })
  if (!video) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Delete files
  if (fs.existsSync(video.filepath)) fs.unlinkSync(video.filepath)
  if (video.thumbnailPath && fs.existsSync(video.thumbnailPath))
    fs.unlinkSync(video.thumbnailPath)
  cleanupFrames(videoId)

  await prisma.video.delete({ where: { id: videoId } })
  return NextResponse.json({ success: true })
}
