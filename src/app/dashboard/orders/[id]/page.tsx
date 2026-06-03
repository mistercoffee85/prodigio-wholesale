import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { formatPrice, STATUS_LABELS } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export async function generateMetadata({ params }: { params: { id: string } }) {
  return { title: `Bestellung #${params.id} – PRO.DI.GIO` }
}

const STATUS_COLOR: Record<string, string> = {
  PENDING:   'badge-yellow',
  CONFIRMED: 'badge-blue',
  PROCESSING:'badge-blue',
  SHIPPED:   'badge-green',
  DELIVERED: 'badge-green',
  CANCELLED: 'badge-red',
}

const PAYMENT_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Banküberweisung',
  NET_30:        'Rechnung Net 30',
  STRIPE:        'Kreditkarte',
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.user.status !== 'APPROVED') redirect('/login?error=pending')

  const order = await prisma.order.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            select: { name: true, emoji: true, slug: true, images: true, brand: true },
          },
        },
      },
    },
  })

  if (!order) notFound()

  const subtotal    = Number(order.subtotal)
  const shipping    = Number(order.shippingCost)
  const tax         = Number(order.tax)
  const total       = Number(order.total)
  const isPaid      = order.paymentStatus === 'PAID'
  const paymentBadge= isPaid ? 'badge-green' : order.paymentStatus === 'UNPAID' ? 'badge-red' : 'badge-yellow'

  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh', background: '#f8f9fb' }}>

        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, var(--forest) 0%, #1a3d28 100%)',
          color: 'white', padding: 'clamp(24px,5vw,40px) clamp(20px,6vw,80px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Link href="/dashboard" style={{ color: 'rgba(255,255,255,.6)', textDecoration: 'none', fontSize: 13 }}>
              ← Mein Konto
            </Link>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(22px,4vw,32px)', fontWeight: 700 }}>
            Bestellung #{order.orderNumber}
          </h1>
          <p style={{ opacity: .65, marginTop: 6, fontSize: 13 }}>
            Aufgegeben am {format(order.createdAt, "dd. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: de })}
          </p>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(24px,4vw,48px) clamp(16px,4vw,32px)' }}>

          {/* Status Bar */}
          <div className="card" style={{ padding: 'clamp(14px,3vw,20px) clamp(16px,4vw,28px)', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <div style={{ flex: '1 1 140px', minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 6 }}>Bestellstatus</div>
              <span className={`badge ${STATUS_COLOR[order.status] ?? 'badge-gray'}`}>
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>
            <div style={{ flex: '1 1 140px', minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 6 }}>Zahlungsstatus</div>
              <span className={`badge ${paymentBadge}`}>
                {STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
              </span>
            </div>
            <div style={{ flex: '1 1 140px', minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 6 }}>Zahlungsart</div>
              <span style={{ fontSize: 14, fontWeight: 600, wordBreak: 'break-word' }}>
                {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
              </span>
            </div>
            {order.shippedAt && (
              <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 6 }}>Versandt am</div>
                <span style={{ fontSize: 14 }}>{format(order.shippedAt, 'dd. MMM yyyy', { locale: de })}</span>
              </div>
            )}
            {order.deliveredAt && (
              <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 6 }}>Geliefert am</div>
                <span style={{ fontSize: 14 }}>{format(order.deliveredAt, 'dd. MMM yyyy', { locale: de })}</span>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ padding: 'clamp(12px,3vw,16px) clamp(16px,4vw,24px)', borderBottom: '1px solid var(--gray-100)', fontWeight: 700, fontSize: 15 }}>
              Bestellte Artikel ({order.items.length})
            </div>
            <div>
              {order.items.map((item, i) => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12,
                  padding: 'clamp(12px,3vw,16px) clamp(16px,4vw,24px)',
                  borderBottom: i < order.items.length - 1 ? '1px solid var(--gray-50)' : 'none',
                }}>
                  <div style={{ fontSize: 32, width: 48, textAlign: 'center', flexShrink: 0 }}>
                    {item.product.emoji}
                  </div>
                  <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{item.product.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{item.product.brand}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 'auto' }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{formatPrice(Number(item.total))}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                      {item.quantity} × {formatPrice(Number(item.unitPrice))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 24 }}>

            {/* Cost Summary */}
            <div className="card" style={{ padding: 'clamp(16px,4vw,24px) clamp(16px,4vw,28px)' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Kostenübersicht</h2>
              {[
                ['Zwischensumme', formatPrice(subtotal)],
                ['Versand', shipping === 0 ? 'Kostenlos' : formatPrice(shipping)],
                ['MwSt. (8,1 %)', formatPrice(tax)],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14, color: 'var(--gray-600)' }}>
                  <span>{label}</span><span>{value}</span>
                </div>
              ))}
              <div style={{ borderTop: '2px solid var(--forest)', marginTop: 8, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 17 }}>
                <span>Total</span>
                <span style={{ color: 'var(--forest)' }}>{formatPrice(total)}</span>
              </div>
              {order.dueDate && !isPaid && (
                <div style={{ marginTop: 16, padding: '10px 14px', background: '#fff7ed', border: '1px solid #fcd9b6', borderRadius: 8, fontSize: 12, color: '#c2430c' }}>
                  <strong>Zahlungsfrist:</strong> {format(order.dueDate, 'dd. MMMM yyyy', { locale: de })}
                </div>
              )}
            </div>

            {/* Payment Info */}
            {!isPaid && order.paymentMethod === 'BANK_TRANSFER' && (
              <div className="card" style={{ padding: 'clamp(16px,4vw,24px) clamp(16px,4vw,28px)' }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Bankdaten</h2>
                {[
                  ['Empfänger', 'PRO.DI.GIO GmbH'],
                  ['IBAN', 'CH56 0483 5012 3456 7800 9'],
                  ['Bank', 'UBS Basel'],
                  ['Verwendungszweck', `#${order.orderNumber}`],
                  ['Betrag', formatPrice(total)],
                  ['Zahlungsziel', '14 Tage'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10, fontSize: 13 }}>
                    <span style={{ color: 'var(--gray-400)', minWidth: 100, flexShrink: 0 }}>{label}</span>
                    <span style={{ fontWeight: 600, wordBreak: 'break-word', minWidth: 0, flex: 1 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            {order.notes && (
              <div className="card" style={{ padding: 'clamp(16px,4vw,24px) clamp(16px,4vw,28px)' }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Anmerkungen</h2>
                <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.7 }}>{order.notes}</p>
              </div>
            )}

          </div>

          {/* Actions */}
          <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/dashboard" className="btn btn-outline" style={{ padding: '10px 24px', flex: '1 1 auto', textAlign: 'center' }}>
              ← Zurück zum Konto
            </Link>
            <Link href="/products" className="btn btn-primary" style={{ padding: '10px 24px', flex: '1 1 auto', textAlign: 'center' }}>
              Weiter bestellen →
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
