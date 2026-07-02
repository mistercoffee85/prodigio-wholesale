import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await requireAuth()
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
    }

    const settings = await prisma.setting.findMany({
      where: { key: { startsWith: 'homepage_' } },
    })

    const map: Record<string, string> = {}
    for (const s of settings) {
      map[s.key] = s.value
    }

    return NextResponse.json(map)
  } catch {
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
    }

    const body = await req.json() as Record<string, string>

    await Promise.all(
      Object.entries(body).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
