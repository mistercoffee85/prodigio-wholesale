'use client'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Passwort muss mindestens 8 Zeichen haben')
      return
    }
    if (password !== confirm) {
      toast.error('Passwörter stimmen nicht überein')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Fehler aufgetreten')
      } else {
        setDone(true)
        setTimeout(() => router.push('/login'), 3000)
      }
    } catch {
      toast.error('Netzwerkfehler. Bitte erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, background: 'var(--cream)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--gray-400)', marginBottom: 24 }}>Ungültiger Link.</p>
          <Link href="/forgot-password" className="btn btn-black" style={{ padding: '12px 28px', borderRadius: 'var(--radius-lg)' }}>
            Neuen Link anfordern
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', background: 'var(--cream)' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 24px' }}>✅</div>
            <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>Passwort geändert!</h2>
            <p style={{ color: 'var(--gray-400)', lineHeight: 1.75, fontSize: 14 }}>
              Sie werden automatisch zur Anmeldung weitergeleitet...
            </p>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: 'var(--black)' }}>Neues Passwort</h2>
            <p style={{ fontSize: 14, color: 'var(--gray-400)', marginBottom: 32 }}>
              Bitte wählen Sie ein neues Passwort für Ihr Konto.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Neues Passwort</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Mindestens 8 Zeichen"
                    autoComplete="new-password"
                    autoFocus
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ paddingRight: 46 }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 17, color: 'var(--gray-300)', cursor: 'pointer' }}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Passwort bestätigen</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Wiederholen"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-black"
                style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 4, borderRadius: 'var(--radius-lg)' }}
                disabled={loading}
              >
                {loading ? 'Wird gespeichert...' : 'Passwort speichern →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left — Brand Panel */}
      <div style={{
        width: '42%', minWidth: 320,
        background: 'linear-gradient(150deg, var(--forest) 0%, #1a3d28 60%, #0d2218 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 52px', color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: .03, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/svg%3E")', pointerEvents: 'none' }} />

        <Link href="/" style={{ textDecoration: 'none', color: 'white', position: 'relative' }}>
          <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: 4 }}>PRO.DI.GIO</div>
          <div style={{ fontSize: 9, letterSpacing: 3, opacity: .5, marginTop: 3 }}>GROSSHANDEL · BASEL</div>
        </Link>

        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--accent)', marginBottom: 20, textTransform: 'uppercase' }}>Sicherheit</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, fontWeight: 700, lineHeight: 1.15, marginBottom: 20 }}>
            Neues<br />Passwort
          </h1>
          <p style={{ fontSize: 15, opacity: .7, lineHeight: 1.75, maxWidth: 340 }}>
            Wählen Sie ein sicheres Passwort mit mindestens 8 Zeichen.
          </p>
        </div>

        <div style={{ fontSize: 12, opacity: .4, position: 'relative' }}>© {new Date().getFullYear()} PRO.DI.GIO GmbH · Dreispitz Basel</div>
      </div>

      <Suspense fallback={<div style={{ flex: 1, background: 'var(--cream)' }} />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
