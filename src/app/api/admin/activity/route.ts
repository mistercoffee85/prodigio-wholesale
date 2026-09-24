import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500)

  const logs = await prisma.activityLog.findMany({
    include: { user: { include: { company: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json(logs)
}
