'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const INDUSTRIES = [
  'Gastronomie / Café / Restaurant',
  'Einzelhandel / Supermarkt',
  'Online-Handel / E-Commerce',
  'Kiosk / Convenience',
  'Grosshandel / Distributor',
  'Bäckerei / Konditorei',
  'Hotel / Catering',
  'Andere',
]

// ⚠️ Must be defined OUTSIDE the page component —
// otherwise React recreates it on every keystroke and inputs lose focus.
interface FieldProps {
  label: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
  autoFocus?: boolean
  value: string
  error?: string
  onChange: (name: string, value: string) => void
}

function Field({ label, name, type = 'text', placeholder = '', required = true, autoFocus = false, value, error, onChange }: FieldProps) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}{required && <span style={{ color: 'var(--warn)', marginLeft: 2 }}>*</span>}
      </label>
      <input
        type={type}
        className={`form-input${error ? ' error' : ''}`}
        placeholder={placeholder}
        value={value}
        autoFocus={autoFocus}
        onChange={e => onChange(name, e.target.value)}
        autoComplete={name === 'email' ? 'email' : type === 'password' ? 'new-password' : 'off'}
      />
      {error && <div className="form-error">{error}</div>}
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
    company: '', industry: '', address: '', city: '', zip: '', uid: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Pflichtfeld'
    if (!form.email.includes('@')) e.email = 'Ungültige E-Mail-Adresse'
    if (form.password.length < 8) e.password = 'Mindestens 8 Zeichen'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwörter stimmen nicht überein'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e: Record<string, string> = {}
    if (!form.company.trim()) e.company = 'Pflichtfeld'
    if (!form.industry) e.industry = 'Bitte wählen'
    if (!form.address.trim()) e.address = 'Pflichtfeld'
    if (!form.zip.trim()) e.zip = 'Pflichtfeld'
    if (!form.city.trim()) e.city = 'Pflichtfeld'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep2()) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Fehler bei der Registrierung')
      } else {
        setSuccess(true)
      }
    } catch {
      toast.error('Netzwerkfehler. Bitte erneut versuchen.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 500, textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 28px' }}>✅</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, marginBottom: 14 }}>Registrierung erfolgreich!</h1>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.75, fontSize: 15, marginBottom: 32 }}>
            Vielen Dank! Ihre Anfrage wurde erhalten. Unser Team prüft Ihr Konto und schaltet es
            innerhalb von <strong>1 Werktag</strong> frei. Sie erhalten eine Bestätigungs-E-Mail.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/" className="btn btn-black btn-lg">Zur Startseite</Link>
            <Link href="/login" className="btn btn-outline btn-lg">Anmelden</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left — Brand Panel */}
      <div style={{
        width: '38%', minWidth: 280,
        background: 'linear-gradient(150deg, var(--forest) 0%, #1a3d28 60%, #0d2218 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 44px', color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: .03, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/svg%3E")', pointerEvents: 'none' }} />

        <Link href="/" style={{ textDecoration: 'none', color: 'white' }}>
          <div style={{ fontWeight: 800, fontSize: 19, letterSpacing: 4 }}>PRO.DI.GIO</div>
          <div style={{ fontSize: 9, letterSpacing: 3, opacity: .5, marginTop: 3 }}>GROSSHANDEL · BASEL</div>
        </Link>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--accent)', marginBottom: 18, textTransform: 'uppercase' }}>B2B Konto eröffnen</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 34, fontWeight: 700, lineHeight: 1.2, marginBottom: 18 }}>
            Werden Sie<br />B2B-Partner
          </h2>
          <p style={{ fontSize: 14, opacity: .68, lineHeight: 1.75, marginBottom: 36, maxWidth: 300 }}>
            Registrieren Sie sich kostenlos und erhalten Sie Zugang zu exklusiven Grosshandelskonditionen.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { n: 1, label: 'Kontaktdaten', done: step > 1 },
              { n: 2, label: 'Unternehmen', done: false },
            ].map(({ n, label, done }) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: done ? 'var(--accent)' : step === n ? 'rgba(26,158,122,.3)' : 'rgba(255,255,255,.1)',
                  border: `2px solid ${done || step === n ? 'var(--accent)' : 'rgba(255,255,255,.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>
                  {done ? '✓' : n}
                </div>
                <span style={{ fontSize: 14, opacity: step === n ? 1 : .55, fontWeight: step === n ? 600 : 400 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, opacity: .4 }}>© {new Date().getFullYear()} PRO.DI.GIO GmbH</div>
      </div>

      {/* Right — Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 48px 48px', background: 'var(--cream)', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--black)' }}>
              {step === 1 ? 'Kontaktdaten' : 'Unternehmensdaten'}
            </h2>
            <span style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 500 }}>Schritt {step} / 2</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--gray-400)', marginBottom: 32 }}>
            Bereits registriert?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Anmelden</Link>
          </p>

          {/* Progress Bar */}
          <div style={{ height: 4, background: 'var(--gray-100)', borderRadius: 2, marginBottom: 36, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: step === 1 ? '50%' : '100%', background: 'var(--accent)', borderRadius: 2, transition: 'width .4s' }} />
          </div>

          {step === 1 ? (
            <form onSubmit={e => { e.preventDefault(); if (validateStep1()) setStep(2) }}>
              <div className="form-row">
                <Field label="Vollständiger Name" name="name" placeholder="Max Mustermann" autoFocus value={form.name} error={errors.name} onChange={set} />
                <Field label="Telefon" name="phone" type="tel" placeholder="+41 61 ..." required={false} value={form.phone} error={errors.phone} onChange={set} />
              </div>
              <Field label="E-Mail-Adresse" name="email" type="email" placeholder="name@unternehmen.ch" value={form.email} error={errors.email} onChange={set} />
              <div className="form-row">
                <Field label="Passwort" name="password" type="password" placeholder="Mindestens 8 Zeichen" value={form.password} error={errors.password} onChange={set} />
                <Field label="Passwort bestätigen" name="confirmPassword" type="password" placeholder="Wiederholen" value={form.confirmPassword} error={errors.confirmPassword} onChange={set} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 8, borderRadius: 'var(--radius-lg)' }}>
                Weiter zu Unternehmensdaten →
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <Field label="Firmenname" name="company" placeholder="Mustermann GmbH" autoFocus value={form.company} error={errors.company} onChange={set} />
              <div className="form-group">
                <label className="form-label">Branche<span style={{ color: 'var(--warn)', marginLeft: 2 }}>*</span></label>
                <select className={`form-input${errors.industry ? ' error' : ''}`} value={form.industry} onChange={e => set('industry', e.target.value)}>
                  <option value="">Bitte wählen...</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
                {errors.industry && <div className="form-error">{errors.industry}</div>}
              </div>
              <Field label="Strasse & Hausnummer" name="address" placeholder="Musterstrasse 1" value={form.address} error={errors.address} onChange={set} />
              <div className="form-row">
                <Field label="PLZ" name="zip" placeholder="4000" value={form.zip} error={errors.zip} onChange={set} />
                <Field label="Ort / Stadt" name="city" placeholder="Basel" value={form.city} error={errors.city} onChange={set} />
              </div>
              <Field label="UID-Nummer (optional)" name="uid" placeholder="CHE-123.456.789" required={false} value={form.uid} error={errors.uid} onChange={set} />

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-outline" style={{ flex: '0 0 auto', padding: '14px 20px', borderRadius: 'var(--radius-lg)' }} onClick={() => setStep(1)}>
                  ← Zurück
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '14px', fontSize: 15, borderRadius: 'var(--radius-lg)' }} disabled={loading}>
                  {loading ? 'Wird gesendet...' : 'B2B-Konto eröffnen →'}
                </button>
              </div>

              <p style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
                Mit der Registrierung stimmen Sie unseren{' '}
                <Link href="/agb" style={{ color: 'var(--accent)' }}>AGB</Link> zu.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
