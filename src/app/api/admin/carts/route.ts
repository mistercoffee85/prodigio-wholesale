import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const carts = await prisma.cart.findMany({
    include: { user: { include: { company: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(carts)
}
