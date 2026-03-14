import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const reports = await prisma.coachingReport.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(reports)
}
