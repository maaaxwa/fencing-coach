import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const profile = await prisma.profile.findUnique({ where: { id: 1 } })
  return NextResponse.json(profile)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, weapon, experienceYears, experienceMonths } = body

  const profile = await prisma.profile.upsert({
    where: { id: 1 },
    update: { name, weapon, experienceYears, experienceMonths },
    create: { id: 1, name, weapon, experienceYears, experienceMonths },
  })

  return NextResponse.json(profile)
}
