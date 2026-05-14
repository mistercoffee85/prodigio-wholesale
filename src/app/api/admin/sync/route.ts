import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

// GET /api/admin/sync — list recent sync logs
export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const logs = await prisma.syncLog.findMany({
    orderBy: { startedAt: 'desc' },
    take: 20,
  })

  const pending = await prisma.product.count({
    where: { supplierSource: 'migroweb', syncManaged: true, active: false },
  })

  return NextResponse.json({ logs, pendingReview: pending })
}

// POST /api/admin/sync — trigger GitHub Actions workflow via API
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const dryRun = body.dryRun === true

  const ghToken = process.env.GITHUB_TOKEN
  const ghRepo  = process.env.GITHUB_REPO // "mistercoffee85/prodigio-wholesale"

  if (!ghToken || !ghRepo) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN oder GITHUB_REPO nicht konfiguriert' },
      { status: 500 }
    )
  }

  // Trigger workflow_dispatch via GitHub API
  const res = await fetch(
    `https://api.github.com/repos/${ghRepo}/actions/workflows/sync-supplier.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ghToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: { dry_run: dryRun ? 'true' : 'false' },
      }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: `GitHub API error: ${text}` }, { status: 500 })
  }

  return NextResponse.json({ message: `Sync${dryRun ? ' (Dry Run)' : ''} gestartet` })
}
