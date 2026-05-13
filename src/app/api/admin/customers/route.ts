import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page   = Number(searchParams.get('page') ?? 1)
    const limit  = Number(searchParams.get('limit') ?? 30)

    const where = {
      role: 'CUSTOMER' as const,
      ...(status && { status: status as any }),
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { company: true, _count: { select: { orders: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({ customers, total })
  } catch {
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}

const actionSchema = z.object({
  userId: z.string(),
  action: z.enum(['approve', 'reject']),
  priceGroup: z.enum(['STANDARD', 'PREMIUM', 'VIP']).optional(),
})

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { userId, action, priceGroup } = actionSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    })
    if (!user) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

    if (action === 'approve') {
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'APPROVED' },
      })
      if (priceGroup && user.company) {
        await prisma.company.update({
          where: { id: user.company.id },
          data: { priceGroup: priceGroup as any },
        })
      }
      sendApprovalEmail(user.email, user.name).catch(console.error)
      return NextResponse.json({ message: 'Kunde freigegeben' })
    }

    if (action === 'reject') {
      await prisma.user.update({ where: { id: userId }, data: { status: 'REJECTED' } })
      sendRejectionEmail(user.email, user.name).catch(console.error)
      return NextResponse.json({ message: 'Kunde abgelehnt' })
    }
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
