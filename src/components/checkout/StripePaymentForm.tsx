'use client'
import { useState } from 'react'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import { formatPrice } from '@/lib/utils'

// Load Stripe once — outside component to avoid re-initialisation
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ─────────────────────────────────────────────────────────────────
// Inner form (must live inside <Elements>)
// ─────────────────────────────────────────────────────────────────
function CardForm({
  total,
  orderNumber,
  isTwint = false,
  onCancel,
}: {
  total: number
  orderNumber: string
  isTwint?: boolean
  onCancel: () => void
}) {
  const stripe   = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Stripe redirects here after 3DS / successful payment
        return_url: `${window.location.origin}/checkout/success?order=${orderNumber}`,
      },
    })

    // Only reaches here on error — success = redirect
    if (stripeError) {
      setError(stripeError.message ?? 'Zahlung fehlgeschlagen. Bitte erneut versuchen.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Stripe's hosted payment form — handles card validation, 3DS, etc. */}
      <div style={{ marginBottom: 20 }}>
        <PaymentElement
          options={{
            layout: 'tabs',
            fields: { billingDetails: { name: 'auto', email: 'never' } },
          }}
        />
      </div>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
          padding: '10px 14px', marginBottom: 14, color: '#b91c1c', fontSize: 13.5,
        }}>
          ⚠️ {error}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: 16, borderRadius: 'var(--radius-lg)', marginBottom: 10 }}
        disabled={loading || !stripe || !elements}
      >
        {loading ? '⏳ Zahlung wird verarbeitet…' : `🔒 Jetzt bezahlen – ${formatPrice(total)}`}
      </button>

      <button
        type="button"
        onClick={onCancel}
        style={{ width: '100%', background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: 13, cursor: 'pointer', padding: '6px 0' }}
        disabled={loading}
      >
        ← Zurück zur Zahlungsauswahl
      </button>

      <p style={{ fontSize: 11, color: 'var(--gray-400)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
        {isTwint
          ? <>Gesichert durch <strong>Stripe</strong> · Schweizer Zahlungsmethode 🇨🇭</>
          : <>Gesichert durch <strong>Stripe</strong> · Ihre Kartendaten werden niemals auf unseren Servern gespeichert.</>
        }
      </p>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────
// Exported wrapper — initialises Elements with the clientSecret
// ─────────────────────────────────────────────────────────────────
export default function StripePaymentForm({
  clientSecret,
  total,
  orderNumber,
  isTwint = false,
  onCancel,
}: {
  clientSecret: string
  total: number
  orderNumber: string
  isTwint?: boolean
  onCancel: () => void
}) {
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary:    '#1a9e7a',   // PRO.DI.GIO accent
        colorBackground: '#ffffff',
        colorText:       '#1a1a1a',
        borderRadius:    '8px',
        fontFamily:      'Inter, system-ui, sans-serif',
      },
    },
  }

  return (
    <div className="card" style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 22 }}>{isTwint ? '📱' : '💳'}</span>
        <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{isTwint ? 'TWINT' : 'Kartenzahlung'}</h2>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {isTwint
            ? [<span key="twint" style={{ fontSize: 9, fontWeight: 800, padding: '3px 6px', border: '1px solid var(--gray-200)', borderRadius: 4, color: 'var(--gray-400)', letterSpacing: 1 }}>TWINT</span>]
            : ['VISA', 'MC', 'AMEX'].map(b => (
              <span key={b} style={{ fontSize: 9, fontWeight: 800, padding: '3px 6px', border: '1px solid var(--gray-200)', borderRadius: 4, color: 'var(--gray-400)', letterSpacing: 1 }}>{b}</span>
            ))
          }
        </div>
      </div>

      <Elements stripe={stripePromise} options={options}>
        <CardForm total={total} orderNumber={orderNumber} isTwint={isTwint} onCancel={onCancel} />
      </Elements>
    </div>
  )
}
