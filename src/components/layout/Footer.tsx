import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ background: 'var(--black)', color: 'rgba(255,255,255,.65)' }}>
      <style>{`
        .footer-link { transition: color .15s; }
        .footer-link:hover { color: white !important; }
        .footer-a { transition: color .15s; }
        .footer-a:hover { color: white !important; }
      `}</style>

      {/* Main */}
      <div style={{ padding: '64px 80px 48px', display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1.3fr', gap: 48 }}>
        {/* Brand */}
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: 3.5, color: 'white', marginBottom: 3 }}>PRO.DI.GIO</div>
          <div style={{ fontSize: 9, letterSpacing: 3, color: 'rgba(255,255,255,.3)', marginBottom: 18 }}>GMBH · GROSSHANDEL · BASEL</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.75, opacity: .62, maxWidth: 300 }}>
            Ihr Partner für innovative Trendprodukte. Direktimport aus aller Welt —
            Logistik & Grosshandel Basel seit 2015.
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
              ['🧋 Bubble Tea', '/products?category=bubble-tea'],
              ['🍵 TEABALLS', '/products?category=teaballs'],
              ['🌿 TEABALLS Bio', '/products?category=teaballs-glasflaschen-bio'],
              ['🍶 Glasflaschen', '/products?category=teaballs-glasflaschen'],
              ['🫙 Vorratsgläser', '/products?category=teaballs-vorratsglas-100g'],
              ['🍫 Patislove', '/products?category=patislove'],
              ['☁️ The Mallows', '/products?category=the-mallows'],
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
              { icon: '🏢', text: 'PRO.DI.GIO GmbH' },
              { icon: '📍', text: 'Mailand-Strasse 31, 4053 Basel' },
              { icon: '✉️', text: 'contact@prodigio.ch', href: 'mailto:contact@prodigio.ch' },
            ].map(({ icon, text, href }) => (
              <li key={text} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: 'rgba(255,255,255,.65)' }}>
                <span style={{ flexShrink: 0, opacity: .6 }}>{icon}</span>
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

      {/* Bottom Bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', padding: '20px 80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 12.5, opacity: .4 }}>© {new Date().getFullYear()} PRO.DI.GIO GmbH · Alle Rechte vorbehalten</span>
        <div style={{ display: 'flex', gap: 20, fontSize: 12.5, opacity: .4 }}>
          <Link href="/agb" style={{ color: 'inherit' }}>AGB</Link>
          <Link href="/datenschutz" style={{ color: 'inherit' }}>Datenschutz</Link>
          <Link href="/impressum" style={{ color: 'inherit' }}>Impressum</Link>
        </div>
      </div>
    </footer>
  )
}
