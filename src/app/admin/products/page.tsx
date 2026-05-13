'use client'
import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface Category { id: string; name: string; slug: string }

interface Product {
  id: string; name: string; slug: string; brand: string; emoji: string
  price: number; comparePrice: number | null; stock: number; moq: number
  badge: string | null; active: boolean; sku: string | null; unit: string
  description: string; categoryId: string; bgGradient: string | null
  images: string[]; details: Record<string, string>
  category: { name: string }
}

const BADGES = ['', 'hot', 'new', 'sale']
const BADGE_LABELS: Record<string, string> = { '': '–', hot: '🔥 Bestseller', new: '✨ Neu', sale: '💰 Sale' }

const EMPTY_FORM = {
  name: '', slug: '', brand: '', emoji: '📦', description: '', unit: '',
  categoryId: '', price: '', comparePrice: '', moq: '6', stock: '100',
  badge: '', sku: '', bgGradient: '', active: true,
  images: ['', '', ''],
  details: [{ key: '', value: '' }],
}

type FormState = typeof EMPTY_FORM

function slugify(s: string) {
  return s.toLowerCase().replace(/[äöü]/g, c => ({ ä: 'ae', ö: 'oe', ü: 'ue' }[c] ?? c))
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function AdminProductsPage() {
  const [products, setProducts]   = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterBadge, setFilterBadge] = useState('')

  // Bulk price edits: map id → { price, comparePrice }
  const [priceEdits, setPriceEdits] = useState<Record<string, { price: string; comparePrice: string }>>({})
  const [saving, setSaving]       = useState(false)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm]           = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [prodRes, catRes] = await Promise.all([
      fetch('/api/products?limit=200'),
      fetch('/api/categories'),
    ])
    const prodData = await prodRes.json()
    const catData  = await catRes.json()
    setProducts(prodData.products ?? [])
    setCategories(catData ?? [])
    setPriceEdits({})
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Filtered list ──────────────────────────────────────────────
  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    if (q && !p.name.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q) && !(p.sku ?? '').toLowerCase().includes(q)) return false
    if (filterCat && p.categoryId !== filterCat) return false
    if (filterBadge && p.badge !== filterBadge) return false
    return true
  })

  const changedCount = Object.keys(priceEdits).length

  // ── Bulk save prices ───────────────────────────────────────────
  const saveBulkPrices = async () => {
    const updates = Object.entries(priceEdits).map(([id, v]) => ({
      id,
      price: parseFloat(v.price),
      comparePrice: v.comparePrice ? parseFloat(v.comparePrice) : null,
    })).filter(u => !isNaN(u.price) && u.price > 0)

    if (!updates.length) return
    setSaving(true)
    const res = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success(`${updates.length} Preise gespeichert ✓`)
      fetchAll()
    } else toast.error('Fehler beim Speichern')
  }

  // ── Toggle active ──────────────────────────────────────────────
  const toggleActive = async (id: string, active: boolean) => {
    await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    fetchAll()
  }

  // ── Update badge ───────────────────────────────────────────────
  const updateBadge = async (id: string, badge: string) => {
    await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ badge: badge || null }),
    })
    setProducts(ps => ps.map(p => p.id === id ? { ...p, badge: badge || null } : p))
    toast.success('Badge aktualisiert')
  }

  // ── Open Add modal ─────────────────────────────────────────────
  const openAdd = () => {
    setEditProduct(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  // ── Open Edit modal ────────────────────────────────────────────
  const openEdit = (p: Product) => {
    setEditProduct(p)
    setForm({
      name: p.name, slug: p.slug, brand: p.brand, emoji: p.emoji,
      description: p.description, unit: p.unit,
      categoryId: p.categoryId,
      price: String(p.price), comparePrice: p.comparePrice ? String(p.comparePrice) : '',
      moq: String(p.moq), stock: String(p.stock),
      badge: p.badge ?? '', sku: p.sku ?? '', bgGradient: p.bgGradient ?? '',
      active: p.active,
      images: [...p.images, '', '', ''].slice(0, 3),
      details: Object.entries(p.details ?? {}).map(([key, value]) => ({ key, value }))
        .concat([{ key: '', value: '' }]),
    })
    setModalOpen(true)
  }

  // ── Submit form ────────────────────────────────────────────────
  const submitForm = async () => {
    if (!form.name || !form.price || !form.categoryId || !form.unit || !form.description) {
      toast.error('Bitte alle Pflichtfelder ausfüllen')
      return
    }
    setSubmitting(true)

    const detailsObj: Record<string, string> = {}
    form.details.forEach(({ key, value }) => { if (key && value) detailsObj[key] = value })

    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      brand: form.brand,
      emoji: form.emoji,
      description: form.description,
      unit: form.unit,
      categoryId: form.categoryId,
      price: parseFloat(form.price),
      comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
      moq: parseInt(form.moq) || 6,
      stock: parseInt(form.stock) || 0,
      badge: form.badge || null,
      sku: form.sku || undefined,
      bgGradient: form.bgGradient || null,
      active: form.active,
      images: form.images.filter(Boolean),
      details: detailsObj,
    }

    const url = editProduct ? `/api/admin/products/${editProduct.id}` : '/api/admin/products'
    const method = editProduct ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSubmitting(false)

    if (res.ok) {
      toast.success(editProduct ? 'Produkt aktualisiert ✓' : 'Produkt erstellt ✓')
      setModalOpen(false)
      fetchAll()
    } else {
      const d = await res.json()
      toast.error(d.error ?? 'Fehler')
    }
  }

  const inp = (field: keyof FormState, label: string, opts?: { type?: string; required?: boolean; placeholder?: string }) => (
    <div className="form-group">
      <label className="form-label">{label}{opts?.required && <span style={{ color: 'var(--warn)' }}> *</span>}</label>
      <input
        className="form-input"
        type={opts?.type ?? 'text'}
        placeholder={opts?.placeholder}
        value={form[field] as string}
        onChange={e => {
          const val = e.target.value
          setForm(f => ({ ...f, [field]: val, ...(field === 'name' && !editProduct ? { slug: slugify(val) } : {}) }))
        }}
      />
    </div>
  )

  return (
    <div style={{ padding: 'clamp(20px,3vw,40px)' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>Produktverwaltung</h1>
          <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 3 }}>{products.length} Produkte total · {filtered.length} angezeigt</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {changedCount > 0 && (
            <button className="btn btn-primary" onClick={saveBulkPrices} disabled={saving}>
              {saving ? 'Speichern…' : `💾 ${changedCount} Preis${changedCount > 1 ? 'e' : ''} speichern`}
            </button>
          )}
          <button className="btn btn-black" onClick={openAdd}>+ Neues Produkt</button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>🔍</span>
          <input className="form-input" placeholder="Name, Marke, SKU…" style={{ paddingLeft: 36 }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input" style={{ flex: '1 1 160px' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">Alle Kategorien</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="form-input" style={{ flex: '0 0 140px' }} value={filterBadge} onChange={e => setFilterBadge(e.target.value)}>
          <option value="">Alle Badges</option>
          {['hot', 'new', 'sale'].map(b => <option key={b} value={b}>{BADGE_LABELS[b]}</option>)}
        </select>
        {(search || filterCat || filterBadge) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterCat(''); setFilterBadge('') }}>✕ Reset</button>
        )}
      </div>

      {/* ── Bulk-price tip ── */}
      {changedCount === 0 && (
        <div className="alert alert-info" style={{ marginBottom: 16, fontSize: 12.5 }}>
          💡 <strong>Bulk-Preiseditor:</strong> Preise direkt in der Tabelle ändern — dann oben auf „Preise speichern" klicken.
        </div>
      )}

      {/* ── Table ── */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 56, textAlign: 'center', color: 'var(--gray-400)' }}>Wird geladen…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center', color: 'var(--gray-400)' }}>Keine Produkte gefunden</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th>Kategorie</th>
                  <th style={{ minWidth: 130 }}>Preis (CHF)</th>
                  <th style={{ minWidth: 130 }}>Vergleichspreis</th>
                  <th>Lager</th>
                  <th>MOQ</th>
                  <th>Badge</th>
                  <th>Status</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const edit = priceEdits[p.id]
                  const priceVal  = edit?.price ?? String(p.price)
                  const cpVal     = edit?.comparePrice ?? (p.comparePrice ? String(p.comparePrice) : '')
                  const isDirty   = !!edit

                  return (
                    <tr key={p.id} style={{ background: isDirty ? 'rgba(22,163,122,.04)' : undefined }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {p.images[0] ? (
                            <div style={{ position: 'relative', width: 36, height: 36, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: p.bgGradient ?? 'var(--gray-100)' }}>
                              <Image src={p.images[0]} alt={p.name} fill sizes="36px" style={{ objectFit: 'contain', padding: 3 }} />
                            </div>
                          ) : (
                            <span style={{ fontSize: 24, flexShrink: 0 }}>{p.emoji}</span>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{p.brand} · {p.sku ?? '–'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--gray-600)' }}>{p.category.name}</td>

                      {/* Editable price */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {isDirty && <span style={{ color: 'var(--accent)', fontSize: 10 }}>●</span>}
                          <input
                            type="number" step="0.01" min="0"
                            value={priceVal}
                            style={{ width: 84, padding: '5px 8px', border: `1.5px solid ${isDirty ? 'var(--accent)' : 'var(--gray-200)'}`, borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                            onChange={e => setPriceEdits(prev => ({ ...prev, [p.id]: { price: e.target.value, comparePrice: prev[p.id]?.comparePrice ?? cpVal } }))}
                          />
                        </div>
                      </td>

                      {/* Editable compare price */}
                      <td>
                        <input
                          type="number" step="0.01" min="0" placeholder="–"
                          value={cpVal}
                          style={{ width: 84, padding: '5px 8px', border: `1.5px solid ${isDirty ? 'var(--accent)' : 'var(--gray-200)'}`, borderRadius: 6, fontSize: 13 }}
                          onChange={e => setPriceEdits(prev => ({ ...prev, [p.id]: { price: prev[p.id]?.price ?? priceVal, comparePrice: e.target.value } }))}
                        />
                      </td>

                      {/* Stock */}
                      <td>
                        <input type="number" defaultValue={p.stock} min={0}
                          style={{ width: 68, padding: '5px 8px', border: '1.5px solid var(--gray-200)', borderRadius: 6, fontSize: 13 }}
                          onBlur={async e => {
                            const v = parseInt(e.target.value)
                            if (!isNaN(v) && v !== p.stock) {
                              await fetch(`/api/admin/products/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock: v }) })
                              toast.success('Lager aktualisiert')
                            }
                          }} />
                      </td>

                      <td style={{ fontSize: 13, fontWeight: 600 }}>{p.moq}</td>

                      {/* Badge select */}
                      <td>
                        <select value={p.badge ?? ''}
                          style={{ fontSize: 12, padding: '4px 8px', border: '1.5px solid var(--gray-200)', borderRadius: 6, background: 'white' }}
                          onChange={e => updateBadge(p.id, e.target.value)}>
                          {BADGES.map(b => <option key={b} value={b}>{BADGE_LABELS[b]}</option>)}
                        </select>
                      </td>

                      <td>
                        <span className={`badge ${p.active ? 'badge-green' : 'badge-gray'}`}>{p.active ? 'Aktiv' : 'Inaktiv'}</span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline btn-xs" onClick={() => openEdit(p)}>✏️ Bearbeiten</button>
                          <button className={`btn btn-xs ${p.active ? 'btn-ghost' : 'btn-primary'}`} onClick={() => toggleActive(p.id, p.active)}>
                            {p.active ? 'Deakt.' : 'Akt.'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══ ADD / EDIT MODAL ══════════════════════════════════════ */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="modal slide-in-up" style={{ width: 740, maxWidth: '96vw', maxHeight: '92vh', overflow: 'auto' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid var(--gray-100)' }}>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700 }}>
                {editProduct ? `Bearbeiten: ${editProduct.name}` : 'Neues Produkt'}
              </h2>
              <button onClick={() => setModalOpen(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
            </div>

            <div style={{ padding: '24px 28px' }}>
              {/* Section: Basis */}
              <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent)' }}>Basis</div>
              <div className="form-row" style={{ marginBottom: 0 }}>
                {inp('name', 'Produktname', { required: true })}
                {inp('brand', 'Marke', { required: true })}
              </div>
              <div className="form-row">
                {inp('slug', 'Slug (URL)', { placeholder: 'auto-generiert aus Name' })}
                {inp('sku', 'SKU / Artikelnummer')}
              </div>
              <div className="form-row">
                {inp('emoji', 'Emoji')}
                <div className="form-group">
                  <label className="form-label">Kategorie <span style={{ color: 'var(--warn)' }}>*</span></label>
                  <select className="form-input" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                    <option value="">– Kategorie wählen –</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Beschreibung <span style={{ color: 'var(--warn)' }}>*</span></label>
                <textarea className="form-input" rows={3} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              {inp('unit', 'Einheit (z.B. 12er Tray 250ml)', { required: true })}

              {/* Section: Preise */}
              <div style={{ margin: '20px 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent)' }}>Preise & Lager</div>
              <div className="form-row">
                {inp('price', 'Preis CHF', { type: 'number', required: true })}
                {inp('comparePrice', 'Vergleichspreis CHF (durchgestrichen)', { type: 'number' })}
              </div>
              <div className="form-row">
                {inp('moq', 'Mindestbestellmenge (MOQ)', { type: 'number' })}
                {inp('stock', 'Lagerbestand', { type: 'number' })}
              </div>

              {/* Section: Badge & Status */}
              <div style={{ margin: '20px 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent)' }}>Badge & Status</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Badge</label>
                  <select className="form-input" value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}>
                    {BADGES.map(b => <option key={b} value={b}>{BADGE_LABELS[b]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, active: e.target.value === 'true' }))}>
                    <option value="true">✅ Aktiv</option>
                    <option value="false">⛔ Inaktiv</option>
                  </select>
                </div>
              </div>

              {/* Section: Bilder */}
              <div style={{ margin: '20px 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent)' }}>Bilder (URLs)</div>
              {form.images.map((img, i) => (
                <div key={i} className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label">Bild {i + 1}{i === 0 ? ' (Hauptbild)' : ''}</label>
                  <input className="form-input" placeholder="https://cdn.shopify.com/…" value={img}
                    onChange={e => setForm(f => { const imgs = [...f.images]; imgs[i] = e.target.value; return { ...f, images: imgs } })} />
                </div>
              ))}

              {/* Section: Details */}
              <div style={{ margin: '20px 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent)' }}>Produktdetails (Key-Value)</div>
              {form.details.map((d, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 8 }}>
                  <input className="form-input" placeholder="Eigenschaft (z.B. Gewicht)" value={d.key}
                    onChange={e => setForm(f => { const det = [...f.details]; det[i] = { ...det[i], key: e.target.value }; return { ...f, details: det } })} />
                  <input className="form-input" placeholder="Wert (z.B. 250g)" value={d.value}
                    onChange={e => setForm(f => { const det = [...f.details]; det[i] = { ...det[i], value: e.target.value }; return { ...f, details: det } })} />
                  <button onClick={() => setForm(f => ({ ...f, details: f.details.filter((_, j) => j !== i) }))}
                    style={{ padding: '0 12px', border: '1.5px solid var(--gray-200)', borderRadius: 8, color: 'var(--gray-400)', fontSize: 16, cursor: 'pointer' }}>✕</button>
                </div>
              ))}
              <button className="btn btn-outline btn-sm" onClick={() => setForm(f => ({ ...f, details: [...f.details, { key: '', value: '' }] }))}>
                + Detail hinzufügen
              </button>

              {/* Section: Design */}
              <div style={{ margin: '20px 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent)' }}>Design</div>
              {inp('bgGradient', 'Hintergrund-Gradient (CSS)', { placeholder: 'linear-gradient(135deg,#f0f0ee,#e8e8e6)' })}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--gray-100)' }}>
                <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Abbrechen</button>
                <button className="btn btn-primary" onClick={submitForm} disabled={submitting}>
                  {submitting ? 'Speichern…' : editProduct ? '✓ Änderungen speichern' : '+ Produkt erstellen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
