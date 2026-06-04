'use client'
// checkout v3 - with Stripe card payments
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCartStore, useCartTotals, useCartHydrated } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import StripePaymentForm from '@/components/checkout/StripePaymentForm'
import toast from 'react-hot-toast'

type PaymentMethod  = 'BANK_TRANSFER' | 'STRIPE_CARD' | 'STRIPE_TWINT' | 'STRIPE_PAYPAL'
type ShippingOption = 'PRODIGIO_DELIVERS' | 'SELF_PICKUP' | 'LOCAL_PICKUP' | 'LOCAL_DELIVERY'
type CheckoutStep   = 'form' | 'stripe-payment'

interface StripeData {
  clientSecret:  string
  orderNumber:   string
  paymentMethod: 'STRIPE_CARD' | 'STRIPE_TWINT' | 'STRIPE_PAYPAL'
}

export default function CheckoutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const items    = useCartStore(s => s.items)
  const clearCart = useCartStore(s => s.clearCart)
  const { subtotal, shipping, tax, taxFood, taxStandard, total } = useCartTotals()

  const hydrated = useCartHydrated()

  // Detect cart composition
  const hasCNC   = items.some(i => i.supplierSource === 'migroweb')
  const hasLocal = items.some(i => !i.supplierSource || i.supplierSource !== 'migroweb')
  const isMixed  = hasCNC && hasLocal

  const [paymentMethod,       setPaymentMethod]       = useState<PaymentMethod>('BANK_TRANSFER')
  const [shippingOptionCNC,   setShippingOptionCNC]   = useState<ShippingOption>('PRODIGIO_DELIVERS')
  const [shippingOptionLocal, setShippingOptionLocal] = useState<ShippingOption>('LOCAL_DELIVERY')
  const [notes,   setNotes]   = useState('')
  const [loading, setLoading] = useState(false)
  const [step,    setStep]    = useState<CheckoutStep>('form')
  const [stripeData, setStripeData] = useState<StripeData | null>(null)

  // Derive the "primary" shippingOption for the API:
  // - mixed:  CNC option is primary, local option is secondary
  // - C&C only: CNC option
  // - local only: local option
  const primaryShipping: ShippingOption = hasCNC ? shippingOptionCNC : shippingOptionLocal

  const buildPayload = () => ({
    items: items.map(i => ({ productId: i.productId, quantity: i.quantity, variantLabel: i.variantLabel })),
    paymentMethod,
    shippingOption: primaryShipping,
    ...(isMixed && { shippingOptionLocal }),
    notes,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) { toast.error('Warenkorb ist leer'); return }
    setLoading(true)

    try {
      const res  = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(buildPayload()),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Fehler beim Checkout')
        setLoading(false)
        return
      }

      if (data.type === 'stripe' && data.clientSecret) {
        // ── Stripe: show card form
        setStripeData({ clientSecret: data.clientSecret, orderNumber: data.orderNumber, paymentMethod: paymentMethod as 'STRIPE_CARD' | 'STRIPE_TWINT' | 'STRIPE_PAYPAL' })
        setStep('stripe-payment')
        setLoading(false)
        clearCart()
      } else {
        // ── Bank transfer / Net 30: direct confirmation
        clearCart()
        router.push(`/checkout/success?order=${data.orderNumber}`)
      }
    } catch {
      toast.error('Netzwerkfehler')
      setLoading(false)
    }
  }

  const handleStripeCancel = () => {
    setStep('form')
    setStripeData(null)
    toast('Zahlung abgebrochen. Bitte erneut bestellen.', { icon: 'ℹ️' })
  }

  // ─── Payment option config ───────────────────────────────────
  const PAYMENT_OPTIONS: Array<{
    value: PaymentMethod; icon: string; title: string; desc: string
    detail?: React.ReactNode
  }> = [
    {
      value: 'STRIPE_CARD',
      icon:  '💳',
      title: 'Kreditkarte / Apple Pay / Google Pay',
      desc:  'Visa, Mastercard, Amex — oder direkt mit Apple Pay & Google Pay.',
      detail: (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginTop: 10, fontSize: 13, lineHeight: 1.7, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <span>Gesichert durch <strong>Stripe</strong> — Apple Pay &amp; Google Pay werden automatisch auf kompatiblen Geräten angezeigt.</span>
        </div>
      ),
    },
    {
      value: 'STRIPE_PAYPAL',
      icon:  '🅿️',
      title: 'PayPal',
      desc:  'Zahlung über Ihr PayPal-Konto — schnell und sicher.',
      detail: (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginTop: 10, fontSize: 13, lineHeight: 1.7, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <span>Sie werden nach der Bestellung zu <strong>PayPal</strong> weitergeleitet zur Zahlung.</span>
        </div>
      ),
    },
    // TWINT: uncomment once activated in Stripe Dashboard → Payment settings
    // {
    //   value: 'STRIPE_TWINT',
    //   icon:  '📱',
    //   title: 'TWINT',
    //   desc:  'Bezahlen Sie direkt mit der TWINT-App — sofortige Zahlung.',
    // },
    {
      value: 'BANK_TRANSFER',
      icon:  '🏦',
      title: 'Vorauskasse',
      desc:  'Zahlung per Banküberweisung innert 3 Tagen. Bei Ausbleiben wird die Bestellung automatisch storniert.',
      detail: (
        <div style={{ background: '#fff7ed', border: '1px solid #fcd9b6', borderRadius: 8, padding: '14px 16px', marginTop: 10, fontSize: 13, lineHeight: 1.7 }}>
          <strong style={{ color: '#c2430c' }}>⚠️ Wichtig: Zahlung innert 3 Werktagen.</strong><br />
          Bei nicht fristgerechter Zahlung wird die Bestellung automatisch storniert.<br /><br />
          <strong>Bankdaten werden nach Bestellbestätigung per E-Mail zugestellt.</strong><br />
          IBAN: CH56 0483 5012 3456 7800 9 · UBS Basel
        </div>
      ),
    },
  ]

  const submitLabel = paymentMethod === 'STRIPE_CARD'
    ? `Weiter zur Kartenzahlung – ${formatPrice(total)}`
    : paymentMethod === 'STRIPE_TWINT'
    ? `Weiter zu TWINT – ${formatPrice(total)}`
    : paymentMethod === 'STRIPE_PAYPAL'
    ? `Weiter zu PayPal – ${formatPrice(total)}`
    : `Jetzt bestellen – ${formatPrice(total)}`

  return (
    <>
      <style>{`
        .shipping-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px;
        }
        @media (max-width: 480px) {
          .shipping-detail-grid {
            grid-template-columns: 1fr;
          }
        }
        .order-summary-card {
          position: sticky;
          top: 90px;
        }
        @media (max-width: 768px) {
          .order-summary-card {
            position: static;
            top: auto;
          }
        }
        .trust-badges {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--gray-100);
        }
      `}</style>
      <Header />
      <main style={{ minHeight: '80vh', background: '#f8f9fb' }}>

        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, var(--forest) 0%, #1a3d28 70%, #0d2218 100%)',
          color: 'white', padding: 'clamp(24px, 5vw, 36px) clamp(20px, 6vw, 80px)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>
            Bestellung abschliessen
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 30, fontWeight: 700 }}>Kasse</h1>
          {session?.user?.companyName && (
            <p style={{ opacity: .65, marginTop: 6, fontSize: 14 }}>
              Bestellen als: <strong>{session.user.companyName}</strong>
            </p>
          )}
        </div>

        <div style={{ padding: 'clamp(24px, 4vw, 40px) clamp(16px, 6vw, 80px)' }}>

          {/* ── Hydration / empty cart guards ── */}
          {!hydrated ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray-400)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <p>Warenkorb wird geladen…</p>
            </div>
          ) : items.length === 0 && step === 'form' ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, marginBottom: 12 }}>Warenkorb ist leer</h2>
              <p style={{ color: 'var(--gray-400)', marginBottom: 28 }}>Bitte fügen Sie Produkte hinzu, bevor Sie zur Kasse gehen.</p>
              <a href="/products" className="btn btn-primary" style={{ padding: '12px 28px' }}>Sortiment entdecken →</a>
            </div>
          ) : null}

          {/* ── Step 2: Stripe card payment ── */}
          {step === 'stripe-payment' && stripeData && (
            <div style={{ maxWidth: 560, width: '100%', margin: '0 auto' }}>
              <StripePaymentForm
                clientSecret={stripeData.clientSecret}
                total={total}
                orderNumber={stripeData.orderNumber}
                isTwint={stripeData.paymentMethod === 'STRIPE_TWINT'}
                isPaypal={stripeData.paymentMethod === 'STRIPE_PAYPAL'}
                onCancel={handleStripeCancel}
              />
            </div>
          )}

          {/* ── Step 1: Checkout form ── */}
          <form
            onSubmit={handleSubmit}
            style={{ display: hydrated && (items.length > 0 || step !== 'form') && step === 'form' ? undefined : 'none' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 28, alignItems: 'start' }}>

              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Lieferoption */}
                <div className="card" style={{ padding: 'clamp(16px, 4vw, 28px)' }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Lieferoption</h2>
                  {isMixed && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff7ed', border: '1px solid #fcd9b6', borderRadius: 20, padding: '4px 12px', fontSize: 11.5, fontWeight: 600, color: '#92400e', marginBottom: 16 }}>
                      ⚠ Gemischte Bestellung — bitte für jede Warengruppe separat wählen
                    </div>
                  )}

                  {/* ── Sektion 1: Cash & Carry (nur wenn C&C-Produkte im Warenkorb) ── */}
                  {hasCNC && (
                    <div style={{ marginBottom: isMixed ? 20 : 0 }}>
                      {isMixed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                          <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
                          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                            🇮🇹 Cash &amp; Carry — Lager Italien
                          </span>
                          <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
                        </div>
                      )}
                      {!isMixed && <p style={{ fontSize: 12.5, color: 'var(--gray-400)', marginBottom: 14 }}>Ware ab Lager des Lieferanten in Italien (Ex Works).</p>}
                      {([
                        { value: 'PRODIGIO_DELIVERS' as ShippingOption, title: '🚚 Transport & Verzollung durch PRO.DI.GIO GmbH',
                          rows: [['📦','Abholung','Wir holen beim Lieferanten in Italien ab'],['🛃','Verzollung','Wir übernehmen die Schweizer Zollanmeldung'],['🚛','Transport','Lieferung direkt zu Ihnen in die Schweiz'],['💶','Kosten','Transportkosten werden 1:1 weiterverrechnet']],
                          note: { color: 'var(--accent)', text: '✓ Transportkosten werden nach Bestellung bestätigt' } },
                        { value: 'SELF_PICKUP' as ShippingOption, title: '🚗 Selbstabholung (Ex Works Italien)',
                          rows: [['📍','Abholung','Sie holen direkt beim Lieferanten in Italien ab'],['🛃','Verzollung','Liegt vollständig bei Ihnen'],['🚛','Transport','Organisation und Kosten bei Ihnen'],['📋','Voraussetzung','EORI-Nummer für EU-Export erforderlich']],
                          note: { color: '#92400e', text: '⚠ Sie tragen alle Kosten ab Lager Italien' } },
                      ]).map(opt => (
                        <label key={opt.value} style={{ display: 'block', padding: '16px 18px', border: '2px solid', borderColor: shippingOptionCNC === opt.value ? 'var(--accent)' : 'var(--gray-200)', borderRadius: 12, cursor: 'pointer', marginBottom: 10, background: shippingOptionCNC === opt.value ? 'var(--accent-light)' : 'white', transition: 'all .15s' }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <input type="radio" name="so-cnc" value={opt.value} checked={shippingOptionCNC === opt.value} onChange={() => setShippingOptionCNC(opt.value)} style={{ marginTop: 3, accentColor: 'var(--accent)', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{opt.title}</div>
                              <div className="shipping-detail-grid">
                                {opt.rows.map(([icon, title, desc]) => (
                                  <div key={title} style={{ background: 'rgba(255,255,255,0.65)', borderRadius: 8, padding: '9px 11px' }}>
                                    <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 2 }}>{icon} {title}</div>
                                    <div style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.4 }}>{desc}</div>
                                  </div>
                                ))}
                              </div>
                              {shippingOptionCNC === opt.value && <div style={{ marginTop: 10, fontSize: 12, color: opt.note.color, fontWeight: 600 }}>{opt.note.text}</div>}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* ── Sektion 2: Lagerprodukte Basel (nur wenn lokale Produkte im Warenkorb) ── */}
                  {hasLocal && (
                    <div>
                      {isMixed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                          <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
                          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>
                            🇨🇭 Lagerprodukte — ab Basel
                          </span>
                          <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
                        </div>
                      )}
                      {!isMixed && <p style={{ fontSize: 12.5, color: 'var(--gray-400)', marginBottom: 14 }}>Ware ab Lager PRO.DI.GIO GmbH, Basel.</p>}
                      {([
                        { value: 'LOCAL_DELIVERY' as ShippingOption, title: '🚚 Lieferung durch PRO.DI.GIO GmbH',
                          rows: [['📦','Versand','Wir liefern direkt zu Ihnen'],['💶','Kosten','Lieferkosten werden separat mitgeteilt'],['📅','Lieferzeit','Nach Bestätigung der Bestellung'],['📞','Kontakt','Wir melden uns zur Koordination']],
                          note: { color: 'var(--accent)', text: '✓ Lieferkosten werden nach Bestellung bekanntgegeben' } },
                        { value: 'LOCAL_PICKUP' as ShippingOption, title: '🏢 Abholung bei PRO.DI.GIO GmbH, Basel',
                          rows: [['📍','Adresse','Mailand-Strasse 31, 4053 Basel'],['🕐','Termin','Nach Absprache — wir kontaktieren Sie'],['💶','Kosten','Kostenlos — keine Versandkosten'],['📦','Bereit','Wir informieren Sie sobald Ware bereit ist']],
                          note: { color: 'var(--accent)', text: '✓ Kein Versand — kostenlose Abholung in Basel' } },
                      ]).map(opt => (
                        <label key={opt.value} style={{ display: 'block', padding: '16px 18px', border: '2px solid', borderColor: shippingOptionLocal === opt.value ? 'var(--accent)' : 'var(--gray-200)', borderRadius: 12, cursor: 'pointer', marginBottom: 10, background: shippingOptionLocal === opt.value ? 'var(--accent-light)' : 'white', transition: 'all .15s' }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <input type="radio" name="so-local" value={opt.value} checked={shippingOptionLocal === opt.value} onChange={() => setShippingOptionLocal(opt.value)} style={{ marginTop: 3, accentColor: 'var(--accent)', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{opt.title}</div>
                              <div className="shipping-detail-grid">
                                {opt.rows.map(([icon, title, desc]) => (
                                  <div key={title} style={{ background: 'rgba(255,255,255,0.65)', borderRadius: 8, padding: '9px 11px' }}>
                                    <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 2 }}>{icon} {title}</div>
                                    <div style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.4 }}>{desc}</div>
                                  </div>
                                ))}
                              </div>
                              {shippingOptionLocal === opt.value && <div style={{ marginTop: 10, fontSize: 12, color: opt.note.color, fontWeight: 600 }}>{opt.note.text}</div>}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Zahlungsmethode */}
                <div className="card" style={{ padding: 'clamp(16px, 4vw, 28px)' }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Zahlungsmethode</h2>
                  {PAYMENT_OPTIONS.map(opt => (
                    <div key={opt.value}>
                      <label style={{
                        display: 'flex', gap: 14, padding: '14px 16px',
                        border: '1.5px solid',
                        borderColor: paymentMethod === opt.value ? 'var(--accent)' : 'var(--gray-200)',
                        borderRadius: 10, cursor: 'pointer', marginBottom: 10,
                        background: paymentMethod === opt.value ? 'var(--accent-light)' : 'white',
                        transition: 'all .15s',
                        flexWrap: 'wrap',
                      }}>
                        <input
                          type="radio" name="pm" value={opt.value}
                          checked={paymentMethod === opt.value}
                          onChange={() => setPaymentMethod(opt.value)}
                          style={{ marginTop: 3, accentColor: 'var(--accent)', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{opt.icon} {opt.title}</div>
                          <div style={{ fontSize: 12.5, color: 'var(--gray-400)' }}>{opt.desc}</div>
                        </div>
                      </label>
                      {paymentMethod === opt.value && opt.detail}
                    </div>
                  ))}
                </div>

                {/* Notizen */}
                <div className="card" style={{ padding: 'clamp(16px, 4vw, 28px)' }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>
                    Bestellnotiz{' '}
                    <span style={{ color: 'var(--gray-400)', fontSize: 13, fontWeight: 400 }}>(optional)</span>
                  </h2>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Besondere Hinweise zur Lieferung, Wunschtermin, Referenznummer..."
                    style={{
                      width: '100%', padding: '12px 14px',
                      border: '1.5px solid var(--gray-200)', borderRadius: 8,
                      fontFamily: 'inherit', fontSize: 14, resize: 'vertical', minHeight: 90,
                      outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s',
                    }}
                  />
                </div>
              </div>

              {/* Right column — Order Summary */}
              <div className="card order-summary-card" style={{ padding: 'clamp(16px, 4vw, 28px)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Bestellübersicht</h2>

                {/* Items */}
                <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16, paddingRight: 4 }}>
                  {items.map(item => (
                    <div key={item.cartKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--gray-50)', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                          <span style={{ marginRight: 6 }}>{item.emoji}</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: 200, verticalAlign: 'bottom' }}>{item.name}</span>
                        </div>
                        <div style={{ color: 'var(--gray-400)', fontSize: 12 }}>{item.quantity}× {item.unit}</div>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{formatPrice(item.total)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    ['Zwischensumme', formatPrice(subtotal)],
                    ['Transport', isMixed ? '⏳ Siehe Lieferoptionen' : primaryShipping === 'SELF_PICKUP' ? '🚗 Ex Works' : primaryShipping === 'LOCAL_PICKUP' ? '🏢 Abholung Basel' : '⏳ Wird bestätigt'],
                    ...(taxFood > 0     ? [['MwSt. 2.6% (Lebensmittel)', formatPrice(taxFood)]]   : []),
                    ...(taxStandard > 0 ? [['MwSt. 8.1%',                formatPrice(taxStandard)]] : []),
                    ...(!hasLocal && hasCNC
                    ? [['Einfuhr-MwSt. (IT→CH)', '⚡ separat bei Import']]
                    : taxFood === 0 && taxStandard === 0
                    ? [['CH-MwSt.', formatPrice(tax)]]
                    : []),
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                      <span style={{ color: 'var(--gray-400)' }}>{l}</span>
                      <span style={{ color: v === '🎁 Kostenlos' ? 'var(--accent)' : 'inherit' }}>{v}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 22, marginTop: 16, paddingTop: 14, borderTop: '2px solid var(--black)' }}>
                  <span>Gesamt</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--gray-400)', textAlign: 'right', marginBottom: 16 }}>
                  {!hasLocal && hasCNC
                    ? 'Ex Works IT — Zoll & Einfuhr-MwSt. bei Import separat'
                    : hasCNC
                    ? 'inkl. CH-MwSt auf Lagerprodukte · C&C Ex Works'
                    : 'inkl. MwSt.'
                  }
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: 16, borderRadius: 'var(--radius-lg)' }}
                  disabled={loading || items.length === 0}
                >
                  {loading
                    ? (['STRIPE_CARD', 'STRIPE_TWINT', 'STRIPE_PAYPAL'].includes(paymentMethod) ? '⏳ Bestellung wird vorbereitet…' : '⏳ Wird verarbeitet…')
                    : submitLabel
                  }
                </button>

                <p style={{ fontSize: 11.5, color: 'var(--gray-400)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
                  Mit der Bestellung akzeptieren Sie unsere{' '}
                  <a href="/agb" style={{ color: 'var(--accent)' }}>AGB</a>.
                </p>

                {/* Trust badges */}
                <div className="trust-badges">
                  {['🔒 Sicher', '🇨🇭 Schweiz', isMixed ? '🚚🏢 Gemischt' : primaryShipping === 'SELF_PICKUP' ? '🚗 Ex Works' : primaryShipping === 'LOCAL_PICKUP' ? '🏢 Abholung Basel' : '🚚 Lieferung'].map(b => (
                    <span key={b} style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 500 }}>{b}</span>
                  ))}
                </div>
              </div>

            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  )
}
