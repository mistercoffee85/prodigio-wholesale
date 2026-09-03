'use client'
import { useState, Suspense, useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const form = { email, password }

  const handleEmail = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value), [])
  const handlePassword = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value), [])

  const error = searchParams.get('error')
  const errorMsg =
    error === 'pending'  || error === 'PENDING'  ? 'Ihr Konto wartet auf Freigabe durch einen Administrator.' :
    error === 'REJECTED' ? 'Ihre Anfrage wurde abgelehnt. Bitte kontaktieren Sie uns.' :
    error === 'forbidden' ? 'Kein Zugriff auf diese Seite.' : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await signIn('credentials', { email: form.email.toLowerCase(), password: form.password, redirect: false })
    setLoading(false)
    if (res?.error) {
      toast.error(res.error === 'PENDING' ? 'Konto wartet auf Freigabe.' : res.error === 'REJECTED' ? 'Anfrage abgelehnt.' : 'E-Mail oder Passwort falsch.')
    } else {
      toast.success('Willkommen zurück!')
      // Check session to redirect based on role
      const { getSession } = await import('next-auth/react')
      const session = await getSession()
      const callbackUrl = searchParams.get('callbackUrl')
      if (callbackUrl && !callbackUrl.includes('/login')) {
        router.push(callbackUrl)
      } else if (session?.user?.role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/products')
      }
      router.refresh()
    }
  }

  return (
    <>
      <style>{`
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: row;
        }
        .login-brand {
          width: 42%;
          background: linear-gradient(150deg, var(--forest) 0%, #1a3d28 60%, #0d2218 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: clamp(32px, 4vw, 48px) clamp(24px, 4vw, 52px);
          color: white;
          position: relative;
          overflow: hidden;
        }
        .login-form {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(24px, 5vw, 48px) clamp(16px, 5vw, 40px);
          background: var(--cream);
        }
        .login-brand h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(28px, 3vw, 38px);
          font-weight: 700;
          line-height: 1.15;
          margin-bottom: 20px;
        }
        @media (max-width: 768px) {
          .login-wrapper {
            flex-direction: column;
          }
          .login-brand {
            display: none;
          }
          .login-form {
            min-height: 100vh;
            align-items: flex-start;
            padding: clamp(24px, 6vw, 40px) clamp(16px, 6vw, 32px);
          }
        }
      `}</style>
      <div className="login-wrapper">
        {/* Left — Brand Panel */}
        <div className="login-brand">
          <div style={{ position: 'absolute', inset: 0, opacity: .03, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/svg%3E")', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '10%', right: '-15%', width: 380, height: 380, background: 'radial-gradient(circle, rgba(26,158,122,.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <Link href="/" style={{ textDecoration: 'none', color: 'white', position: 'relative' }}>
            <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: 4 }}>PRO.DI.GIO</div>
            <div style={{ fontSize: 9, letterSpacing: 3, opacity: .5, marginTop: 3 }}>GROSSHANDEL · BASEL</div>
          </Link>

          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--accent)', marginBottom: 20, textTransform: 'uppercase' }}>B2B Grosshandel</div>
            <h1>
              Willkommen<br />zurück
            </h1>
            <p style={{ fontSize: 15, opacity: .7, lineHeight: 1.75, marginBottom: 40, maxWidth: 340 }}>
              Exklusive Grosshandelspreise für Wiederverkäufer, Gastronomie und Einzelhandel.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: '💰', text: 'STANDARD · PREMIUM · VIP Preise' },
                { icon: '🚚', text: 'Lieferung & Abholung in der Schweiz' },
                { icon: '📦', text: '88+ Produkte, Direktimport' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(26,158,122,.2)', border: '1px solid rgba(26,158,122,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 13.5, opacity: .8 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 12, opacity: .4, position: 'relative' }}>© {new Date().getFullYear()} PRO.DI.GIO GmbH · Basel</div>
        </div>

        {/* Right — Form */}
        <div className="login-form">
          <div style={{ width: '100%', maxWidth: 400 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: 'var(--black)' }}>Anmelden</h2>
            <p style={{ fontSize: 14, color: 'var(--gray-400)', marginBottom: 32 }}>
              Noch kein Konto?{' '}
              <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>B2B-Konto eröffnen →</Link>
            </p>

            {errorMsg && <div className="alert alert-warn" style={{ marginBottom: 24 }}>{errorMsg}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">E-Mail-Adresse</label>
                <input type="email" className="form-input" placeholder="name@unternehmen.ch" autoComplete="email" required autoFocus
                  value={email} onChange={handleEmail} />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>Passwort</label>
                  <Link href="/forgot-password" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>Passwort vergessen?</Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} className="form-input" placeholder="••••••••" autoComplete="current-password" required
                    value={password} onChange={handlePassword}
                    style={{ paddingRight: 46 }} />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 17, color: 'var(--gray-300)', cursor: 'pointer', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none' }}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-black" style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 4, borderRadius: 'var(--radius-lg)' }} disabled={loading}>
                {loading ? 'Anmelden...' : 'Anmelden →'}
              </button>
            </form>

            <div style={{ marginTop: 28, padding: '18px 20px', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--gray-400)', lineHeight: 1.6 }}>
                Nur für registrierte B2B-Kunden.<br />
                Fragen? <a href="mailto:contact@prodigio.ch" style={{ color: 'var(--accent)', fontWeight: 600 }}>contact@prodigio.ch</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
