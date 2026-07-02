import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Nur JPG, PNG, WebP, GIF oder SVG erlaubt' }, { status: 400 })
    }

    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Datei zu gross (max. 5MB)' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()
    const filename = `homepage/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const blob = await put(filename, file, { access: 'public' })

    return NextResponse.json({ url: blob.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Serverfehler'
    if (msg.includes('BLOB_READ_WRITE_TOKEN')) {
      return NextResponse.json({
        error: 'Bild-Upload nicht konfiguriert. Bitte BLOB_READ_WRITE_TOKEN in Vercel Environment Variables setzen.',
      }, { status: 503 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
