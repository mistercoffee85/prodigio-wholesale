'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface CategoryMarkup {
  slug:   string
  label:  string
  factor: number
  count:  number
}

const EMOJI: Record<string, string> = {
  'grosshandel-getraenke':    '🥤',
  'grosshandel-bier-wein':    '🍺',
  'grosshandel-kaffee-tee':   '☕',
  'grosshandel-lebensmittel': '🍝',
  'grosshandel-suesswaren':   '🍫',
  'grosshandel-hygiene':      '🧴',
  'grosshandel-sonstiges':    '🏠',
}

export default function PreisePage() {
  const [categories, setCategories] = useState<CategoryMarkup[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [recalc, setRecalc]         = useState(true)

  useEffect(() => {
    fetch('/api/admin/markup')
      .then(r => r.json())
      .then(d => { setCategories(d.categories ?? []); setLoading(false) })
  }, [])

  const setFactor = (slug: string, pct: string) => {
    const num = parseFloat(pct)
    if (isNaN(num)) return
    const factor = 1 + num / 100
    setCategories(cs => cs.map(c => c.slug === slug ? { ...c, factor } : c))
  }

  const getFactor = (c: CategoryMarkup) =>
    ((c.factor - 1) * 100).toFixed(1)

  const getSellExample = (c: CategoryMarkup) => {
    const cost = 5.00
    return (Math.ceil(cost * c.factor * 20) / 20).toFixed(2)
  }

  const save = async (withRecalc: boolean) => {
    setSaving(true)
    const factors = Object.fromEntries(categories.map(c => [c.slug, c.factor]))
    const res = await fetch('/api/admin/markup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factors, recalculate: withRecalc }),
    })
    const d = await res.json()
    setSaving(false)
    if (res.ok) {
      if (withRecalc) {
        toast.success(`Gespeichert & ${d.updated.toLocaleString()} Preise neu berechnet ✓`)
      } else {
        toast.success('Margen gespeichert ✓ (Preise noch nicht neu berechnet)')
      }
    } else {
      toast.error('Fehler beim Speichern')
    }
  }

  const totalProducts = categories.reduce((s, c) => s + c.count, 0)

  return (
    <div style={{ padding: 'clamp(20px,3vw,40px)', maxWidth: 860 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
          Marge & Preiskalkulation
        </h1>
        <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>
          Aufschlag auf den Migroweb-Einkaufspreis pro Kategorie.
          {totalProducts > 0 && ` Betrifft ${totalProducts.toLocaleString()} Produkte.`}
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />
          ))}
        </div>
      ) : (
        <>
          {/* Info box */}
          <div className="alert alert-info" style={{ marginBottom: 24, fontSize: 13 }}>
            💡 <strong>Formel:</strong> Verkaufspreis = Einkaufspreis × (1 + Marge%) — aufgerundet auf CHF 0.05
          </div>

          {/* Category rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {categories.map(c => {
              const pct = getFactor(c)
              const example = getSellExample(c)
              return (
                <div key={c.slug} className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>

                    {/* Emoji + Label */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 200px' }}>
                      <span style={{ fontSize: 24 }}>{EMOJI[c.slug] ?? '📦'}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{c.label}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--gray-400)' }}>
                          {c.count.toLocaleString()} Produkte
                        </div>
                      </div>
                    </div>

                    {/* Marge input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 500 }}>Marge</span>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          min="0"
                          max="200"
                          step="0.5"
                          value={pct}
                          onChange={e => setFactor(c.slug, e.target.value)}
                          className="form-input"
                          style={{ width: 90, textAlign: 'right', paddingRight: 28, fontWeight: 700 }}
                        />
                        <span style={{
                          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                          fontSize: 13, fontWeight: 600, color: 'var(--gray-400)',
                        }}>%</span>
                      </div>
                    </div>

                    {/* Example */}
                    <div style={{
                      background: 'var(--cream)', borderRadius: 8, padding: '8px 14px',
                      fontSize: 12.5, color: 'var(--gray-600)', minWidth: 190,
                    }}>
                      EK <strong>CHF 5.00</strong>
                      {' → '}
                      VK <strong style={{ color: 'var(--forest)' }}>CHF {example}</strong>
                      <span style={{
                        marginLeft: 8, fontSize: 11, fontWeight: 700,
                        color: 'var(--accent)', background: '#e8f7f1',
                        borderRadius: 20, padding: '1px 7px',
                      }}>+{pct}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={() => save(true)}
              disabled={saving}
              style={{ minWidth: 260 }}
            >
              {saving
                ? '⏳ Preise werden neu berechnet…'
                : `💰 Speichern & alle ${totalProducts.toLocaleString()} Preise neu berechnen`}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => save(false)}
              disabled={saving}
            >
              Nur speichern (ohne Neuberechnung)
            </button>
          </div>

          <p style={{ fontSize: 11.5, color: 'var(--gray-400)', marginTop: 12 }}>
            Die Neuberechnung dauert ca. 30–60 Sekunden für alle Produkte.
            Zukünftige Nacht-Syncs verwenden automatisch die gespeicherten Margen.
          </p>
        </>
      )}
    </div>
  )
}
