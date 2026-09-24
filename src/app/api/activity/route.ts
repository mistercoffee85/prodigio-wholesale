import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: true }) // silently ignore unauthenticated

  const { type, payload } = await req.json()
  if (!type) return NextResponse.json({ error: 'Missing type' }, { status: 400 })

  await prisma.activityLog.create({
    data: { userId: session.user.id, type, payload: payload ?? {} },
  })

  return NextResponse.json({ ok: true })
}
