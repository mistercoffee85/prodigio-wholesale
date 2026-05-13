'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { formatPrice, STATUS_LABELS } from '@/lib/utils'

interface Order {
  id: string; orderNumber: string; status: string; paymentStatus: string
  total: number; paymentMethod: string; createdAt: string
  user: { name: string; company: { name: string } | null }
  items: Array<{ quantity: number; product: { name: string; emoji: string } }>
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    setLoading(true)
    const res = await fetch('/api/orders?limit=50')
    const data = await res.json()
    setOrders(data.orders ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [])

  const updateStatus = async (id: string, field: string, value: string) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    if (res.ok) { toast.success('Aktualisiert'); fetchOrders() }
    else toast.error('Fehler')
  }

  const PM_LABELS: Record<string, string> = { STRIPE_CARD: '💳 Karte', STRIPE_TWINT: '📱 TWINT', BANK_TRANSFER: '🏦 Überweisung', NET_30: '📄 Net30' }

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Bestellungen</h1>
      <div className="card">
        {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-400)' }}>Wird geladen...</div>
        : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nr.</th><th>Kunde</th><th>Produkte</th><th>Betrag</th><th>Zahlung</th><th>Status</th><th>Zahlstatus</th><th>Datum</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700, fontSize: 13 }}>#{o.orderNumber}</td>
                    <td style={{ fontSize: 13 }}>{o.user.company?.name ?? o.user.name}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--gray-600)', maxWidth: 200 }}>
                      {o.items.slice(0, 2).map(i => `${i.product.emoji} ${i.quantity}x`).join(', ')}
                      {o.items.length > 2 && ` +${o.items.length - 2}`}
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatPrice(Number(o.total))}</td>
                    <td style={{ fontSize: 12.5 }}>{PM_LABELS[o.paymentMethod] ?? o.paymentMethod}</td>
                    <td>
                      <select value={o.status} onChange={e => updateStatus(o.id, 'status', e.target.value)}
                        style={{ fontSize: 12, padding: '4px 8px', border: '1px solid var(--gray-200)', borderRadius: 6, cursor: 'pointer' }}>
                        {['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'].map(s => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select value={o.paymentStatus} onChange={e => updateStatus(o.id, 'paymentStatus', e.target.value)}
                        style={{ fontSize: 12, padding: '4px 8px', border: '1px solid var(--gray-200)', borderRadius: 6, cursor: 'pointer' }}>
                        {['UNPAID','PAID','PARTIALLY_PAID','REFUNDED'].map(s => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--gray-600)' }}>{new Date(o.createdAt).toLocaleDateString('de-CH')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
