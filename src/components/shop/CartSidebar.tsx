'use client'
import { useCartStore, useCartTotals } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface Props { open: boolean; onClose: () => void }

interface Suggestion {
  id: string; name: string; brand: string; emoji: string
  price: number; comparePrice: number | null
  images?: string[]; bgGradient: string | null; unit: string; moq: number
}

function CartItemImage({ image, bgGradient, emoji }: { image?: string; bgGradient?: string | null; emoji: string }) {
  const [err, setErr] = useState(false)
  return (
    <div style={{
      width: 60, height: 60, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
      background: bgGradient ?? 'linear-gradient(135deg,#f0f0ee,#e8e8e6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid var(--gray-100)', fontSize: 24, position: 'relative',
    }}>
      {image && !err ? (
        <Image src={image} alt="" fill sizes="60px"
          style={{ objectFit: 'contain', padding: 6 }}
          onError={() => setErr(true)} />
      ) : (
        <span>{emoji}</span>
      )}
    </div>
  )
}

export default function CartSidebar({ open, onClose }: Props) {
  const { data: session } = useSession()
  const items        = useCartStore(s => s.items)
  const removeItem   = useCartStore(s => s.removeItem)
  const updateQty    = useCartStore(s => s.updateQuantity)
  const clearCart    = useCartStore(s => s.clearCart)
  const { subtotal, shipping, tax, taxFood, taxStandard, total } = useCartTotals()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const addItem      = useCartStore(s => s.addItem)

  // Close on ESC + lock scroll
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', fn)
    else document.removeEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Fetch suggestions based on cart items
  useEffect(() => {
    if (!open || items.length === 0) { setSuggestions([]); return }
    const cartIds = new Set(items.map(i => i.productId))
    fetch('/api/products?limit=20')
      .then(r => r.json())
      .then(data => {
        const candidates: Suggestion[] = (data.products ?? []).filter((p: Suggestion) => !cartIds.has(p.id))
        // Prefer same brand as last added item
        const lastBrand = items[items.length - 1]?.brand
        const sorted = candidates.sort((a, b) => {
          if (a.brand === lastBrand && b.brand !== lastBrand) return -1
          if (b.brand === lastBrand && a.brand !== lastBrand) return 1
          return 0
        })
        setSuggestions(sorted.slice(0, 4))
      })
      .catch(() => {})
  }, [open, items])

  if (!open) return null

  return (
    <>
      <div className="sidebar-overlay" onClick={onClose} />

      <div className="sidebar slide-in-right" style={{ width: 460, maxWidth: '96vw', display: 'flex', flexDirection: 'column' }}>

        {/* ── Header ─────────────────────────────── */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>🛒 Warenkorb</h2>
            <span style={{ fontSize: 12.5, color: 'var(--gray-400)' }}>
              {items.length === 0 ? 'Leer' : `${items.reduce((n, i) => n + i.quantity, 0)} Einheiten · ${items.length} ${items.length === 1 ? 'Artikel' : 'Artikel'}`}
            </span>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: 'var(--radius)', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--gray-400)', transition: 'all .15s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--gray-50)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--black)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--gray-400)' }}
          >✕</button>
        </div>

        {/* ── Transport info banner ──────────────── */}
        {subtotal > 0 && (
          <div style={{ padding: '10px 24px', background: '#f8f9fb', borderBottom: '1px solid var(--gray-100)', flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⏳</span>
              <span>Transportkosten werden nach Bestellung individuell bestätigt.</span>
            </div>
          </div>
        )}

        {/* ── Scrollable body ─────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* Empty state */}
          {items.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 340, padding: '40px 24px', textAlign: 'center' }}>
              <span style={{ fontSize: 52, marginBottom: 16 }}>🛒</span>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--black)', marginBottom: 8 }}>Ihr Warenkorb ist leer</p>
              <p style={{ fontSize: 13.5, color: 'var(--gray-400)', marginBottom: 28, lineHeight: 1.6 }}>
                Entdecken Sie unsere Grosshandelsprodukte.
              </p>
              <button className="btn btn-black" onClick={onClose}>Zum Sortiment →</button>
            </div>
          ) : (
            <>
              {/* Cart items */}
              <div style={{ padding: '8px 0' }}>
                {items.map(item => (
                  <div key={item.cartKey} style={{
                    display: 'flex', gap: 14, padding: '14px 24px',
                    borderBottom: '1px solid var(--gray-50)', transition: 'background .12s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--cream)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Product Image */}
                    <CartItemImage image={item.image} bgGradient={item.bgGradient} emoji={item.emoji} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
                        {item.brand}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--black)', marginBottom: 3, lineHeight: 1.3 }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--gray-400)', marginBottom: 10 }}>
                        {item.unit} · {formatPrice(item.unitPrice)} / VE
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="qty-stepper" style={{ transform: 'scale(.85)', transformOrigin: 'left' }}>
                          <button onClick={() => updateQty(item.cartKey, Math.max(item.moq, item.quantity - item.moq))}>−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQty(item.cartKey, item.quantity + item.moq)}>+</button>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{formatPrice(item.unitPrice * item.quantity)}</span>
                      </div>
                    </div>

                    {/* Remove */}
                    <button onClick={() => removeItem(item.cartKey)}
                      style={{ alignSelf: 'flex-start', width: 26, height: 26, borderRadius: 'var(--radius-sm)', fontSize: 14, color: 'var(--gray-300)', transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--warn)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--warn-bg)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--gray-300)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                    >✕</button>
                  </div>
                ))}
              </div>

              {/* ── Recommendations ──────────────────── */}
              {suggestions.length > 0 && (
                <div style={{ padding: '20px 24px', borderTop: '2px solid var(--gray-100)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 14 }}>
                    Empfehlungen für Sie
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {suggestions.map(s => (
                      <div key={s.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', borderRadius: 10, border: '1px solid var(--gray-100)',
                        background: 'white', transition: 'all .15s', cursor: 'default',
                      }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--cream)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gray-100)'; (e.currentTarget as HTMLDivElement).style.background = 'white' }}
                      >
                        {/* Image */}
                        <div style={{
                          width: 48, height: 48, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                          background: s.bgGradient ?? 'linear-gradient(135deg,#f0f0ee,#e8e8e6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 22, position: 'relative',
                        }}>
                          {s.images?.[0] ? (
                            <Image src={s.images[0]} alt={s.name} fill sizes="48px"
                              style={{ objectFit: 'contain', padding: 4 }} />
                          ) : (
                            <span>{s.emoji}</span>
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--black)', lineHeight: 1.3, marginBottom: 2,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{s.unit}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--black)', marginTop: 2 }}>
                            {formatPrice(s.price)}
                            {s.comparePrice && (
                              <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--accent)', marginLeft: 6 }}>
                                +{Math.round((s.comparePrice / s.price - 1) * 100)}% Marge
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Add */}
                        <button
                          onClick={() => addItem({
                            productId: s.id, cartKey: s.id, name: s.name, brand: s.brand, emoji: s.emoji,
                            image: s.images?.[0], bgGradient: s.bgGradient,
                            unit: s.unit, moq: s.moq, quantity: s.moq, unitPrice: s.price,
                          })}
                          className="btn btn-black"
                          style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0, height: 32 }}
                        >
                          + Hinzufügen
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer / Totals ─────────────────────── */}
        {items.length > 0 && (
          <div style={{ borderTop: '1px solid var(--gray-100)', padding: '18px 24px', flexShrink: 0, background: 'white' }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--gray-600)', marginBottom: 5 }}>
                <span>Zwischensumme</span><span>{formatPrice(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--gray-400)', marginBottom: 10 }}>
                <span>Transport</span>
                <span style={{ fontStyle: 'italic' }}>wird bestätigt</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 20, borderTop: '1px solid var(--gray-100)', paddingTop: 10 }}>
                <span>Gesamt</span><span>{formatPrice(total)}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3, textAlign: 'right' }}>
                {taxFood > 0 && taxStandard > 0
                  ? `inkl. MwSt. 2.6% (${formatPrice(taxFood)}) + 8.1% (${formatPrice(taxStandard)})`
                  : taxFood > 0
                  ? `inkl. MwSt. 2.6% (${formatPrice(taxFood)})`
                  : `inkl. MwSt. 8.1% (${formatPrice(taxStandard || tax)})`
                }
              </div>
            </div>

            {session?.user.status === 'APPROVED' ? (
              <Link href="/checkout" className="btn btn-primary" style={{ width: '100%', fontSize: 15, padding: '14px', display: 'block', textAlign: 'center' }} onClick={onClose}>
                Zur Kasse →
              </Link>
            ) : session ? (
              <div className="alert alert-warn" style={{ textAlign: 'center', fontSize: 13 }}>
                Ihr Konto muss zuerst freigegeben werden.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/login" className="btn btn-primary" style={{ width: '100%', fontSize: 15, padding: '13px', display: 'block', textAlign: 'center' }} onClick={onClose}>
                  Anmelden & Bestellen
                </Link>
                <Link href="/register" className="btn btn-outline" style={{ width: '100%', fontSize: 13.5, display: 'block', textAlign: 'center' }} onClick={onClose}>
                  Noch kein Konto? Registrieren
                </Link>
              </div>
            )}

            <button onClick={clearCart}
              style={{ width: '100%', marginTop: 10, fontSize: 12, color: 'var(--gray-400)', textAlign: 'center', padding: '6px', cursor: 'pointer' }}>
              Warenkorb leeren
            </button>
          </div>
        )}
      </div>
    </>
  )
}
