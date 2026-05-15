'use client'
// v4 - force recompile with images
import { useState } from 'react'
import Image from 'next/image'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Variant {
  label: string; price: number; unit: string; moq: number; packCount?: number
}

interface Product {
  id: string; name: string; slug: string; brand: string; emoji: string
  bgGradient: string | null; price: number; comparePrice: number | null
  unit: string; moq: number; stock: number; badge: string | null
  description: string; details: Record<string, string>
  taxRate?: number   // 0.026 | 0.081
  images?: string[]; variants?: Variant[]
}

const BADGE: Record<string, { label: string; bg: string }> = {
  hot:  { label: '🔥 Bestseller', bg: '#e85c2a' },
  new:  { label: '✨ Neu',        bg: 'var(--accent)' },
  sale: { label: '💰 Sale',       bg: '#f5a623' },
}

function ProductImage({ src, alt, fill, size }: { src: string; alt: string; fill?: boolean; size?: number }) {
  const [error, setError] = useState(false)
  if (error) return null
  if (fill) {
    return (
      <Image
        src={src} alt={alt} fill
        sizes="(max-width: 768px) 100vw, 400px"
        style={{ objectFit: 'contain', padding: 16 }}
        onError={() => setError(true)}
      />
    )
  }
  return (
    <Image
      src={src} alt={alt}
      width={size ?? 280} height={size ?? 280}
      style={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%', padding: 12 }}
      onError={() => setError(true)}
    />
  )
}

export default function ProductCard({ product: p, priority, approved = false }: { product: Product; priority?: boolean; approved?: boolean }) {
  const hasVariants = p.variants && p.variants.length > 0
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(hasVariants ? p.variants![0] : null)

  const activePrice    = selectedVariant ? selectedVariant.price : p.price
  const activeMoq     = selectedVariant ? selectedVariant.moq   : p.moq
  const activeUnit    = selectedVariant ? selectedVariant.unit  : p.unit
  // Total price for MOQ (what customer actually pays minimum)
  const moqTotal        = Math.round(activePrice * activeMoq * 100) / 100
  const compareMoqTotal = p.comparePrice ? Math.round(Number(p.comparePrice) * activeMoq * 100) / 100 : null
  // Price per single piece (Pz) — parsed from unit string e.g. "24 Pz" → 24
  const unitPieceCount  = parseInt(activeUnit?.match(/(\d+)/)?.[1] ?? '1', 10)
  const pricePerPiece   = unitPieceCount > 1 ? Math.round(activePrice / unitPieceCount * 100) / 100 : null

  const [qty, setQty] = useState(activeMoq)
  const [modalOpen, setModalOpen] = useState(false)
  const addItem = useCartStore(s => s.addItem)

  const firstImage = p.images?.[0]

  const handleVariantChange = (v: Variant) => {
    setSelectedVariant(v)
    setQty(v.moq)
  }

  // Cart price = price × packCount (e.g. ½ Palette: 26.90 × 20 = 538.00)
  const cartUnitPrice = selectedVariant
    ? activePrice * (selectedVariant.packCount ?? 1)
    : activePrice

  const handleAdd = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (p.stock === 0) return
    const label = selectedVariant ? ` – ${selectedVariant.label}` : ''
    const cartKey = p.id + (selectedVariant?.label ?? '')
    addItem({
      productId: p.id,
      cartKey,
      variantLabel: selectedVariant?.label,
      name: p.name + label,
      brand: p.brand,
      emoji: p.emoji,
      image: firstImage,
      bgGradient: p.bgGradient,
      unit: activeUnit,
      moq: activeMoq,
      quantity: qty,
      unitPrice: cartUnitPrice,
      taxRate: p.taxRate ?? 0.081,
    })
    toast.success(`${p.name}${label} hinzugefügt`, { icon: '🛒' })
  }

  return (
    <>
      <div className="product-card" onClick={() => setModalOpen(true)} role="button" tabIndex={0}>

        {/* Image Area */}
        <div style={{
          height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 68, position: 'relative', overflow: 'hidden',
          background: p.bgGradient ?? 'linear-gradient(135deg, #f0f0ee, #e8e8e6)',
        }}>
          {firstImage ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <Image
                src={firstImage}
                alt={p.name}
                fill
                priority={priority}
                sizes="(max-width: 768px) 100vw, 350px"
                style={{
                  objectFit: 'contain',
                  padding: 20,
                  filter: p.stock === 0 ? 'grayscale(1) opacity(.4)' : 'none',
                  transition: 'transform .3s ease',
                }}
              />
            </div>
          ) : (
            <span style={{ filter: p.stock === 0 ? 'grayscale(1) opacity(.4)' : 'none' }}>{p.emoji}</span>
          )}

          {p.badge && BADGE[p.badge] && (
            <span style={{
              position: 'absolute', top: 12, left: 12, zIndex: 2,
              fontSize: 10.5, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
              background: BADGE[p.badge].bg, color: 'white',
              letterSpacing: .3, boxShadow: '0 2px 8px rgba(0,0,0,.25)',
            }}>{BADGE[p.badge].label}</span>
          )}

          {p.stock > 0 && p.stock < 20 && (
            <span style={{
              position: 'absolute', top: 12, right: 12, zIndex: 2,
              fontSize: 10.5, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
              background: '#fff7ed', color: '#c2430c', border: '1px solid #fcd9b6',
            }}>⚠ Nur {p.stock} VE</span>
          )}

          {p.stock === 0 && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 2,
              background: 'rgba(255,255,255,.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-400)', letterSpacing: 2, textTransform: 'uppercase' }}>
                Ausverkauft
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '16px 18px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: 'var(--accent)', marginBottom: 5 }}>
            {p.brand}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--black)', marginBottom: 4, lineHeight: 1.4, minHeight: 40 }}>
            {p.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: hasVariants ? 10 : 14 }}>{activeUnit}</div>

          {/* Varianten-Selector */}
          {hasVariants && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {p.variants!.map(v => (
                <button key={v.label} onClick={e => { e.stopPropagation(); handleVariantChange(v) }} style={{
                  fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
                  border: `1.5px solid ${selectedVariant?.label === v.label ? 'var(--accent)' : 'var(--gray-100)'}`,
                  background: selectedVariant?.label === v.label ? 'var(--accent)' : 'white',
                  color: selectedVariant?.label === v.label ? 'white' : 'var(--gray-600)',
                  transition: 'all .15s',
                }}>{v.label}</button>
              ))}
            </div>
          )}

          {/* Price block */}
          <div style={{ marginBottom: 12, background: 'var(--cream)', borderRadius: 10, padding: '10px 12px' }}>
            {!approved ? (
              /* ── Preise verborgen ── */
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 6 }}>Einkaufspreis</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'transparent', textShadow: '0 0 12px rgba(0,0,0,0.3)', userSelect: 'none', letterSpacing: 3, marginBottom: 8 }}>CHF ••••</div>
                <a href="/login" onClick={e => e.stopPropagation()} style={{
                  display: 'block', fontSize: 12, fontWeight: 700,
                  color: 'var(--forest)', background: 'white',
                  border: '1.5px solid var(--forest)', borderRadius: 20,
                  padding: '6px 12px', textDecoration: 'none',
                }}>🔒 Anmelden für Preise</a>
              </div>
            ) : p.comparePrice && !hasVariants ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                {/* EK */}
                <div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 2 }}>
                    EK ab {activeMoq} VE
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--black)', lineHeight: 1 }}>
                    {formatPrice(moqTotal)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 2 }}>
                    {formatPrice(activePrice)}/VE
                    {pricePerPiece && <span> · {formatPrice(pricePerPiece)}/Stk</span>}
                  </div>
                </div>
                {/* UVP */}
                <div style={{ borderLeft: '1px solid var(--gray-100)', paddingLeft: 12 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 2 }}>
                    Empf. VK-Preis
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
                    {compareMoqTotal !== null ? formatPrice(compareMoqTotal) : formatPrice(Number(p.comparePrice))}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', marginTop: 2 }}>
                    +{Math.round((Number(p.comparePrice) / p.price - 1) * 100)}% Marge
                  </div>
                </div>
              </div>
            ) : hasVariants ? (
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 2 }}>
                  {selectedVariant?.packCount && selectedVariant.packCount > 1 ? 'Gesamtpreis' : 'Preis'}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--black)' }}>{formatPrice(cartUnitPrice)}</div>
                  {selectedVariant && p.variants![0].price > activePrice && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: '#e8f7f1', borderRadius: 10, padding: '2px 8px' }}>
                      −{Math.round((1 - activePrice / p.variants![0].price) * 100)}%
                    </span>
                  )}
                </div>
                {selectedVariant?.packCount && selectedVariant.packCount > 1 ? (
                  <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 2 }}>
                    {selectedVariant.packCount} Packs × {formatPrice(activePrice)} / Pack
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 2 }}>{activeUnit}</div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 2 }}>
                  Einkaufspreis (ab {activeMoq} VE)
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--black)' }}>{formatPrice(moqTotal)}</div>
                <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 2 }}>
                  {activeMoq} VE × {formatPrice(activePrice)}/VE
                  {pricePerPiece && <span style={{ marginLeft: 6, color: 'var(--gray-300)' }}>· {formatPrice(pricePerPiece)}/Stk</span>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '0 14px 16px' }} onClick={e => e.stopPropagation()}>
          {!approved ? (
            <a
              href="/login"
              onClick={e => e.stopPropagation()}
              className="btn btn-black"
              style={{ display: 'block', textAlign: 'center', fontSize: 12.5, height: 38, lineHeight: '38px', padding: '0', textDecoration: 'none' }}
            >
              Anmelden & Bestellen →
            </a>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="qty-stepper">
                <button onClick={() => setQty(q => Math.max(activeMoq, q - activeMoq))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => q + activeMoq)}>+</button>
              </div>
              <button
                className="btn btn-black"
                style={{ flex: 1, fontSize: 12.5, height: 38, padding: '0 10px' }}
                onClick={handleAdd}
                disabled={p.stock === 0}
              >
                {p.stock === 0 ? 'Ausverkauft' : '+ Warenkorb'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="modal slide-in-up" style={{ width: 680, maxWidth: '96vw', maxHeight: '92vh', overflow: 'auto' }}>

            {/* Modal Image */}
            <div style={{
              height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'sticky', top: 0, zIndex: 10, overflow: 'hidden',
              background: p.bgGradient ?? 'linear-gradient(135deg, #f0f0ee, #e8e8e6)',
            }}>
              {firstImage ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <Image
                    src={firstImage}
                    alt={p.name}
                    fill
                    sizes="680px"
                    style={{ objectFit: 'contain', padding: 32 }}
                    priority
                  />
                </div>
              ) : (
                <span style={{ fontSize: 110 }}>{p.emoji}</span>
              )}

              <button onClick={() => setModalOpen(false)} style={{
                position: 'absolute', top: 16, right: 16, zIndex: 11,
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(0,0,0,.35)', color: 'white', fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer',
              }}>✕</button>

              {p.badge && BADGE[p.badge] && (
                <span style={{
                  position: 'absolute', top: 16, left: 16, zIndex: 11,
                  fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 20,
                  background: BADGE[p.badge].bg, color: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,.25)',
                }}>{BADGE[p.badge].label}</span>
              )}
            </div>

            {/* Modal Body */}
            <div style={{ padding: '28px 32px 32px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: 'var(--accent)', marginBottom: 8 }}>
                {p.brand}
              </div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 10, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                {p.name}
              </h2>
              <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.75, marginBottom: 24 }}>
                {p.description}
              </p>

              {Object.keys(p.details || {}).length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
                  {/* Filter out Italian MwSt (22%) — Swiss VAT (8.1%) applies at checkout */}
                  {Object.entries(p.details).filter(([k]) => k !== 'MwSt').map(([k, v]) => (
                    <div key={k} style={{ background: 'var(--cream)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
                      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--gray-400)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 }}>{k}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--black)' }}>{String(v).replace(/Pz/g, 'Stk')}</div>
                    </div>
                  ))}
                  <div style={{ background: 'var(--cream)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--gray-400)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: .5 }}>MwSt</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--black)' }}>
                      {p.taxRate === 0.026 ? '2.6% (Lebensmittel)' : '8.1% (CH)'}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Varianten-Selector */}
              {hasVariants && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: .5 }}>Menge wählen</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {p.variants!.map(v => (
                      <button key={v.label} onClick={() => handleVariantChange(v)} style={{
                        padding: '10px 18px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                        border: `2px solid ${selectedVariant?.label === v.label ? 'var(--accent)' : 'var(--gray-100)'}`,
                        background: selectedVariant?.label === v.label ? '#e8f7f1' : 'var(--cream)',
                        transition: 'all .15s',
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)' }}>{v.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 800, marginTop: 2 }}>
                          {formatPrice(v.price * (v.packCount ?? 1))}
                          {v.packCount && v.packCount > 1 && <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>({formatPrice(v.price)}/Pack)</span>}
                        </div>
                        {v.price < p.variants![0].price && (
                          <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>−{Math.round((1 - v.price / p.variants![0].price) * 100)}%</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                {/* Modal price block */}
                <div style={{ flex: 1, minWidth: 240 }}>
                  {!approved ? (
                    <div style={{ padding: '20px 24px', background: 'var(--cream)', borderRadius: 12, border: '1px solid var(--gray-100)', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 8 }}>Einkaufspreis</div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: 'transparent', textShadow: '0 0 14px rgba(0,0,0,0.3)', userSelect: 'none', letterSpacing: 4, marginBottom: 12 }}>CHF ••••</div>
                      <a href="/login" style={{
                        display: 'inline-block', fontSize: 13, fontWeight: 700,
                        color: 'var(--forest)', background: 'white',
                        border: '1.5px solid var(--forest)', borderRadius: 20,
                        padding: '8px 20px', textDecoration: 'none',
                      }}>🔒 Anmelden für Preise</a>
                    </div>
                  ) : p.comparePrice && !hasVariants ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid var(--gray-100)', borderRadius: 12, overflow: 'hidden' }}>
                      {/* EK */}
                      <div style={{ padding: '16px 20px', background: 'var(--cream)' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 6 }}>
                          EK ab {activeMoq} VE
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--black)', lineHeight: 1 }}>
                          {formatPrice(moqTotal)}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--gray-400)', marginTop: 6 }}>
                          {formatPrice(activePrice)}/VE · {activeUnit}
                          {pricePerPiece && <span> · {formatPrice(pricePerPiece)}/Stk</span>}
                          {p.stock > 0 && p.stock < 20 && <div style={{ color: '#c2430c', marginTop: 4 }}>⚠ Nur {p.stock} VE</div>}
                        </div>
                      </div>
                      {/* UVP */}
                      <div style={{ padding: '16px 20px', background: '#e8f7f1', borderLeft: '1px solid #c0e8d8' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--accent-dark)', marginBottom: 6 }}>
                          Empf. VK-Preis (UVP)
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
                          {compareMoqTotal !== null ? formatPrice(compareMoqTotal) : formatPrice(Number(p.comparePrice))}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-dark)', marginTop: 6 }}>
                          +{Math.round((Number(p.comparePrice) / p.price - 1) * 100)}% Marge
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '16px 20px', background: 'var(--cream)', borderRadius: 12, border: '1px solid var(--gray-100)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 6 }}>
                        Einkaufspreis ab {activeMoq} VE
                      </div>
                      <div style={{ fontSize: 30, fontWeight: 800 }}>{formatPrice(moqTotal)}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6 }}>
                        {formatPrice(activePrice)}/VE · {activeUnit}
                        {pricePerPiece && <span> · {formatPrice(pricePerPiece)}/Stk</span>}
                        {p.stock > 0 && p.stock < 20 && <span style={{ color: '#c2430c', marginLeft: 8 }}>· Nur {p.stock} VE</span>}
                      </div>
                    </div>
                  )}
                </div>

                {approved && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div className="qty-stepper">
                      <button onClick={() => setQty(q => Math.max(activeMoq, q - activeMoq))}>−</button>
                      <span>{qty}</span>
                      <button onClick={() => setQty(q => q + activeMoq)}>+</button>
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: 14, padding: '10px 24px', height: 42 }}
                      onClick={e => { handleAdd(e); setModalOpen(false) }}
                      disabled={p.stock === 0}
                    >
                      {p.stock === 0 ? 'Ausverkauft' : '+ In den Warenkorb'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
