import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail, sendAdminNewCustomerEmail } from '@/lib/email'

const schema = z.object({
  name:      z.string().min(2).max(100),
  email:     z.string().email(),
  password:  z.string().min(8),
  phone:     z.string().optional(),
  company:   z.string().min(2).max(200),
  industry:  z.string().min(2),
  address:   z.string().min(5),
  city:      z.string().min(2),
  zip:       z.string().min(4),
  uid:       z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'Diese E-Mail ist bereits registriert.' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        email:    data.email.toLowerCase(),
        password: hashed,
        name:     data.name,
        phone:    data.phone,
        company: {
          create: {
            name:     data.company,
            industry: data.industry,
            address:  data.address,
            city:     data.city,
            zip:      data.zip,
            uid:      data.uid,
          },
        },
      },
    })

    // Send emails (don't block response)
    Promise.all([
      sendWelcomeEmail(user.email, user.name, data.company),
      sendAdminNewCustomerEmail(user.name, data.company, user.email),
    ]).catch(console.error)

    return NextResponse.json({ message: 'Registrierung erfolgreich. Wir prüfen Ihre Anfrage.' }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error('[register]', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
