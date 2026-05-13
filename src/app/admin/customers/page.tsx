'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { STATUS_LABELS } from '@/lib/utils'

interface Customer {
  id: string; name: string; email: string; status: string; createdAt: string
  company: { name: string; industry: string; uid?: string; priceGroup: string; city: string } | null
  _count: { orders: number }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('PENDING')

  const fetchCustomers = async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/customers?status=${filter}`)
    const data = await res.json()
    setCustomers(data.customers ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchCustomers() }, [filter])

  const handleAction = async (userId: string, action: 'approve' | 'reject', priceGroup?: string) => {
    const res = await fetch('/api/admin/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, priceGroup }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success(data.message)
      fetchCustomers()
    } else {
      toast.error(data.error)
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Kundenverwaltung</h1>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['PENDING', 'APPROVED', 'REJECTED'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '7px 18px', borderRadius: 20, border: '1.5px solid',
            borderColor: filter === s ? 'var(--accent)' : 'var(--gray-200)',
            background: filter === s ? 'var(--accent)' : 'white',
            color: filter === s ? 'white' : 'var(--black)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>{STATUS_LABELS[s] ?? s} {s === 'PENDING' && '⚠️'}</button>
        ))}
      </div>

      <div className="card">
        {loading ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-400)' }}>Wird geladen...</div>
        : customers.length === 0 ? <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-400)' }}>Keine Kunden in dieser Kategorie</div>
        : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Firma</th><th>Kontakt</th><th>Branche</th><th>Preisgruppe</th><th>Bestellungen</th><th>Registriert</th><th>Aktionen</th></tr></thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.company?.name ?? '–'}</div>
                      {c.company?.uid && <div style={{ fontSize: 11.5, color: 'var(--gray-600)' }}>{c.company.uid}</div>}
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{c.name}</div>
                      <a href={`mailto:${c.email}`} style={{ fontSize: 12, color: 'var(--accent)' }}>{c.email}</a>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{c.company?.industry}</td>
                    <td>
                      <span className={`badge ${c.company?.priceGroup === 'VIP' ? 'badge-purple' : c.company?.priceGroup === 'PREMIUM' ? 'badge-blue' : 'badge-gray'}`}>
                        {c.company?.priceGroup ?? 'STANDARD'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{c._count.orders}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--gray-600)' }}>{new Date(c.createdAt).toLocaleDateString('de-CH')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {c.status === 'PENDING' && <>
                          <button className="btn btn-primary btn-sm" onClick={() => handleAction(c.id, 'approve', 'STANDARD')}>Freigeben</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleAction(c.id, 'reject')}>Ablehnen</button>
                        </>}
                        {c.status === 'APPROVED' && <>
                          <button className="btn btn-outline btn-sm" onClick={() => handleAction(c.id, 'approve', 'PREMIUM')}>→ Premium</button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleAction(c.id, 'approve', 'VIP')}>→ VIP</button>
                        </>}
                        {c.status === 'REJECTED' && (
                          <button className="btn btn-outline btn-sm" onClick={() => handleAction(c.id, 'approve', 'STANDARD')}>Doch freigeben</button>
                        )}
                      </div>
                    </td>
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
