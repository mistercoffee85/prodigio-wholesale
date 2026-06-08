'use client'
import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCartStore } from '@/store/cart'
import toast from 'react-hot-toast'

function SuccessContent() {
  const searchParams   = useSearchParams()
  const router         = useRouter()
  const orderNumber    = searchParams.get('order')
  const redirectStatus = searchParams.get('redirect_status') // Stripe setzt dies nach Redirect
  const clearCart      = useCartStore(s => s.clearCart)

  useEffect(() => {
    // Stripe: redirect_status='failed' oder 'canceled' → zurück zur Kasse
    if (redirectStatus === 'failed' || redirectStatus === 'canceled') {
      toast.error('Zahlung fehlgeschlagen oder abgebrochen. Warenkorb bleibt erhalten.')
      router.replace('/checkout')
      return
    }
    // 'succeeded' oder 'processing' (TWINT/async) oder kein Status (Vorauskasse) → Erfolg
    clearCart()
  }, [redirectStatus, clearCart, router])

  // Wenn Zahlung fehlgeschlagen → kurz leer zeigen während Redirect
  if (redirectStatus === 'failed' || redirectStatus === 'canceled') {
    return <main style={{ minHeight: '80vh' }} />
  }

  return (
    <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 520, width: '100%' }}>
        <div style={{ fontSize: 'clamp(48px, 10vw, 72px)', marginBottom: 20 }}>🎉</div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(24px, 5vw, 32px)', marginBottom: 12 }}>Bestellung aufgegeben!</h1>
        {orderNumber && (
          <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 10, padding: '14px 20px', marginBottom: 20, fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>
            Bestellnummer: #{orderNumber}
          </div>
        )}
        <p style={{ color: 'var(--gray-600)', marginBottom: 28, lineHeight: 1.75, fontSize: 15 }}>
          Vielen Dank für Ihre Bestellung! Sie erhalten in Kürze eine Bestätigung per E-Mail mit allen Details.
          Bei Fragen: <a href="mailto:contact@prodigio.ch" style={{ color: 'var(--accent)' }}>contact@prodigio.ch</a>
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" className="btn btn-black btn-lg">Meine Bestellungen</Link>
          <Link href="/products" className="btn btn-outline btn-lg">Weiter einkaufen</Link>
        </div>
      </div>
    </main>
  )
}

export default function SuccessPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<main style={{ minHeight: '80vh' }} />}>
        <SuccessContent />
      </Suspense>
      <Footer />
    </>
  )
}
