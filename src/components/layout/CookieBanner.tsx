'use client'
import { useState, useEffect } from 'react'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show banner only if not yet accepted
    if (!localStorage.getItem('cookie-consent')) {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'rgba(18, 36, 25, 0.97)',
      backdropFilter: 'blur(8px)',
      borderTop: '1px solid rgba(255,255,255,.1)',
      padding: 'clamp(14px, 2vw, 20px) clamp(16px, 5vw, 48px)',
      display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>🍪</span>

      <p style={{ flex: 1, minWidth: 220, margin: 0, fontSize: 13.5, color: 'rgba(255,255,255,.8)', lineHeight: 1.6 }}>
        Diese Website verwendet ausschliesslich <strong style={{ color: 'white' }}>technisch notwendige Cookies</strong>{' '}
        für Login-Sitzungen und den Warenkorb. Es werden keine Tracking- oder
        Marketing-Cookies eingesetzt.{' '}
        <a href="/datenschutz" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
          Datenschutzerklärung
        </a>
      </p>

      <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
        <button
          onClick={accept}
          className="btn btn-primary"
          style={{ padding: '10px 24px', fontSize: 14, borderRadius: 8 }}
        >
          Verstanden & Akzeptieren
        </button>
        <a
          href="/datenschutz"
          style={{
            padding: '10px 18px', fontSize: 13, borderRadius: 8,
            border: '1px solid rgba(255,255,255,.25)', color: 'rgba(255,255,255,.7)',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
          }}
        >
          Mehr erfahren
        </a>
      </div>
    </div>
  )
}
