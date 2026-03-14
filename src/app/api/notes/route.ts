import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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

  return NextResponse.json(note, { status: 201 })
}
