'use client'
import { useEffect, useState, useCallback } from 'react'

interface ActivityEntry {
  id: string
  type: string
  payload: Record<string, unknown>
  createdAt: string
  user: { name: string; email: string; company: { name: string } | null }
}

interface CartEntry {
  id: string
  updatedAt: string
  subtotal: number
  items: Array<{ name: string; quantity: number; unitPrice: number; total: number }>
  user: { name: string; email: string; company: { name: string } | null }
}

const TYPE_META: Record<string, { label: string; color: string; icon: string }> = {
  login:        { label: 'Login',            color: '#10b981', icon: '🔑' },
  cart_add:     { label: 'Produkt hinzugefügt', color: '#6366f1', icon: '🛒' },
  cart_remove:  { label: 'Produkt entfernt',    color: '#f59e0b', icon: '🗑️' },
  cart_clear:   { label: 'Warenkorb geleert',   color: '#ef4444', icon: '❌' },
  checkout_start:  { label: 'Checkout gestartet',  color: '#8b5cf6', icon: '💳' },
  reminder_sent:   { label: 'Erinnerung gesendet', color: '#0ea5e9', icon: '📧' },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'gerade eben'
  if (mins < 60) return `vor ${mins} Min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `vor ${hrs} Std`
  return `vor ${Math.floor(hrs / 24)} Tagen`
}

function formatPrice(n: number) {
  return 'CHF ' + Number(n).toFixed(2)
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityEntry[]>([])
  const [carts, setCarts] = useState<CartEntry[]>([])
  const [tab, setTab] = useState<'feed' | 'carts'>('feed')
  const [loading, setLoading] = useState(true)
  const [reminderSent, setReminderSent] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    const [logsRes, cartsRes] = await Promise.all([
      fetch('/api/admin/activity?limit=200'),
      fetch('/api/admin/carts'),
    ])
    if (logsRes.ok) setLogs(await logsRes.json())
    if (cartsRes.ok) setCarts(await cartsRes.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [load])

  const sendReminder = async (cart: CartEntry) => {
    const res = await fetch('/api/admin/send-cart-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: cart.id }),
    })
    if (res.ok) setReminderSent(prev => ({ ...prev, [cart.id]: true }))
  }

  const activeCarts = carts.filter(c => Array.isArray(c.items) && c.items.length > 0)

  return (
    <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 1100 }}>
      <style>{`
        .act-tab { padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid var(--gray-100); background: white; color: var(--gray-500); transition: all .15s; }
        .act-tab.active { background: var(--accent); color: white; border-color: var(--accent); }
        .act-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; border-radius: 10px; background: white; margin-bottom: 6px; border: 1px solid var(--gray-100); }
        .act-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .cart-card { background: white; border: 1px solid var(--gray-100); border-radius: 12px; padding: 18px 20px; margin-bottom: 10px; }
        .badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block; margin-right: 6px; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Archivo',sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
            Kundenaktivität
          </h1>
          <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>
            <span className="badge-dot" />
            Live · aktualisiert alle 30 Sek
          </div>
        </div>
        <button onClick={load} style={{ fontSize: 12, padding: '8px 16px', borderRadius: 20, border: '1.5px solid var(--gray-100)', background: 'white', cursor: 'pointer', color: 'var(--gray-600)' }}>
          ↻ Aktualisieren
        </button>
      </div>

      {/* Stat Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Aktive Warenkörbe', value: activeCarts.length, color: '#6366f1' },
          { label: 'Logins heute', value: logs.filter(l => l.type === 'login' && new Date(l.createdAt) > new Date(Date.now() - 86400000)).length, color: '#10b981' },
          { label: 'Produkte hinzugefügt', value: logs.filter(l => l.type === 'cart_add').length, color: '#8b5cf6' },
          { label: 'Verlassene Körbe', value: activeCarts.filter(c => Date.now() - new Date(c.updatedAt).getTime() > 3600000).length, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid var(--gray-100)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--gray-400)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`act-tab${tab === 'feed' ? ' active' : ''}`} onClick={() => setTab('feed')}>
          Aktivitäts-Feed ({logs.length})
        </button>
        <button className={`act-tab${tab === 'carts' ? ' active' : ''}`} onClick={() => setTab('carts')}>
          Offene Warenkörbe ({activeCarts.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--gray-400)' }}>Laden…</div>
      ) : tab === 'feed' ? (
        <div>
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--gray-400)', background: 'white', borderRadius: 12, border: '1px solid var(--gray-100)' }}>
              Noch keine Aktivitäten aufgezeichnet
            </div>
          ) : logs.map(log => {
            const meta = TYPE_META[log.type] ?? { label: log.type, color: '#94a3b8', icon: '•' }
            const payload = log.payload as Record<string, unknown>
            return (
              <div key={log.id} className="act-row">
                <div className="act-icon" style={{ background: meta.color + '18' }}>{meta.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--black)' }}>
                      {log.user.name}
                      {log.user.company && <span style={{ fontWeight: 400, color: 'var(--gray-400)', marginLeft: 6 }}>· {log.user.company.name}</span>}
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--gray-400)', flexShrink: 0 }}>{timeAgo(log.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: meta.color, fontWeight: 600, marginTop: 2 }}>
                    {meta.label}
                    {Boolean(payload.name) && <span style={{ fontWeight: 400, color: 'var(--gray-500)', marginLeft: 6 }}>· {String(payload.name)}{payload.quantity != null ? ` × ${String(payload.quantity)}` : ''}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div>
          {activeCarts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--gray-400)', background: 'white', borderRadius: 12, border: '1px solid var(--gray-100)' }}>
              Keine offenen Warenkörbe
            </div>
          ) : activeCarts.map(cart => {
            const items = cart.items as CartEntry['items']
            const isAbandoned = Date.now() - new Date(cart.updatedAt).getTime() > 3600000
            return (
              <div key={cart.id} className="cart-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--black)' }}>
                      {cart.user.name}
                      {isAbandoned && (
                        <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 700, color: '#f59e0b', background: '#fef3c7', padding: '2px 8px', borderRadius: 10 }}>
                          Verlassen
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                      {cart.user.company?.name ?? cart.user.email} · {timeAgo(cart.updatedAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>
                      {formatPrice(Number(cart.subtotal))}
                    </div>
                    {isAbandoned && (
                      <button
                        onClick={() => sendReminder(cart)}
                        disabled={reminderSent[cart.id]}
                        style={{
                          fontSize: 12, padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                          border: '1.5px solid var(--accent)', fontWeight: 600,
                          background: reminderSent[cart.id] ? 'var(--accent)' : 'white',
                          color: reminderSent[cart.id] ? 'white' : 'var(--accent)',
                        }}
                      >
                        {reminderSent[cart.id] ? '✓ Gesendet' : '📧 Erinnerung'}
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '4px 0', borderBottom: i < items.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                      <span style={{ color: 'var(--gray-600)' }}>{item.name}</span>
                      <span style={{ color: 'var(--gray-500)' }}>{item.quantity} × {formatPrice(item.unitPrice)} = <strong>{formatPrice(item.total)}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
