'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import toast from 'react-hot-toast'

interface SyncLog {
  id: string
  source: string
  status: string
  productsFound: number
  productsNew: number
  productsUpdated: number
  productsDeactivated: number
  errorMessage: string | null
  durationMs: number | null
  startedAt: string
  finishedAt: string | null
}

const STATUS_COLOR: Record<string, string> = {
  success: '#1a9e7a',
  error:   '#e85c2a',
  running: '#f5a623',
}

function fmtDuration(ms: number | null) {
  if (!ms) return '—'
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('de-CH', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function SyncPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [pendingReview, setPendingReview] = useState(0)
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') router.push('/')
  }, [status, session, router])

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/sync')
    const data = await res.json()
    setLogs(data.logs ?? [])
    setPendingReview(data.pendingReview ?? 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const triggerSync = async (dryRun = false) => {
    setTriggering(true)
    const res = await fetch('/api/admin/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success(data.message + ' — läuft im Hintergrund (~2 Min)')
      setTimeout(load, 5000)
    } else {
      toast.error(data.error || 'Fehler beim Starten')
    }
    setTriggering(false)
  }

  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh', background: 'var(--cream)', padding: 'clamp(24px,3vw,40px) clamp(16px,3vw,40px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>
              Admin
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
              Lieferanten-Sync
            </h1>
            <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>
              Automatische Synchronisation mit migroweb.it — täglich 02:00 Uhr
            </p>
          </div>

          {/* Status Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Letzter Sync', value: logs[0] ? fmtDate(logs[0].startedAt) : '—', icon: '🕐' },
              { label: 'Status', value: logs[0]?.status ?? '—', icon: logs[0]?.status === 'success' ? '✅' : logs[0]?.status === 'error' ? '❌' : '⏳' },
              { label: 'Neue Produkte zur Prüfung', value: pendingReview.toString(), icon: '📋', alert: pendingReview > 0 },
              { label: 'Zuletzt gefunden', value: logs[0]?.productsFound?.toString() ?? '—', icon: '📦' },
            ].map(card => (
              <div key={card.label} style={{
                background: card.alert ? '#fff7ed' : 'white',
                border: `1px solid ${card.alert ? '#fcd9b6' : 'var(--gray-100)'}`,
                borderRadius: 12, padding: '18px 20px',
              }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{card.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: card.alert ? '#c2430c' : 'var(--black)', lineHeight: 1 }}>{card.value}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Pending review banner */}
          {pendingReview > 0 && (
            <div style={{
              background: '#fff7ed', border: '1px solid #fcd9b6', borderRadius: 12,
              padding: '16px 20px', marginBottom: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
            }}>
              <div>
                <strong style={{ color: '#c2430c' }}>⚠ {pendingReview} neue Produkte</strong>
                <span style={{ color: '#92400e', fontSize: 13.5, marginLeft: 8 }}>
                  wurden importiert aber noch nicht aktiviert — bitte prüfen
                </span>
              </div>
              <a href="/admin/products?filter=pending-sync" className="btn btn-black" style={{ fontSize: 13 }}>
                Jetzt prüfen →
              </a>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => triggerSync(false)}
              disabled={triggering}
              style={{ fontSize: 14 }}
            >
              {triggering ? '⏳ Wird gestartet...' : '▶ Sync jetzt starten'}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => triggerSync(true)}
              disabled={triggering}
              style={{ fontSize: 14 }}
            >
              🔍 Dry Run (nur Vorschau)
            </button>
            <button className="btn btn-ghost" onClick={load} style={{ fontSize: 14 }}>
              🔄 Aktualisieren
            </button>
          </div>

          {/* Sync Log Table */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--gray-100)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--gray-100)', fontWeight: 700, fontSize: 15 }}>
              Sync-Verlauf
            </div>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>Laden...</div>
            ) : logs.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                Noch kein Sync durchgeführt
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                  <thead>
                    <tr style={{ background: 'var(--cream)' }}>
                      {['Gestartet', 'Status', 'Dauer', 'Gefunden', 'Neu', 'Aktualisiert', 'Deaktiviert', 'Fehler'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, fontSize: 12, color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={log.id} style={{ borderTop: '1px solid var(--gray-100)', background: i % 2 === 0 ? 'white' : 'var(--cream)' }}>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{fmtDate(log.startedAt)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                            background: `${STATUS_COLOR[log.status] ?? '#888'}22`,
                            color: STATUS_COLOR[log.status] ?? '#888',
                          }}>{log.status}</span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--gray-400)' }}>{fmtDuration(log.durationMs)}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{log.productsFound}</td>
                        <td style={{ padding: '12px 16px', color: '#1a9e7a', fontWeight: log.productsNew > 0 ? 700 : 400 }}>{log.productsNew > 0 ? `+${log.productsNew}` : '—'}</td>
                        <td style={{ padding: '12px 16px' }}>{log.productsUpdated || '—'}</td>
                        <td style={{ padding: '12px 16px', color: log.productsDeactivated > 0 ? '#e85c2a' : undefined }}>{log.productsDeactivated > 0 ? log.productsDeactivated : '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#e85c2a', fontSize: 12, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.errorMessage || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Setup instructions */}
          <div style={{ marginTop: 32, background: 'white', borderRadius: 14, border: '1px solid var(--gray-100)', padding: '20px 24px' }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>⚙️ Setup — GitHub Secrets konfigurieren</div>
            <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 12 }}>
              Für den automatischen Sync müssen diese Secrets in GitHub hinterlegt sein:
            </p>
            <div style={{ display: 'grid', gap: 6 }}>
              {[
                { key: 'MIGROWEB_URL',  val: 'https://www.migroweb.it' },
                { key: 'MIGROWEB_USER', val: 'Ihr Benutzername' },
                { key: 'MIGROWEB_PASS', val: 'Ihr Passwort' },
                { key: 'MARKUP_FACTOR', val: '1.35  (= 35% Marge auf Einkaufspreis)' },
                { key: 'DATABASE_URL',  val: 'Supabase Connection String' },
                { key: 'DIRECT_URL',    val: 'Supabase Direct URL' },
                { key: 'GITHUB_TOKEN',  val: 'Personal Access Token (für manuellen Trigger)' },
                { key: 'GITHUB_REPO',   val: 'mistercoffee85/prodigio-wholesale' },
              ].map(({ key, val }) => (
                <div key={key} style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
                  <code style={{ background: 'var(--cream)', padding: '2px 8px', borderRadius: 6, fontWeight: 700, minWidth: 160, fontSize: 12 }}>{key}</code>
                  <span style={{ color: 'var(--gray-400)' }}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, fontSize: 12, color: 'var(--gray-400)' }}>
              → GitHub: Settings → Secrets and variables → Actions → New repository secret
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
