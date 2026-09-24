import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { items, subtotal } = await req.json()

  await prisma.cart.upsert({
    where:  { userId: session.user.id },
    create: { userId: session.user.id, items, subtotal: subtotal ?? 0 },
    update: { items, subtotal: subtotal ?? 0 },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.cart.deleteMany({ where: { userId: session.user.id } })
  return NextResponse.json({ ok: true })
}
