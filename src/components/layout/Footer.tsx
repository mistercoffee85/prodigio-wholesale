import Link from 'next/link'

const IconBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
  </svg>
)
const IconPin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-7-6.686-7-11a7 7 0 1 1 14 0c0 4.314-7 11-7 11z"/><circle cx="12" cy="10" r="2"/>
  </svg>
)
const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
  </svg>
)
const IconPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

/* ── Payment logo SVGs ── */
const PayVisa = () => (
  <svg viewBox="0 0 48 30" width="48" height="30" role="img" aria-label="VISA">
    <rect width="48" height="30" rx="4" fill="#1A1F71"/>
    <text x="24" y="21" fontFamily="Arial,sans-serif" fontSize="14" fontWeight="700" fontStyle="italic" fill="white" textAnchor="middle" letterSpacing="1">VISA</text>
  </svg>
)
const PayMastercard = () => (
  <svg viewBox="0 0 48 30" width="48" height="30" role="img" aria-label="Mastercard">
    <rect width="48" height="30" rx="4" fill="#252525"/>
    <circle cx="18" cy="15" r="8" fill="#EB001B"/>
    <circle cx="30" cy="15" r="8" fill="#F79E1B"/>
    <path d="M24 8.5a8 8 0 0 1 0 13 8 8 0 0 1 0-13z" fill="#FF5F00"/>
  </svg>
)
const PayAmex = () => (
  <svg viewBox="0 0 48 30" width="48" height="30" role="img" aria-label="American Express">
    <rect width="48" height="30" rx="4" fill="#007BC1"/>
    <text x="24" y="20" fontFamily="Arial,sans-serif" fontSize="10" fontWeight="700" fill="white" textAnchor="middle" letterSpacing="0.5">AMERICAN</text>
    <text x="24" y="26" fontFamily="Arial,sans-serif" fontSize="7" fontWeight="600" fill="white" textAnchor="middle" letterSpacing="1">EXPRESS</text>
  </svg>
)
const PayApplePay = () => (
  <svg viewBox="0 0 48 30" width="48" height="30" role="img" aria-label="Apple Pay">
    <rect width="48" height="30" rx="4" fill="#000" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
    <text x="24" y="20" fontFamily="-apple-system,BlinkMacSystemFont,sans-serif" fontSize="11" fontWeight="500" fill="white" textAnchor="middle" letterSpacing="-0.3"> Pay</text>
    <path d="M15 10.5c.6-.7 1-1.6.9-2.5-.9.1-2 .6-2.6 1.3-.6.6-.9 1.5-.8 2.4.9 0 1.8-.5 2.5-1.2zM15.9 11.7c-1.4-.1-2.6.8-3.2.8-.7 0-1.7-.8-2.8-.7-1.4 0-2.7.8-3.4 2.1-1.5 2.5-.4 6.2 1 8.2.7 1 1.5 2 2.5 2 1 0 1.4-.6 2.6-.6 1.3 0 1.6.6 2.7.6 1.1 0 1.8-.9 2.5-1.9.8-1.1 1.1-2.2 1.1-2.3-.1 0-2.1-.8-2.1-3.1 0-1.9 1.6-2.8 1.6-2.9-.9-1.3-2.3-1.4-2.5-1.2z" fill="white"/>
  </svg>
)
const PayGooglePay = () => (
  <svg viewBox="0 0 48 30" width="48" height="30" role="img" aria-label="Google Pay">
    <rect width="48" height="30" rx="4" fill="white" stroke="rgba(0,0,0,0.12)" strokeWidth="1"/>
    <text x="13" y="20" fontFamily="Arial,sans-serif" fontSize="13" fontWeight="700" fill="#4285F4" textAnchor="middle">G</text>
    <text x="32" y="20" fontFamily="Arial,sans-serif" fontSize="11" fontWeight="500" fill="#3C4043" textAnchor="middle">Pay</text>
  </svg>
)
const PayPayPal = () => (
  <svg viewBox="0 0 48 30" width="48" height="30" role="img" aria-label="PayPal">
    <rect width="48" height="30" rx="4" fill="#003087"/>
    <text x="24" y="20" fontFamily="Arial,sans-serif" fontSize="11" fontWeight="700" fill="#009cde" textAnchor="middle">Pay</text>
    <text x="24" y="20" fontFamily="Arial,sans-serif" fontSize="11" fontWeight="700" fill="white" textAnchor="middle" dx="11">Pal</text>
  </svg>
)
const PayTwint = () => (
  <svg viewBox="0 0 48 30" width="48" height="30" role="img" aria-label="TWINT">
    <rect width="48" height="30" rx="4" fill="#000"/>
    <text x="24" y="20" fontFamily="Arial,sans-serif" fontSize="12" fontWeight="900" fill="#FF0069" textAnchor="middle" letterSpacing="-0.5">TWINT</text>
  </svg>
)
const PayKlarna = () => (
  <svg viewBox="0 0 48 30" width="48" height="30" role="img" aria-label="Klarna">
    <rect width="48" height="30" rx="4" fill="#FFB3C7"/>
    <text x="24" y="20" fontFamily="Arial,sans-serif" fontSize="11" fontWeight="700" fill="#0A0B09" textAnchor="middle">Klarna</text>
  </svg>
)
const PayVorauskasse = () => (
  <svg viewBox="0 0 48 30" width="48" height="30" role="img" aria-label="Vorauskasse">
    <rect width="48" height="30" rx="4" fill="transparent" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
    <path d="M12 20v-7M36 20v-7M9 13h30M14 13v-2a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" strokeLinecap="round"/>
    <text x="24" y="27" fontFamily="Arial,sans-serif" fontSize="6.5" fontWeight="600" fill="rgba(255,255,255,0.45)" textAnchor="middle" letterSpacing="0.3">VORAUSKASSE</text>
  </svg>
)

