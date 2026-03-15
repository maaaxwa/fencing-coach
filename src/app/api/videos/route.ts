import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { extractThumbnail } from '@/lib/video'
import path from 'path'
import fs from 'fs'

const VIDEOS_DIR = path.join(process.cwd(), 'uploads', 'videos')

export async function GET() {
  const videos = await prisma.video.findMany({
    orderBy: { boutDate: 'desc' },
  })
  return NextResponse.json(videos)
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('video') as File
  const boutDate = formData.get('boutDate') as string
  const fencerDescription = formData.get('fencerDescription') as string | null

  if (!file) return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
  if (!boutDate) return NextResponse.json({ error: 'boutDate required' }, { status: 400 })

  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true })
  }

  const ext = path.extname(file.name) || '.mp4'
  const timestamp = Date.now()
  const filename = `${timestamp}${ext}`
  const filepath = path.join(VIDEOS_DIR, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(filepath, buffer)

  // Create DB record first to get the ID
  const video = await prisma.video.create({
    data: {
      filename,
      filepath,
      boutDate: new Date(boutDate),
      fencerDescription: fencerDescription || null,
    },
  })

  // Extract thumbnail
  try {
    const thumbnailPath = await extractThumbnail(filepath, video.id)
    await prisma.video.update({
      where: { id: video.id },
      data: { thumbnailPath },
    })
  } catch (e) {
    console.error('Thumbnail extraction failed:', e)
  }

  const updated = await prisma.video.findUnique({ where: { id: video.id } })
  return NextResponse.json(updated, { status: 201 })
}
