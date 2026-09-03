import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const revalidate = 0

const BRANDS = [
  {
    name: 'My Bubble Tea', sub: 'Sets, Perlen & Zubehör',
    href: '/products?category=bubble-tea',
    color: '#0c1f3a',
    accent: '#7eb8f7',
    img: 'https://cdn.shopify.com/s/files/1/0769/8520/5054/files/9690ED77-8273-4F9F-B137-9A7A55D5A6B7.jpg?v=1736538559',
  },
  {
    name: 'TEABALLS', sub: 'Die Teenovation',
    href: '/products?category=teaballs',
    color: '#0e1f0e',
    accent: '#a8e6a3',
    img: 'https://cdn.shopify.com/s/files/1/0368/6150/9769/files/TEABALLS_Hibiskus_Flasche.png?v=1762428964',
  },
  {
    name: 'Patislove', sub: 'Pistazien-Spezialitäten',
    href: '/products?category=patislove',
    color: '#1e0f00',
    accent: '#f7bc7e',
    img: 'https://cdn.shopify.com/s/files/1/0763/2302/9259/files/Untitleddesign_49.webp?v=1759780663',
  },
  {
    name: 'The Mallows', sub: 'Gourmet Marshmallows',
    href: '/products?category=the-mallows',
    color: '#1a0c1a',
    accent: '#e8a0e8',
    img: 'https://cdn.shopify.com/s/files/1/0763/2302/9259/files/43f6ead8336003ff8d56a822586ec842d1058f18327592c95d20214258a85e9b.jpg?v=1765704974',
  },
  {
    name: 'BobaJoy', sub: 'Ready to Drink Bubble Tea',
    href: '/products?category=bubble-tea-rtd',
    color: '#0d2b22',
    accent: '#5cf5cc',
    img: 'https://cdn.shopify.com/s/files/1/0769/8520/5054/files/BobaTeaDrinkGreenApple_Photomountage_1080x1080_copy.png?v=1752934721',
  },
]


// ── Default CMS values (used when no DB override is set) ──────────────────
const CMS_DEFAULTS = {
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
  homepage_trust_bar: JSON.stringify([
    { icon: '🚚', main: 'Schnelle Lieferung',       sub: '2–4 Werktage · Schweizweit' },
    { icon: '🏭', main: 'Direktimport',              sub: 'Beste Konditionen schweizweit' },
    { icon: '✅', main: 'Kein Zwischenhandel',       sub: 'Direkt vom Importeur' },
    { icon: '📦', main: 'Flexible Mindestmengen',   sub: 'Ab 6 Verkaufseinheiten' },
    { icon: '🇨🇭', main: 'Schweizer Unternehmen',  sub: 'Prodigio GmbH seit 2013' },
  ]),
}

