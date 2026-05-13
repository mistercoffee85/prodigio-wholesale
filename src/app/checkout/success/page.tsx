import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const metadata = { title: 'Bestellung erfolgreich – PRO.DI.GIO' }

export default function SuccessPage({ searchParams }: { searchParams: { order?: string } }) {
  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 520 }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, marginBottom: 12 }}>Bestellung aufgegeben!</h1>
          {searchParams.order && (
            <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 10, padding: '14px 20px', marginBottom: 20, fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>
              Bestellnummer: #{searchParams.order}
            </div>
          )}
          <p style={{ color: 'var(--gray-600)', marginBottom: 28, lineHeight: 1.75, fontSize: 15 }}>
            Vielen Dank für Ihre Bestellung! Sie erhalten in Kürze eine Bestätigung per E-Mail mit allen Details. Bei Fragen: <a href="mailto:wholesale@prodigio.ch" style={{ color: 'var(--accent)' }}>wholesale@prodigio.ch</a>
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/dashboard" className="btn btn-black btn-lg">Meine Bestellungen</Link>
            <Link href="/products" className="btn btn-outline btn-lg">Weiter einkaufen</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
