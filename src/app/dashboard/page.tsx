// v2
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { formatPrice, STATUS_LABELS } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.user.status !== 'APPROVED') redirect('/login?error=pending')

  const [orders, user] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.user.id },
      include: { items: { include: { product: { select: { name: true, emoji: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: true },
    }),
  ])

  const totalSpent  = orders.filter(o => o.paymentStatus === 'PAID').reduce((s, o) => s + Number(o.total), 0)
  const totalOrders = orders.length
  const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').length

  const priceGroupColor = session.user.priceGroup === 'VIP' ? '#7c3aed' : session.user.priceGroup === 'PREMIUM' ? '#c2430c' : '#1a9e7a'
  const priceGroupBg    = session.user.priceGroup === 'VIP' ? '#f5f3ff' : session.user.priceGroup === 'PREMIUM' ? '#fff7ed' : '#f0fdf9'

  const ORDER_COLOR: Record<string, string> = {
    PENDING: 'badge-yellow', CONFIRMED: 'badge-blue', PROCESSING: 'badge-blue',
    SHIPPED: 'badge-green', DELIVERED: 'badge-green', CANCELLED: 'badge-red',
  }

  return (
    <>
      <Header />
      <style>{`
        .dash-stat:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); transition: all .2s; }
        .order-row:hover { background: var(--gray-50); }
        .order-row { transition: background .15s; }
      `}</style>

      <main style={{ minHeight: '80vh', background: '#f8f9fb' }}>

        {/* Hero banner */}
        <div style={{
          background: 'linear-gradient(135deg, var(--forest) 0%, #1a3d28 70%, #0d2218 100%)',
          color: 'white', padding: '48px 80px 56px', position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative bg pattern */}
          <div style={{ position: 'absolute', inset: 0, opacity: .04,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: 400, height: 400,
            background: 'radial-gradient(circle, rgba(26,158,122,.18) 0%, transparent 70%)', pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2.5, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 12 }}>Mein Konto</div>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 34, fontWeight: 700, marginBottom: 8, lineHeight: 1.2 }}>
                Willkommen, {user?.name?.split(' ')[0]}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {user?.company?.name && (
                  <span style={{ fontSize: 14, opacity: .7 }}>🏢 {user.company.name}</span>
                )}
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
                  background: priceGroupBg, color: priceGroupColor,
                }}>
                  {session.user.priceGroup === 'VIP' ? '⭐ VIP' : session.user.priceGroup === 'PREMIUM' ? '🏆 Premium' : '✓ Standard'} Preise
                </span>
              </div>
            </div>
            <Link href="/products" style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px',
              background: 'white', color: 'var(--black)', borderRadius: 'var(--radius-lg)',
              textDecoration: 'none', fontWeight: 700, fontSize: 14,
              boxShadow: '0 4px 16px rgba(0,0,0,.2)',
            }}>
              🛍️ Neu bestellen
            </Link>
          </div>

          {/* Stat cards inside banner */}
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 36 }}>
            {[
              { label: 'Bestellungen gesamt', value: totalOrders.toString(), icon: '📦', sub: totalOrders === 0 ? 'Noch keine' : `${pendingOrders} in Bearbeitung` },
              { label: 'Bezahlter Umsatz',    value: formatPrice(totalSpent),   icon: '💰', sub: 'Alle bezahlten Bestellungen' },
              { label: 'Preisgruppe',          value: STATUS_LABELS[session.user.priceGroup] ?? session.user.priceGroup, icon: session.user.priceGroup === 'VIP' ? '⭐' : session.user.priceGroup === 'PREMIUM' ? '🏆' : '🏷️', sub: 'Ihre Konditionen' },
            ].map(s => (
              <div key={s.label} className="dash-stat" style={{
                background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,.15)', borderRadius: 'var(--radius-lg)',
                padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16,
                cursor: 'default',
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'white', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '36px 80px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 28, alignItems: 'start' }}>

          {/* Orders */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Meine Bestellungen</h2>
              <Link href="/products" className="btn btn-primary btn-sm">+ Neu bestellen</Link>
            </div>

            {orders.length === 0 ? (
              <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 52 }}>📦</div>
                <p style={{ marginTop: 12, color: 'var(--gray-400)', fontSize: 14 }}>Noch keine Bestellungen</p>
                <p style={{ fontSize: 13, color: 'var(--gray-300)', marginTop: 4 }}>Entdecken Sie unser Sortiment und geben Sie Ihre erste Bestellung auf</p>
                <Link href="/products" className="btn btn-black" style={{ marginTop: 20, display: 'inline-block' }}>Sortiment entdecken →</Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-50)' }}>
                      {['Bestellung', 'Datum', 'Produkte', 'Gesamt', 'Status', 'Zahlung', ''].map(h => (
                        <th key={h} style={{ padding: '11px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gray-400)', borderBottom: '1px solid var(--gray-100)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id} className="order-row" style={{ borderBottom: '1px solid var(--gray-50)', cursor: 'pointer' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <Link href={`/dashboard/orders/${order.id}`} style={{ fontWeight: 700, fontSize: 13, fontFamily: 'monospace', textDecoration: 'none', color: 'var(--forest)' }}>
                            #{order.orderNumber}
                          </Link>
                        </td>
                        <td style={{ padding: '14px 20px', color: 'var(--gray-400)', fontSize: 13, whiteSpace: 'nowrap' }}>
                          {format(order.createdAt, 'dd. MMM yyyy', { locale: de })}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 13, maxWidth: 220 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.items.slice(0, 2).map(i => `${i.product.emoji} ${i.product.name.split(' ').slice(0, 2).join(' ')}`).join(', ')}
                            {order.items.length > 2 && <span style={{ color: 'var(--gray-400)' }}> +{order.items.length - 2}</span>}
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
                          {formatPrice(Number(order.total))}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span className={`badge ${ORDER_COLOR[order.status] ?? 'badge-gray'}`} style={{ fontSize: 11 }}>
                            {STATUS_LABELS[order.status] ?? order.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span className={`badge ${order.paymentStatus === 'PAID' ? 'badge-green' : order.paymentStatus === 'UNPAID' ? 'badge-red' : 'badge-yellow'}`} style={{ fontSize: 11 }}>
                            {STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <Link href={`/dashboard/orders/${order.id}`} style={{ fontSize: 12, color: 'var(--forest)', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                            Details →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Company Info */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 16 }}>Unternehmen</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {user?.company && (
                  <>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{user.company.name}</div>
                      {user.company.uid && <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>UID: {user.company.uid}</div>}
                    </div>
                    {user.company.industry && (
                      <div style={{ fontSize: 13, color: 'var(--gray-600)', display: 'flex', gap: 8 }}>
                        <span>🏭</span> {user.company.industry}
                      </div>
                    )}
                    {user.company.address && (
                      <div style={{ fontSize: 13, color: 'var(--gray-600)', display: 'flex', gap: 8 }}>
                        <span>📍</span> {user.company.address}
                      </div>
                    )}
                  </>
                )}
                <div style={{ fontSize: 13, color: 'var(--gray-600)', display: 'flex', gap: 8 }}>
                  <span>✉️</span> {user?.email}
                </div>
                {user?.phone && (
                  <div style={{ fontSize: 13, color: 'var(--gray-600)', display: 'flex', gap: 8 }}>
                    <span>📞</span> {user.phone}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 16 }}>Schnellzugriff</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { href: '/products', icon: '🛍️', label: 'Sortiment durchsuchen' },
                  { href: '/products?category=bubble-tea', icon: '🧋', label: 'Bubble Tea' },
                  { href: '/products?category=tea-balls', icon: '🍵', label: 'Tea Balls' },
                  { href: '/products?category=sweets', icon: '🍫', label: 'Sweets & Schokolade' },
                ].map(l => (
                  <Link key={l.href} href={l.href} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    borderRadius: 'var(--radius)', textDecoration: 'none',
                    fontSize: 13, fontWeight: 500, color: 'var(--black)',
                    background: 'var(--gray-50)', border: '1px solid var(--gray-100)',
                  }}>
                    <span>{l.icon}</span> {l.label}
                    <span style={{ marginLeft: 'auto', color: 'var(--gray-300)' }}>→</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Support */}
            <div style={{
              padding: '20px', borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--forest) 0%, #1a3d28 100%)',
              color: 'white',
            }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>💬</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Support</div>
              <p style={{ fontSize: 12.5, opacity: .7, lineHeight: 1.6, marginBottom: 14 }}>
                Fragen zu Ihrer Bestellung oder zum Sortiment?
              </p>
              <a href="mailto:contact@prodigio.ch" style={{
                display: 'block', textAlign: 'center', padding: '10px',
                background: 'rgba(255,255,255,.15)', borderRadius: 'var(--radius)',
                color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600,
              }}>
                contact@prodigio.ch
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
