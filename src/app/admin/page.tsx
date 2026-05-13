import { prisma } from '@/lib/prisma'
import { formatPrice, STATUS_LABELS } from '@/lib/utils'
import Link from 'next/link'

// Server component — no event handlers allowed

export const revalidate = 30

export default async function AdminDashboard() {
  const [totalOrders, pendingCustomers, totalRevenue, totalProducts, recentOrders, recentCustomers] = await Promise.all([
    prisma.order.count(),
    prisma.user.count({ where: { status: 'PENDING', role: 'CUSTOMER' } }),
    prisma.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { total: true } }),
    prisma.product.count({ where: { active: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' }, take: 5,
      include: { user: { include: { company: true } }, items: { take: 1, include: { product: { select: { name: true, emoji: true } } } } },
    }),
    prisma.user.findMany({
      where: { role: 'CUSTOMER', status: 'PENDING' },
      orderBy: { createdAt: 'desc' }, take: 5,
      include: { company: true },
    }),
  ])

  const revenue = Number(totalRevenue._sum.total ?? 0)

  const STATS = [
    { label: 'Gesamtumsatz', value: formatPrice(revenue), icon: '💰', color: 'var(--accent)', bg: 'var(--accent-light)', trend: '+12%' },
    { label: 'Bestellungen', value: totalOrders.toString(), icon: '📦', color: '#2563eb', bg: '#eff6ff', trend: `${totalOrders} total` },
    { label: 'Ausstehend', value: pendingCustomers.toString(), icon: '⏳', color: '#c2430c', bg: '#fff7ed', trend: 'Freigabe nötig', alert: pendingCustomers > 0 },
    { label: 'Aktive Produkte', value: totalProducts.toString(), icon: '🛍️', color: '#6d28d9', bg: '#f5f3ff', trend: 'im Sortiment' },
  ]

  const ORDER_STATUS_COLORS: Record<string, string> = {
    PENDING: 'badge-yellow', CONFIRMED: 'badge-blue', PROCESSING: 'badge-blue',
    SHIPPED: 'badge-green', DELIVERED: 'badge-green', CANCELLED: 'badge-red',
  }

  return (
    <div style={{ padding: '40px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>
          Übersicht Ihres Grosshandels
        </p>
      </div>

      {/* Alert: Pending Customers */}
      {pendingCustomers > 0 && (
        <Link href="/admin/customers" style={{ display: 'block', marginBottom: 28, textDecoration: 'none' }}>
          <div style={{
            background: '#fff7ed', border: '1px solid #fcd9b6', borderRadius: 'var(--radius-lg)',
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
            transition: 'box-shadow .2s',
          }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#c2430c' }}>
                {pendingCustomers} {pendingCustomers === 1 ? 'Kunde wartet' : 'Kunden warten'} auf Freigabe
              </div>
              <div style={{ fontSize: 13, color: '#92400e', opacity: .8, marginTop: 2 }}>
                Klicken Sie hier, um Kunden zu prüfen und freizugeben.
              </div>
            </div>
            <span style={{ color: '#c2430c', fontWeight: 700, fontSize: 13 }}>Jetzt prüfen →</span>
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 36 }}>
        {STATS.map(s => (
          <div key={s.label} className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {s.icon}
              </div>
              {s.alert && (
                <span style={{ background: '#fef2f2', color: '#c81f1f', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>Aktion nötig</span>
              )}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--black)', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 13.5, color: 'var(--gray-400)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.trend}</div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent Orders */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Neueste Bestellungen</h2>
            <Link href="/admin/orders" style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 600 }}>Alle →</Link>
          </div>
          <div>
            {recentOrders.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px' }}>
                <p style={{ fontSize: 14 }}>Noch keine Bestellungen</p>
              </div>
            ) : recentOrders.map(o => (
              <div key={o.id} style={{ padding: '14px 24px', borderBottom: '1px solid var(--gray-50)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {o.items[0]?.product.emoji ?? '📦'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--black)' }}>
                    #{o.orderNumber}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.user.company?.name ?? o.user.name}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{formatPrice(Number(o.total))}</div>
                  <span className={`badge ${ORDER_STATUS_COLORS[o.status] ?? 'badge-gray'}`} style={{ fontSize: 10, marginTop: 4 }}>
                    {STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Customers */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Ausstehende Kunden</h2>
            <Link href="/admin/customers" style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 600 }}>Verwalten →</Link>
          </div>
          <div>
            {recentCustomers.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px' }}>
                <p style={{ fontSize: 14 }}>✅ Alle Kunden bearbeitet</p>
              </div>
            ) : recentCustomers.map(c => (
              <div key={c.id} style={{ padding: '14px 24px', borderBottom: '1px solid var(--gray-50)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                  {(c.company?.name ?? c.name)[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.company?.name ?? c.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.company?.industry ?? c.email}
                  </div>
                </div>
                <span className="badge badge-yellow" style={{ fontSize: 10 }}>Ausstehend</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { href: '/admin/customers', icon: '👥', label: 'Kunden verwalten', sub: 'Freigaben & Preisgruppen' },
          { href: '/admin/orders',    icon: '📦', label: 'Bestellungen',      sub: 'Status & Zahlungen' },
          { href: '/admin/products',  icon: '🛍️', label: 'Produkte',           sub: 'Lagerbestand & Status' },
        ].map(a => (
          <Link key={a.href} href={a.href} className="quick-action" style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px',
            background: 'white', border: '1px solid var(--gray-100)', borderRadius: 'var(--radius-lg)',
            textDecoration: 'none', color: 'var(--black)',
            boxShadow: 'var(--shadow-xs)',
          }}>
            <span style={{ fontSize: 28 }}>{a.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{a.label}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{a.sub}</div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--gray-300)', fontSize: 16 }}>→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
