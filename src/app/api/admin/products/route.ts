import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

const productSchema = z.object({
  name:        z.string().min(2),
  slug:        z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10),
  brand:       z.string().min(1),
  emoji:       z.string().min(1),
  bgGradient:  z.string().optional(),
  categoryId:  z.string(),
  price:       z.number().positive(),
  comparePrice:z.number().optional().nullable(),
  unit:        z.string().min(1),
  moq:         z.number().int().positive(),
  stock:       z.number().int().min(0),
  badge:       z.string().optional().nullable(),
  sku:         z.string().optional(),
  active:      z.boolean().default(true),
  details:     z.record(z.string()).default({}),
})

// Bulk price update: PATCH /api/admin/products  body: { updates: [{id, price, comparePrice?}] }
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()
    const { updates } = await req.json() as { updates: { id: string; price: number; comparePrice?: number | null }[] }
    if (!Array.isArray(updates) || updates.length === 0)
      return NextResponse.json({ error: 'Keine Updates' }, { status: 400 })

    await Promise.all(updates.map(u =>
      prisma.product.update({
        where: { id: u.id },
        data: {
          price: u.price,
          ...(u.comparePrice !== undefined ? { comparePrice: u.comparePrice } : {}),
        },
      })
    ))
    return NextResponse.json({ updated: updates.length })
  } catch {
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const data = productSchema.parse(body)

    const product = await prisma.product.create({ data: data as any })
    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    if (err instanceof Error && err.message === 'FORBIDDEN') return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
    console.error('[admin/products POST]', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
