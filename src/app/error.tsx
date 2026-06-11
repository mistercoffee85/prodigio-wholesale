'use client'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#f8f9fb' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Etwas ist schiefgelaufen</h1>
        <p style={{ color: '#6b7280', marginBottom: 28, lineHeight: 1.7 }}>
          Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut —
          falls das Problem bestehen bleibt, kontaktieren Sie uns unter{' '}
          <a href="mailto:contact@prodigio.ch" style={{ color: '#1a9e7a' }}>contact@prodigio.ch</a>.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{ background: '#1a9e7a', color: 'white', border: 'none', padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            Erneut versuchen
          </button>
          <a
            href="/"
            style={{ display: 'inline-block', border: '1.5px solid #d1d5db', color: '#374151', padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
          >
            Zur Startseite
          </a>
        </div>
      </div>
    </main>
  )
}
