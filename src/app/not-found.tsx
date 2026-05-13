import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const metadata = { title: '404 – Seite nicht gefunden | PRO.DI.GIO' }

export default function NotFound() {
  return (
    <>
      <Header />
      <main style={{ minHeight: '70vh', background: '#f8f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>🔍</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px,5vw,48px)', fontWeight: 700, marginBottom: 12 }}>
            Seite nicht gefunden
          </h1>
          <p style={{ color: 'var(--gray-400)', fontSize: 16, marginBottom: 32, maxWidth: 420, margin: '0 auto 32px' }}>
            Die angeforderte Seite existiert nicht oder wurde verschoben.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/products" className="btn btn-primary" style={{ padding: '12px 28px' }}>
              Sortiment entdecken →
            </Link>
            <Link href="/" className="btn btn-outline" style={{ padding: '12px 28px' }}>
              Zur Startseite
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