export default async function HomePage() {
  const session  = await getServerSession(authOptions)
  const approved = session?.user?.status === 'APPROVED'

  const [featuredProducts, newProducts, productCount, cmsSettings] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, badge: 'hot' },
      include: { category: true },
      take: 4,
    }),
    prisma.product.findMany({
      where: { active: true, badge: 'new' },
      include: { category: true },
      take: 4,
    }),
    prisma.product.count({ where: { active: true } }),
    prisma.setting.findMany({ where: { key: { startsWith: 'homepage_' } } }),
  ])

  const allFeatured = [...featuredProducts, ...newProducts].slice(0, 8)

  // Merge DB settings over defaults
  const cmsMap: Record<string, string> = { ...CMS_DEFAULTS }
  for (const s of cmsSettings) cmsMap[s.key] = s.value

  const announcement  = cmsMap.homepage_announcement
  const announcementActive = cmsMap.homepage_announcement_active === 'true'


  let trustBar: { icon: string; main: string; sub: string }[] = []
  try { trustBar = JSON.parse(cmsMap.homepage_trust_bar) } catch { /* keep empty */ }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* ── TRUST BAR ── */
        .trust-bar {
          background: white; border-bottom: 1px solid var(--gray-100);
          padding: 0 clamp(20px,5vw,80px);
          display: flex; align-items: center; gap: 0;
          overflow-x: auto; -webkit-overflow-scrolling: touch;
        }
        .trust-item {
          display: flex; align-items: center; gap: 12px;
          padding: 22px 32px; flex-shrink: 0;
          border-right: 1px solid var(--gray-100);
          color: var(--gray-600);
        }
        .trust-item:last-child { border-right: none; }
        .trust-icon { font-size: 20px; flex-shrink: 0; }
        .trust-text-main { font-size: 13px; font-weight: 700; color: var(--black); }
        .trust-text-sub { font-size: 11.5px; color: var(--gray-400); margin-top: 1px; }

        /* ── SECTION HEADERS ── */
        .sec-label {
          font-size: 11px; font-weight: 700; letter-spacing: 2.5px;
          text-transform: uppercase; color: var(--accent); margin-bottom: 12px;
        }
        .sec-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(28px,3.5vw,44px); font-weight: 700;
          letter-spacing: -0.035em; line-height: 1.1;
        }

        /* ── BRANDS ── */
        .brands-section { padding: clamp(56px,7vw,88px) clamp(20px,5vw,80px); }
        .brands-grid {
          display: grid; grid-template-columns: repeat(5,1fr); gap: 16px;
          margin-top: clamp(32px,4vw,48px);
        }
        .brand-tile {
          border-radius: 20px; overflow: hidden; position: relative;
          min-height: 280px; display: flex; flex-direction: column;
          justify-content: flex-end; text-decoration: none;
          transition: transform .25s, box-shadow .25s;
          box-shadow: 0 4px 20px rgba(0,0,0,.12);
        }
        .brand-tile:hover { transform: translateY(-6px); box-shadow: 0 20px 48px rgba(0,0,0,.22); }
        .brand-tile-img {
          position: absolute; inset: 0;
          transition: transform .35s;
        }
        .brand-tile:hover .brand-tile-img { transform: scale(1.05); }
        .brand-tile-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.2) 50%, transparent 100%);
        }
        .brand-tile-info { position: relative; z-index: 2; padding: 20px 18px; }
        .brand-tile-name { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 700; color: white; }
        .brand-tile-sub { font-size: 11.5px; color: rgba(255,255,255,.6); margin-top: 4px; }
        .brand-tile-arrow {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(255,255,255,.15); color: white; font-size: 12px;
          margin-top: 10px; transition: background .2s;
        }
        .brand-tile:hover .brand-tile-arrow { background: var(--accent); }

        /* ── FEATURED ── */
        .featured-section { padding: clamp(56px,7vw,88px) clamp(20px,5vw,80px); background: var(--cream); }
        .featured-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; margin-top: clamp(28px,4vw,44px); }
        .feat-card {
          background: white; border-radius: 16px; overflow: hidden;
          border: 1px solid var(--gray-100); box-shadow: var(--shadow-xs);
          transition: transform .22s, box-shadow .22s; display: block; text-decoration: none; color: inherit;
        }
        .feat-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
        .feat-img { height: 200px; position: relative; overflow: hidden; }
        .feat-body { padding: 16px 18px 20px; }
        .feat-brand { font-size: 10px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; color: var(--accent); margin-bottom: 6px; }
        .feat-name { font-size: 14px; font-weight: 600; color: var(--black); line-height: 1.35; margin-bottom: 4px; }
        .feat-unit { font-size: 12px; color: var(--gray-400); margin-bottom: 14px; }
        .feat-price { font-family: 'Space Grotesk', sans-serif; font-size: 21px; font-weight: 700; color: var(--black); }
        .feat-moq { font-size: 11px; color: var(--gray-400); background: var(--gray-50); padding: 3px 10px; border-radius: 20px; font-weight: 500; border: 1px solid var(--gray-100); }

        /* ── STEPS ── */
        .steps-section {
          padding: clamp(56px,7vw,88px) clamp(20px,5vw,80px);
          background: white;
        }
        .steps-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 0; margin-top: clamp(36px,4vw,52px); }
        .step-item { padding: 0 28px; position: relative; }
        .step-item:not(:last-child)::after {
          content: ''; position: absolute; top: 27px; right: -1px;
          width: 2px; height: 28px; background: var(--gray-100);
        }
        .step-num {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 2px; color: var(--accent);
          text-transform: uppercase; margin-bottom: 16px;
        }
        .step-icon {
          width: 56px; height: 56px; border-radius: 16px; background: var(--accent-pale);
          display: flex; align-items: center; justify-content: center; font-size: 24px;
          margin-bottom: 20px; border: 1px solid var(--accent-light);
        }
        .step-title { font-family: 'Space Grotesk', sans-serif; font-size: 17px; font-weight: 700; color: var(--black); margin-bottom: 10px; letter-spacing: -0.02em; }
        .step-desc { font-size: 13.5px; color: var(--gray-400); line-height: 1.75; }

        /* ── CTA ── */
        .cta-section {
          padding: clamp(56px,7vw,96px) clamp(20px,5vw,80px);
          background: linear-gradient(135deg, var(--accent-pale) 0%, #ffffff 60%);
          border-top: 1px solid var(--gray-100);
          text-align: center;
        }
        .cta-btns {
          display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1100px) {
          .brands-grid { grid-template-columns: repeat(3,1fr); }
          .featured-grid { grid-template-columns: repeat(3,1fr); }
        }
        @media (max-width: 768px) {
          .brands-grid { grid-template-columns: repeat(2,1fr); gap: 12px; }
          .featured-grid { grid-template-columns: repeat(2,1fr); gap: 14px; }
          .steps-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
          .step-item::after { display: none; }
          .trust-bar { flex-direction: column; align-items: stretch; overflow-x: visible; padding: 0; }
          .trust-item { border-right: none; border-bottom: 1px solid var(--gray-100); padding: 14px 20px; width: 100%; box-sizing: border-box; }
          .trust-item:last-child { border-bottom: none; }
        }
        @media (max-width: 540px) {
          .brands-grid { grid-template-columns: 1fr 1fr; }
          .featured-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .steps-grid { grid-template-columns: 1fr; gap: 24px; }
          .step-item { padding: 0 12px; }
          .brand-tile { min-height: 220px; }
          .feat-img { height: 160px; }
        }
        @media (max-width: 400px) {
          .brand-tile { min-height: 180px; }
          .cta-btns { flex-direction: column; align-items: stretch; }
          .cta-btns a { text-align: center; justify-content: center; width: 100%; box-sizing: border-box; }
        }
      ` }} />

      <Header />
      <main>

        {/* ══ ANKÜNDIGUNG ══════════════════════════════════════════════ */}
        {announcementActive && announcement && (
          <div style={{
            background: 'linear-gradient(90deg, #10b981, #059669)',
            color: '#fff', textAlign: 'center',
            padding: '10px 20px', fontSize: 14, fontWeight: 600,
          }}>
            {announcement}
          </div>
        )}

        {/* ══ HERO ══════════════════════════════════════════════════════ */}
        <Link href="/products" style={{ display:'block', lineHeight:0 }}>
          {/* Art-directed: the 16:9 banner puts copy beside the products, which becomes
              unreadable on a narrow screen — below 768px swap to the square crop that
              stacks copy above them. <picture> downloads only the matching source. */}
          <picture>
            <source
              media="(max-width: 768px)"
              srcSet="/hero-banner-mobile.webp"
              width={1080}
              height={1440}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-banner.webp"
              alt="PRO.DI.GIO B2B Grosshandel Schweiz – Sortiment entdecken"
              width={1920}
              height={1080}
              style={{ width:'100%', height:'auto', display:'block' }}
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </Link>

        {/* ══ TRUST BAR ════════════════════════════════════════════════ */}
        <div className="trust-bar">
          {trustBar.map(({ icon, main, sub }) => (
            <div key={main} className="trust-item">
              <span className="trust-icon">{icon}</span>
              <div>
                <div className="trust-text-main">{main}</div>
                <div className="trust-text-sub">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ══ MARKEN ═══════════════════════════════════════════════════ */}
        <section className="brands-section">
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div>
              <div className="sec-label">Unsere Marken</div>
              <h2 className="sec-title">
                Starke Marken.<br />
                <span style={{ color:'var(--accent)' }}>Exklusive Preise.</span>
              </h2>
            </div>
            <Link href="/products" style={{ fontSize:14, fontWeight:600, color:'var(--accent)', display:'flex', alignItems:'center', gap:6 }}>
              Alle Produkte ansehen →
            </Link>
          </div>

          <div className="brands-grid">
            {BRANDS.map(brand => (
              <Link key={brand.name} href={brand.href} className="brand-tile"
                style={{ background: brand.color }}>
                <div className="brand-tile-img">
                  <Image src={brand.img} alt={brand.name} fill
                    sizes="(max-width:768px) 50vw, 20vw"
                    style={{ objectFit:'contain', padding:24 }}
                  />
                </div>
                <div className="brand-tile-overlay" />
                <div className="brand-tile-info">
                  <div className="brand-tile-name">{brand.name}</div>
                  <div className="brand-tile-sub">{brand.sub}</div>
                  <div className="brand-tile-arrow">→</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ══ FEATURED PRODUCTS ════════════════════════════════════════ */}
        {allFeatured.length > 0 && (
          <section className="featured-section">
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
              <div>
                <div className="sec-label">Top Picks</div>
                <h2 className="sec-title">
                  Bestseller &{' '}
                  <span style={{ color:'var(--accent)' }}>Neuheiten</span>
                </h2>
              </div>
              <Link href="/products" style={{ fontSize:14, fontWeight:600, color:'var(--accent)', display:'flex', alignItems:'center', gap:6 }}>
                Alle {productCount} Produkte →
              </Link>
            </div>

            <div className="featured-grid">
              {allFeatured.map(p => {
                const firstImage = (p.images as string[])?.[0]
                return (
                  <Link key={p.id} href={`/products?category=${p.category.slug}`} className="feat-card">
                    <div className="feat-img" style={{
                      background: (p.bgGradient as string|null) ?? 'linear-gradient(135deg,#f0f0ee,#e8e8e6)',
                    }}>
                      {firstImage ? (
                        <Image src={firstImage} alt={p.name} fill
                          sizes="(max-width:768px) 50vw, 320px"
                          style={{ objectFit:'contain', padding:20 }}
                        />
                      ) : (
                        <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:60 }}>{p.emoji}</span>
                      )}
                      {p.badge && (
                        <span style={{
                          position:'absolute', top:12, left:12, zIndex:2,
                          fontSize:10.5, fontWeight:700, padding:'4px 12px', borderRadius:20,
                          background: p.badge === 'hot' ? '#e85c2a' : 'var(--accent)',
                          color:'white', boxShadow:'0 2px 8px rgba(0,0,0,.2)',
                        }}>
                          {p.badge === 'hot' ? '🔥 Bestseller' : '✨ Neu'}
                        </span>
                      )}
                    </div>
                    <div className="feat-body">
                      <div className="feat-brand">{p.brand}</div>
                      <div className="feat-name">{p.name}</div>
                      <div className="feat-unit">{p.unit}</div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        {approved ? (
                          <span className="feat-price">{formatPrice(Number(p.price))}</span>
                        ) : (
                          <span style={{ fontSize:13, fontWeight:700, color:'var(--gray-400)', letterSpacing:1 }}>🔒 Preis auf Anfrage</span>
                        )}
                        <span className="feat-moq">ab {p.moq} VE</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ══ SO FUNKTIONIERT&apos;S ══════════════════════════════════════ */}
        <section className="steps-section">
          <div style={{ textAlign:'center' }}>
            <div className="sec-label">So einfach geht&apos;s</div>
            <h2 className="sec-title">In 4 Schritten zum Grosshandel</h2>
          </div>

          <div className="steps-grid">
            {[
              { n:'01', icon:'📋', title:'Konto eröffnen',     desc:'Registrieren Sie sich mit Ihren Unternehmensdaten. Dauert nur 2 Minuten.' },
              { n:'02', icon:'✅', title:'Freigabe erhalten',  desc:'Unser Team prüft Ihr Konto und schaltet es innerhalb eines Werktags frei.' },
              { n:'03', icon:'🛒', title:'Produkte wählen',    desc:'Bestellen Sie aus unserem Sortiment zu exklusiven Grosshandelspreisen.' },
              { n:'04', icon:'🚚', title:'Lieferung erhalten', desc:'Lieferung in 2–4 Werktagen direkt an Ihre Geschäftsadresse in der Schweiz.' },
            ].map(({ n, icon, title, desc }) => (
              <div key={n} className="step-item">
                <div className="step-num">Schritt {n}</div>
                <div className="step-icon">{icon}</div>
                <div className="step-title">{title}</div>
                <p className="step-desc">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ CTA ══════════════════════════════════════════════════════ */}
        <section className="cta-section">
          <div className="sec-label" style={{ marginBottom:16 }}>Jetzt starten</div>
          <h2 style={{
            fontFamily:"'Space Grotesk', sans-serif",
            fontSize:'clamp(28px,4vw,50px)', fontWeight:700,
            letterSpacing:'-0.04em', color:'var(--black)',
            marginBottom:18, lineHeight:1.08,
          }}>
            Bereit für exklusive<br />B2B-Konditionen?
          </h2>
          <p style={{ fontSize:16.5, color:'var(--gray-600)', maxWidth:480, margin:'0 auto 40px', lineHeight:1.8 }}>
            Registrieren Sie sich kostenlos und erhalten Sie nach Freigabe Zugang
            zu Grosshandelspreisen, Neuheiten und persönlichem Support.
          </p>
          <div className="cta-btns">
            <Link href="/register" style={{
              display:'inline-flex', alignItems:'center', gap:9,
              background:'var(--black)', color:'white',
              padding:'16px 36px', borderRadius:14,
              fontSize:15.5, fontWeight:700,
              boxShadow:'0 8px 28px rgba(0,0,0,.2)',
              transition:'transform .2s, box-shadow .2s',
            }}>
              Kostenlos registrieren →
            </Link>
            <a href="mailto:contact@prodigio.ch" style={{
              display:'inline-flex', alignItems:'center', gap:9,
              border:'1.5px solid var(--gray-200)', color:'var(--black)',
              padding:'15px 32px', borderRadius:14,
              fontSize:15.5, fontWeight:600, background:'white',
              boxShadow:'var(--shadow-xs)',
              transition:'border-color .2s',
            }}>
              ✉ Kontakt aufnehmen
            </a>
          </div>
          <div style={{ display:'flex', gap:24, justifyContent:'center', marginTop:36, flexWrap:'wrap' }}>
            {['✓ Keine Mindestbestellung', '✓ Freigabe innert 1 Werktag', '✓ Persönlicher Support'].map(t => (
              <span key={t} style={{ fontSize:13, color:'var(--gray-400)', fontWeight:500 }}>{t}</span>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
