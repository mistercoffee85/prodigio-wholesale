'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { formatPrice, STATUS_LABELS } from '@/lib/utils'

interface OrderItem {
  quantity: number
  unitPrice: number
  total: number
  unit: string
  productName: string
  productSku: string
  product: { name: string; emoji: string; unit: string; supplierSku: string }
}

interface Order {
  id: string; orderNumber: string; status: string; paymentStatus: string
  total: number; subtotal: number; tax: number; shippingCost: number
  paymentMethod: string; shippingOption: string; shippingOptionLocal?: string; shippingPending: boolean
  createdAt: string
  user: { name: string; email: string; company: { name: string } | null }
  items: OrderItem[]
}

const PM_LABELS: Record<string, string> = {
  STRIPE_CARD: '💳 Karte', STRIPE_TWINT: '📱 TWINT', STRIPE_PAYPAL: '🅿️ PayPal',
  BANK_TRANSFER: '🏦 Überweisung', NET_30: '📄 Net30',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [transportInputs, setTransportInputs] = useState<Record<string, string>>({})
  const [savingTransport, setSavingTransport] = useState<string | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    const res = await fetch('/api/orders?limit=100')
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

  const saveTransportCost = async (orderId: string) => {
    const raw = transportInputs[orderId] ?? ''
    const cost = parseFloat(raw.replace(',', '.'))
    if (isNaN(cost) || cost < 0) { toast.error('Ungültiger Betrag'); return }
    setSavingTransport(orderId)
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shippingCost: cost }),
    })
    setSavingTransport(null)
    if (res.ok) { toast.success('Transportkosten gespeichert'); fetchOrders() }
    else toast.error('Fehler beim Speichern')
  }

  const pendingTransport = orders.filter(o => o.shippingPending)

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Bestellungen</h1>

      {/* ── Pending Transport Banner ── */}
      {pendingTransport.length > 0 && (
        <div style={{
          background: '#fff7ed', border: '1px solid #fcd9b6', borderRadius: 10,
          padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>⏳</span>
          <div>
            <strong style={{ color: '#92400e' }}>{pendingTransport.length} Bestellung{pendingTransport.length > 1 ? 'en' : ''} mit offenen Transportkosten</strong>
            <div style={{ fontSize: 13, color: '#b45309', marginTop: 2 }}>
              Bitte Transportkosten eintragen und bestätigen — Kunden warten auf finale Rechnung.
            </div>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-400)' }}>Wird geladen...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nr.</th>
                  <th>Kunde</th>
                  <th>Produkte</th>
                  <th>Betrag</th>
                  <th>Zahlung</th>
                  <th>Lieferung</th>
                  <th>Transport CHF</th>
                  <th>Status</th>
                  <th>Zahlstatus</th>
                  <th>Datum</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <>
                    <tr key={o.id}
                      style={{ cursor: 'pointer', background: o.shippingPending ? '#fffbeb' : undefined }}
                      onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                    >
                      <td style={{ fontWeight: 700, fontSize: 13 }}>
                        #{o.orderNumber}
                        {o.shippingPending && <span style={{ marginLeft: 6, fontSize: 10, background: '#fde68a', color: '#92400e', padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>Transport offen</span>}
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {o.user.company?.name ?? o.user.name}<br />
                        <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{o.user.email}</span>
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--gray-600)', maxWidth: 200 }}>
                        {o.items.slice(0, 2).map(i => `${i.product.emoji} ${i.quantity}×`).join(', ')}
                        {o.items.length > 2 && ` +${o.items.length - 2}`}
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatPrice(Number(o.total))}</td>
                      <td style={{ fontSize: 12.5 }}>{PM_LABELS[o.paymentMethod] ?? o.paymentMethod}</td>
                      <td style={{ fontSize: 11.5, lineHeight: 1.6 }}>
                        {/* Primary shipping option */}
                        <div style={{ color: o.shippingPending ? '#b45309' : 'var(--gray-600)', fontWeight: 600 }}>
                          {o.shippingOption === 'SELF_PICKUP'   && '🚗 Ex Works IT'}
                          {o.shippingOption === 'LOCAL_PICKUP'  && '🏢 Abholung Basel'}
                          {o.shippingOption === 'LOCAL_DELIVERY'    && '🚚 Lieferung Basel'}
                          {o.shippingOption === 'PRODIGIO_DELIVERS' && '🚚 Transport IT'}
                        </div>
                        {/* Secondary option for mixed carts */}
                        {o.shippingOptionLocal && (
                          <div style={{ color: 'var(--gray-500)', fontSize: 11 }}>
                            {o.shippingOptionLocal === 'LOCAL_PICKUP'   ? '🏢 Abholung Basel' : '🚚 Lieferung Basel'}
                          </div>
                        )}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        {(o.shippingOption === 'PRODIGIO_DELIVERS' || o.shippingOption === 'LOCAL_DELIVERY') ? (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              step="0.05"
                              placeholder={o.shippingPending ? 'offen' : String(Number(o.shippingCost).toFixed(2))}
                              value={transportInputs[o.id] ?? (o.shippingPending ? '' : Number(o.shippingCost).toFixed(2))}
                              onChange={e => setTransportInputs(prev => ({ ...prev, [o.id]: e.target.value }))}
                              style={{
                                width: 80, padding: '4px 8px', fontSize: 13,
                                border: `1.5px solid ${o.shippingPending ? '#fcd9b6' : 'var(--gray-200)'}`,
                                borderRadius: 6, outline: 'none',
                              }}
                            />
                            <button
                              onClick={() => saveTransportCost(o.id)}
                              disabled={savingTransport === o.id}
                              style={{
                                padding: '4px 10px', fontSize: 12, fontWeight: 600,
                                background: 'var(--accent)', color: 'white',
                                border: 'none', borderRadius: 6, cursor: 'pointer',
                              }}
                            >
                              {savingTransport === o.id ? '…' : '✓'}
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <select value={o.status}
                          onClick={e => e.stopPropagation()}
                          onChange={e => updateStatus(o.id, 'status', e.target.value)}
                          style={{ fontSize: 12, padding: '4px 8px', border: '1px solid var(--gray-200)', borderRadius: 6, cursor: 'pointer' }}>
                          {['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'].map(s => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select value={o.paymentStatus}
                          onClick={e => e.stopPropagation()}
                          onChange={e => updateStatus(o.id, 'paymentStatus', e.target.value)}
                          style={{ fontSize: 12, padding: '4px 8px', border: '1px solid var(--gray-200)', borderRadius: 6, cursor: 'pointer' }}>
                          {['UNPAID','PAID','PARTIALLY_PAID','REFUNDED'].map(s => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--gray-600)' }}>
                        {new Date(o.createdAt).toLocaleDateString('de-CH')}
                      </td>
                    </tr>

                    {/* ── Expanded detail row ── */}
                    {expanded === o.id && (
                      <tr key={`${o.id}-detail`}>
                        <td colSpan={10} style={{ background: '#f8f9fb', padding: '16px 24px', borderBottom: '2px solid var(--gray-200)' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--gray-600)' }}>
                            Bestelldetails #{o.orderNumber}
                          </div>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--gray-200)' }}>
                                <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--gray-500)', fontWeight: 600 }}>Produkt</th>
                                <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--gray-500)', fontWeight: 600 }}>Art.Nr. (Migroweb)</th>
                                <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--gray-500)', fontWeight: 600 }}>Menge (VE)</th>
                                <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--gray-500)', fontWeight: 600 }}>VE Inhalt</th>
                                <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--gray-500)', fontWeight: 600 }}>Betrag</th>
                              </tr>
                            </thead>
                            <tbody>
                              {o.items.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                  <td style={{ padding: '8px 8px' }}>
                                    {item.product.emoji} <strong>{item.productName || item.product.name}</strong>
                                  </td>
                                  <td style={{ padding: '8px 8px', fontFamily: 'monospace', color: 'var(--gray-500)', fontSize: 12 }}>
                                    {item.productSku || item.product.supplierSku || '—'}
                                  </td>
                                  <td style={{ padding: '8px 8px', textAlign: 'center', fontWeight: 700 }}>
                                    {item.quantity} VE
                                  </td>
                                  <td style={{ padding: '8px 8px', color: 'var(--gray-500)', fontSize: 12 }}>
                                    {item.unit || item.product.unit || '—'}
                                  </td>
                                  <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 700 }}>
                                    {formatPrice(Number(item.total))}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Totals */}
                          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                            <div style={{ minWidth: 260, fontSize: 13 }}>
                              {[
                                ['Warenkorb', formatPrice(Number(o.subtotal))],
                                ['MwSt.', formatPrice(Number(o.tax))],
                                ['Transport', o.shippingOption === 'SELF_PICKUP' ? '🚗 Ex Works' : (o.shippingPending ? '⏳ offen' : formatPrice(Number(o.shippingCost)))],
                              ].map(([l, v]) => (
                                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: 'var(--gray-500)' }}>
                                  <span>{l}</span><span>{v}</span>
                                </div>
                              ))}
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, borderTop: '2px solid var(--black)', paddingTop: 8, marginTop: 6 }}>
                                <span>Total</span><span>{formatPrice(Number(o.total))}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