export default function Footer() {
  return (
    <footer style={{ background: 'var(--black)', color: 'rgba(255,255,255,.65)' }}>
      <style>{`
        .footer-link { transition: color .15s; display: inline-block; }
        .footer-link:hover { color: white !important; }
        @media (max-width: 900px) {
          .footer-link { padding: 7px 0; }
          .footer-a { display: inline-block; padding: 5px 0; }
          .footer-bottom-links a { display: inline-block; padding: 6px 0; }
        }
        .footer-a { transition: color .15s; }
        .footer-a:hover { color: white !important; }
        .footer-main {
          padding: 64px 80px 48px;
          display: grid;
          grid-template-columns: 2.2fr 1fr 1fr 1.3fr;
          gap: 48px;
        }
        .footer-payment-bar {
          border-top: 1px solid rgba(255,255,255,.08);
          padding: 16px 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .footer-bottom-bar {
          border-top: 1px solid rgba(255,255,255,.06);
          padding: 18px 80px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        @media (max-width: 1024px) {
          .footer-main { grid-template-columns: 1fr 1fr; padding: 48px 40px 40px; gap: 32px; }
          .footer-payment-bar { padding: 16px 40px; }
          .footer-bottom-bar  { padding: 18px 40px; }
        }
        @media (max-width: 640px) {
          .footer-main { grid-template-columns: 1fr; padding: 40px 20px 32px; gap: 32px; }
          .footer-payment-bar { padding: 16px 20px; flex-direction: column; align-items: flex-start; }
          .footer-bottom-bar  { padding: 16px 20px; flex-direction: column; align-items: flex-start; gap: 8px; }
          .footer-bottom-links { flex-wrap: wrap; gap: 12px !important; }
        }
      `}</style>

      {/* Main */}
      <div className="footer-main">
        {/* Brand */}
        <div>
          <img src="/logos/logo-dark.png" alt="PRO.DI.GIO" style={{ height: 36, width: 'auto', display: 'block', filter: 'brightness(0) invert(1)', marginBottom: 18 }} />
          <p style={{ fontSize: 13.5, lineHeight: 1.75, opacity: .62, maxWidth: 300 }}>
            Ihr Partner für innovative Trendprodukte. Direktimport aus aller Welt —
            Logistik & Grosshandel Basel seit 2013.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 24 }}>
            {['B2B Grosshandel', 'CH-Unternehmen', 'Direktimport'].map(tag => (
              <span key={tag} style={{
                fontSize: 11, padding: '4px 12px', borderRadius: 20,
                border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.45)', fontWeight: 500,
              }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Products */}
        <div>
          <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'white', marginBottom: 20 }}>Produkte</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Bubble Tea', '/products?category=bubble-tea'],
              ['TEABALLS', '/products?category=teaballs'],
              ['TEABALLS Bio', '/products?category=teaballs-glasflaschen-bio'],
              ['Glasflaschen', '/products?category=teaballs-glasflaschen'],
              ['Vorratsgläser', '/products?category=teaballs-vorratsglas-100g'],
              ['Tea-Packs', '/products?category=teaballs-tea-packs'],
              ['Patislove', '/products?category=patislove'],
              ['The Mallows', '/products?category=the-mallows'],
              ['Neuheiten', '/products?badge=new'],
              ['Bestseller', '/products?badge=hot'],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="footer-link" style={{ fontSize: 13.5, color: 'rgba(255,255,255,.65)', textDecoration: 'none' }}>{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* B2B */}
        <div>
          <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'white', marginBottom: 20 }}>B2B Service</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Konto eröffnen', '/register'],
              ['Anmelden', '/login'],
              ['Meine Bestellungen', '/dashboard'],
              ['AGB', '/agb'],
              ['Datenschutz', '/datenschutz'],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="footer-link" style={{ fontSize: 13.5, color: 'rgba(255,255,255,.65)', textDecoration: 'none' }}>{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'white', marginBottom: 20 }}>Kontakt</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: <IconBuilding />, text: 'PRO.DI.GIO GmbH' },
              { icon: <IconPin />,      text: 'Mailand-Strasse 31, 4053 Basel' },
              { icon: <IconMail />,     text: 'contact@prodigio.ch', href: 'mailto:contact@prodigio.ch' },
              { icon: <IconPhone />,    text: '+41 61 868 95 33',    href: 'tel:+41618689533' },
            ].map(({ icon, text, href }) => (
              <li key={text} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: 'rgba(255,255,255,.65)', alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, opacity: .55, marginTop: 1 }}>{icon}</span>
                {href
                  ? <a href={href} className="footer-a" style={{ color: 'rgba(255,255,255,.65)', textDecoration: 'none' }}>{text}</a>
                  : <span>{text}</span>}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(255,255,255,.05)', borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,.08)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.35)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Öffnungszeiten</div>
            <div style={{ fontSize: 13 }}>Mo–Fr: 08:00–17:00 Uhr</div>
          </div>
        </div>
      </div>

      {/* Payment Methods Bar */}
      <div className="footer-payment-bar">
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,.25)' }}>
          Zahlungsarten
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <PayVisa />
          <PayMastercard />
          <PayAmex />
          <PayApplePay />
          <PayGooglePay />
          <PayPayPal />
          <PayTwint />
          <PayKlarna />
          <PayVorauskasse />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom-bar">
        <span style={{ fontSize: 12.5, opacity: .4 }}>© {new Date().getFullYear()} PRO.DI.GIO GmbH · Alle Rechte vorbehalten</span>
        <div className="footer-bottom-links" style={{ display: 'flex', gap: 20, fontSize: 12.5, opacity: .4 }}>
          <Link href="/agb" style={{ color: 'inherit' }}>AGB</Link>
          <Link href="/datenschutz" style={{ color: 'inherit' }}>Datenschutz</Link>
          <Link href="/impressum" style={{ color: 'inherit' }}>Impressum</Link>
        </div>
      </div>
    </footer>
  )
}
