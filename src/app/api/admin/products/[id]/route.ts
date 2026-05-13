import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

const updateSchema = z.object({
  name:        z.string().min(2).optional(),
  description: z.string().optional(),
  brand:       z.string().optional(),
  emoji:       z.string().optional(),
  bgGradient:  z.string().optional().nullable(),
  categoryId:  z.string().optional(),
  price:       z.number().positive().optional(),
  comparePrice:z.number().optional().nullable(),
  unit:        z.string().optional(),
  moq:         z.number().int().positive().optional(),
  stock:       z.number().int().min(0).optional(),
  badge:       z.string().optional().nullable(),
  active:      z.boolean().optional(),
  details:     z.record(z.string()).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const body = await req.json()
    const data = updateSchema.parse(body)
    const product = await prisma.product.update({ where: { id: params.id }, data: data as any })
    return NextResponse.json(product)
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    // Soft delete
    await prisma.product.update({ where: { id: params.id }, data: { active: false } })
    return NextResponse.json({ message: 'Produkt deaktiviert' })
  } catch {
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
