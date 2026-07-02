'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

// ── Default values (what the site currently shows hardcoded) ─────────────────
const DEFAULTS = {
  homepage_hero_tag:         'B2B Grosshandel · Schweiz',
  homepage_hero_h1_line1:    'Premium-Produkte.',
  homepage_hero_h1_line2:    'Direktimport.',
  homepage_hero_h1_accent:   'Ihr Erfolg.',
  homepage_hero_paragraph:   'Bubble Tea, TEABALLS, Gourmet-Spezialitäten und mehr — direkt vom Importeur. Exklusive B2B-Grosshandelspreise für Wiederverkäufer und Gastronomie in der Schweiz.',
  homepage_hero_btn1_text:   'Sortiment entdecken →',
  homepage_hero_btn1_url:    '/products',
  homepage_hero_btn2_text:   'B2B-Konto eröffnen',
  homepage_hero_btn2_url:    '/register',
  homepage_hero_banner_desktop: '',
  homepage_hero_banner_mobile:  '',
  homepage_hero_use_banner:     'false',
  homepage_announcement:        '',
  homepage_announcement_active: 'false',
  homepage_stats: JSON.stringify([
    { num: '500+', label: 'B2B-Kunden' },
    { num: '—',    label: 'Produkte (live)' },
    { num: '5',    label: 'Marken' },
    { num: '2–4',  label: 'Werktage' },
  ]),
  homepage_trust_bar: JSON.stringify([
    { icon: '🚚', main: 'Schnelle Lieferung',       sub: '2–4 Werktage · Schweizweit' },
    { icon: '🏭', main: 'Direktimport',              sub: 'Beste Konditionen schweizweit' },
    { icon: '✅', main: 'Kein Zwischenhandel',       sub: 'Direkt vom Importeur' },
    { icon: '📦', main: 'Flexible Mindestmengen',   sub: 'Ab 6 Verkaufseinheiten' },
    { icon: '🇨🇭', main: 'Schweizer Unternehmen',  sub: 'Prodigio GmbH seit 2013' },
  ]),
}

type Settings = typeof DEFAULTS
type Stat  = { num: string; label: string }
type Trust = { icon: string; main: string; sub: string }

// ── Small helper components ──────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 6 }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: 8, fontSize: 12 }}>{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 8,
        border: '1.5px solid #e5e7eb', fontSize: mono ? 13 : 14,
        fontFamily: mono ? 'monospace' : undefined,
        outline: 'none', background: '#fff', boxSizing: 'border-box',
      }}
      onFocus={e => (e.target.style.borderColor = '#10b981')}
      onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
    />
  )
}

function Textarea({ value, onChange, rows = 3, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 8,
        border: '1.5px solid #e5e7eb', fontSize: 14, resize: 'vertical',
        outline: 'none', background: '#fff', boxSizing: 'border-box',
        lineHeight: 1.6,
      }}
      onFocus={e => (e.target.style.borderColor = '#10b981')}
      onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
    />
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 20 }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#111827', borderBottom: '1px solid #f3f4f6', paddingBottom: 14 }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

