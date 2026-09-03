'use client'
import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) {
      toast.error('Ungültige E-Mail-Adresse')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSent(true)
      } else {
        const data = await res.json()
        toast.error(data.error ?? 'Fehler aufgetreten')
      }
    } catch {
      toast.error('Netzwerkfehler. Bitte erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .fp-outer {
          min-height: 100vh;
          display: flex;
          flex-wrap: wrap;
        }
        .fp-brand {
          width: 42%;
          min-width: 320px;
          background: linear-gradient(150deg, var(--forest) 0%, #1a3d28 60%, #0d2218 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: clamp(32px, 5vw, 48px) clamp(24px, 5vw, 52px);
          color: white;
          position: relative;
          overflow: hidden;
        }
        .fp-form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(32px, 5vw, 48px) clamp(16px, 4vw, 40px);
          background: var(--cream);
        }
        @media (max-width: 640px) {
          /* fp-outer is a wrapping row: the intro wraps to its own line but still
             stretches to the line height, leaving dead space under its text. */
          .fp-outer {
            flex-direction: column;
          }
          .fp-brand {
            display: none;
          }
          .auth-mobile-intro { display: block !important; }
          .fp-form-panel {
            width: 100%;
            /* The mobile intro now occupies the top of the screen, so the form must
               start right below it instead of centring inside a full-height panel. */
            align-items: flex-start;
            min-height: unset;
          }
        }
        @media (min-width: 641px) and (max-width: 900px) {
          .fp-brand {
            width: 100%;
            min-width: unset;
            min-height: unset;
            padding: clamp(24px, 4vw, 40px) clamp(24px, 5vw, 52px);
          }
          .fp-form-panel {
            width: 100%;
          }
        }
      `}</style>
      <div className="fp-outer">
        {/* Left — Brand Panel */}
        {/* Mobile-only header — .fp-brand is hidden on narrow screens */}
        <div className="auth-mobile-intro" style={{ display: 'none', background: 'linear-gradient(150deg, var(--forest) 0%, #1a3d28 70%, #0d2218 100%)', color: 'white', padding: '26px 24px 24px' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'white' }}>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: 3.5 }}>PRO.DI.GIO</div>
            <div style={{ fontSize: 8.5, letterSpacing: 3, opacity: .5, marginTop: 3 }}>GROSSHANDEL · BASEL</div>
          </Link>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 2, color: 'var(--accent)', margin: '18px 0 8px', textTransform: 'uppercase' }}>Passwort zurücksetzen</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 25, fontWeight: 700, lineHeight: 1.2, marginBottom: 10 }}>Passwort vergessen?</h1>
          <p style={{ fontSize: 13.5, opacity: .75, lineHeight: 1.65 }}>
            Kein Problem. Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen.
          </p>
        </div>

        <div className="fp-brand">
          <div style={{ position: 'absolute', inset: 0, opacity: .03, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/svg%3E")', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '10%', right: '-15%', width: 'clamp(200px,30vw,380px)', height: 'clamp(200px,30vw,380px)', background: 'radial-gradient(circle, rgba(26,158,122,.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <Link href="/" style={{ textDecoration: 'none', color: 'white', position: 'relative' }}>
            <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: 4 }}>PRO.DI.GIO</div>
            <div style={{ fontSize: 9, letterSpacing: 3, opacity: .5, marginTop: 3 }}>GROSSHANDEL · BASEL</div>
          </Link>

          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--accent)', marginBottom: 20, textTransform: 'uppercase' }}>Passwort zurücksetzen</div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 20 }}>
              Passwort<br />vergessen?
            </h1>
            <p style={{ fontSize: 15, opacity: .7, lineHeight: 1.75, maxWidth: 340 }}>
              Kein Problem. Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen.
            </p>
          </div>

          <div style={{ fontSize: 12, opacity: .4, position: 'relative' }}>© {new Date().getFullYear()} PRO.DI.GIO GmbH · Basel</div>
        </div>

        {/* Right — Form */}
        <div className="fp-form-panel">
          <div style={{ width: '100%', maxWidth: 400 }}>
            {sent ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 24px' }}>✉️</div>
                <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>E-Mail gesendet!</h2>
                <p style={{ color: 'var(--gray-400)', lineHeight: 1.75, fontSize: 14, marginBottom: 32 }}>
                  Falls ein Konto mit <strong>{email}</strong> existiert, erhalten Sie in Kürze eine E-Mail mit einem Link zum Zurücksetzen des Passworts.
                </p>
                <Link href="/login" className="btn btn-black" style={{ display: 'inline-block', padding: '12px 32px', borderRadius: 'var(--radius-lg)' }}>
                  Zurück zur Anmeldung
                </Link>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: 'var(--black)' }}>Passwort vergessen</h2>
                <p style={{ fontSize: 14, color: 'var(--gray-400)', marginBottom: 32 }}>
                  Zurück zur{' '}
                  <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Anmeldung</Link>
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">E-Mail-Adresse</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="name@unternehmen.ch"
                      autoComplete="email"
                      autoFocus
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-black"
                    style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 4, borderRadius: 'var(--radius-lg)' }}
                    disabled={loading}
                  >
                    {loading ? 'Wird gesendet...' : 'Link anfordern →'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