// ── Image upload component ───────────────────────────────────────────────────
function ImageUploader({ value, onChange, label }: { value: string; onChange: (url: string) => void; label: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  async function handleFile(file: File) {
    setUploading(true)
    setUploadError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error ?? 'Upload fehlgeschlagen')
      } else {
        onChange(data.url)
      }
    } catch {
      setUploadError('Netzwerkfehler beim Upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <Input value={value} onChange={onChange} placeholder="https://... URL einfügen oder Datei hochladen" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '9px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb',
            background: '#f9fafb', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            whiteSpace: 'nowrap', color: '#374151',
          }}
        >
          {uploading ? '⏳' : '📤 Upload'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.target.value = ''
          }}
        />
      </div>
      {uploadError && <p style={{ color: '#dc2626', fontSize: 12, margin: '4px 0' }}>{uploadError}</p>}
      {value && (
        <div style={{ position: 'relative', height: 120, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f3f4f6' }}>
          {value.startsWith('http') || value.startsWith('/') ? (
            <Image src={value} alt={label} fill style={{ objectFit: 'contain' }} unoptimized />
          ) : null}
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.6)',
              color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px',
              fontSize: 12, cursor: 'pointer',
            }}
          >
            ✕ Entfernen
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function HomepageAdminPage() {
  const [settings, setSettings] = useState<Settings>({ ...DEFAULTS })
  const [stats, setStats] = useState<Stat[]>(JSON.parse(DEFAULTS.homepage_stats))
  const [trust, setTrust] = useState<Trust[]>(JSON.parse(DEFAULTS.homepage_trust_bar))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/homepage-settings')
      .then(r => r.json())
      .then((data: Partial<Settings>) => {
        const merged = { ...DEFAULTS, ...data }
        setSettings(merged)
        try { setStats(JSON.parse(merged.homepage_stats)) } catch { /* keep default */ }
        try { setTrust(JSON.parse(merged.homepage_trust_bar)) } catch { /* keep default */ }
      })
      .catch(() => setError('Einstellungen konnten nicht geladen werden'))
      .finally(() => setLoading(false))
  }, [])

  function set(key: keyof Settings, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  function setStat(i: number, field: keyof Stat, value: string) {
    setStats(prev => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })
  }

  function setTrustItem(i: number, field: keyof Trust, value: string) {
    setTrust(prev => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const payload: Settings = {
        ...settings,
        homepage_stats:     JSON.stringify(stats),
        homepage_trust_bar: JSON.stringify(trust),
      }
      const res = await fetch('/api/admin/homepage-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
        Einstellungen laden…
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827' }}>
            🏠 Hauptseite bearbeiten
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
            Alle Änderungen werden live auf b2b.prodigio.ch übernommen
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && (
            <span style={{ color: '#10b981', fontWeight: 600, fontSize: 14 }}>✓ Gespeichert</span>
          )}
          {error && (
            <span style={{ color: '#dc2626', fontSize: 13 }}>{error}</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: '#10b981', color: '#fff', border: 'none',
              borderRadius: 10, padding: '10px 24px', fontWeight: 700,
              fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? .7 : 1,
            }}
          >
            {saving ? 'Speichern…' : '💾 Speichern'}
          </button>
        </div>
      </div>

      {/* ── Ankündigungsbalken ── */}
      <Section title="📢 Ankündigungsbalken (oben)">
        <Field label="Aktiv">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.homepage_announcement_active === 'true'}
              onChange={e => set('homepage_announcement_active', e.target.checked ? 'true' : 'false')}
              style={{ width: 16, height: 16, accentColor: '#10b981' }}
            />
            <span style={{ fontSize: 14, color: '#374151' }}>Balken anzeigen</span>
          </label>
        </Field>
        <Field label="Text" hint="z.B. '🎉 Neu: BobaJoy jetzt verfügbar — jetzt bestellen!'">
          <Input
            value={settings.homepage_announcement}
            onChange={v => set('homepage_announcement', v)}
            placeholder="Ankündigung hier eingeben…"
          />
        </Field>
      </Section>

      {/* ── Hero Bilder ── */}
      <Section title="🖼️ Hero Banner Bild (optional)">
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, marginTop: -8 }}>
          Wenn ein Bild eingetragen ist, wird es statt der Marken-Mosaikansicht angezeigt.
          Leer lassen für die Standard-Mosaikansicht.
        </p>
        <Field label="Aktiv">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.homepage_hero_use_banner === 'true'}
              onChange={e => set('homepage_hero_use_banner', e.target.checked ? 'true' : 'false')}
              style={{ width: 16, height: 16, accentColor: '#10b981' }}
            />
            <span style={{ fontSize: 14, color: '#374151' }}>Banner-Bild verwenden (statt Mosaik)</span>
          </label>
        </Field>
        <Field label="Desktop Banner" hint="Empfohlen: 1600×720px oder breiter">
          <ImageUploader
            label="Desktop Banner"
            value={settings.homepage_hero_banner_desktop}
            onChange={v => set('homepage_hero_banner_desktop', v)}
          />
        </Field>
        <Field label="Mobile Banner" hint="Empfohlen: 750×900px (Hochformat)">
          <ImageUploader
            label="Mobile Banner"
            value={settings.homepage_hero_banner_mobile}
            onChange={v => set('homepage_hero_banner_mobile', v)}
          />
        </Field>
      </Section>

      {/* ── Hero Text ── */}
      <Section title="✏️ Hero Text">
        <Field label="Tag-Label" hint="Kleiner Badge über dem Titel">
          <Input
            value={settings.homepage_hero_tag}
            onChange={v => set('homepage_hero_tag', v)}
            placeholder="z.B. B2B Grosshandel · Schweiz"
          />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Titel Zeile 1">
            <Input
              value={settings.homepage_hero_h1_line1}
              onChange={v => set('homepage_hero_h1_line1', v)}
              placeholder="z.B. Premium-Produkte."
            />
          </Field>
          <Field label="Titel Zeile 2">
            <Input
              value={settings.homepage_hero_h1_line2}
              onChange={v => set('homepage_hero_h1_line2', v)}
              placeholder="z.B. Direktimport."
            />
          </Field>
        </div>
        <Field label="Titel Zeile 3 (Akzentfarbe)">
          <Input
            value={settings.homepage_hero_h1_accent}
            onChange={v => set('homepage_hero_h1_accent', v)}
            placeholder="z.B. Ihr Erfolg."
          />
        </Field>
        <Field label="Beschreibungstext">
          <Textarea
            value={settings.homepage_hero_paragraph}
            onChange={v => set('homepage_hero_paragraph', v)}
            rows={3}
            placeholder="Kurzer Einleitungstext…"
          />
        </Field>
      </Section>

      {/* ── Buttons ── */}
      <Section title="🔘 Buttons">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Button 1 Text (Hauptfarbe)">
            <Input
              value={settings.homepage_hero_btn1_text}
              onChange={v => set('homepage_hero_btn1_text', v)}
              placeholder="z.B. Sortiment entdecken →"
            />
          </Field>
          <Field label="Button 1 URL">
            <Input
              value={settings.homepage_hero_btn1_url}
              onChange={v => set('homepage_hero_btn1_url', v)}
              placeholder="/products"
              mono
            />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Button 2 Text (Ghost)">
            <Input
              value={settings.homepage_hero_btn2_text}
              onChange={v => set('homepage_hero_btn2_text', v)}
              placeholder="z.B. B2B-Konto eröffnen"
            />
          </Field>
          <Field label="Button 2 URL">
            <Input
              value={settings.homepage_hero_btn2_url}
              onChange={v => set('homepage_hero_btn2_url', v)}
              placeholder="/register"
              mono
            />
          </Field>
        </div>
      </Section>

      {/* ── Statistiken ── */}
      <Section title="📊 Kennzahlen (4 Felder unter dem Hero)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ background: '#f9fafb', borderRadius: 10, padding: 14 }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
                Kennzahl {i + 1}
              </p>
              <Field label="Zahl">
                <Input
                  value={stat.num}
                  onChange={v => setStat(i, 'num', v)}
                  placeholder="z.B. 500+"
                />
              </Field>
              <Field label="Beschriftung">
                <Input
                  value={stat.label}
                  onChange={v => setStat(i, 'label', v)}
                  placeholder="z.B. B2B-Kunden"
                />
              </Field>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Trust Bar ── */}
      <Section title="✅ Vertrauensbalken (unter dem Hero)">
        {trust.map((item, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', gap: 10, marginBottom: 12, alignItems: 'end' }}>
            <Field label={i === 0 ? 'Icon' : ' '}>
              <Input value={item.icon} onChange={v => setTrustItem(i, 'icon', v)} placeholder="🚚" />
            </Field>
            <Field label={i === 0 ? 'Haupttext' : ' '}>
              <Input value={item.main} onChange={v => setTrustItem(i, 'main', v)} placeholder="Schnelle Lieferung" />
            </Field>
            <Field label={i === 0 ? 'Untertext' : ' '}>
              <Input value={item.sub} onChange={v => setTrustItem(i, 'sub', v)} placeholder="2–4 Werktage · Schweizweit" />
            </Field>
          </div>
        ))}
      </Section>

      {/* Bottom Save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
        {saved && <span style={{ color: '#10b981', fontWeight: 600, fontSize: 14, alignSelf: 'center' }}>✓ Gespeichert!</span>}
        {error && <span style={{ color: '#dc2626', fontSize: 13, alignSelf: 'center' }}>{error}</span>}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: '#10b981', color: '#fff', border: 'none',
            borderRadius: 10, padding: '12px 32px', fontWeight: 700,
            fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? .7 : 1,
          }}
        >
          {saving ? 'Speichern…' : '💾 Änderungen speichern'}
        </button>
      </div>
    </div>
  )
}
