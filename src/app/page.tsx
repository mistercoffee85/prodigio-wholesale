import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'

export const revalidate = 60

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

// Hero mosaic: 4 images picked for visual variety and impact
const HERO_MOSAIC = [
  { // Top full-width — Bubble Tea Set lifestyle photo
    img: 'https://cdn.shopify.com/s/files/1/0769/8520/5054/files/9690ED77-8273-4F9F-B137-9A7A55D5A6B7.jpg?v=1736538559',
    bg: '#0c1f3a', label: 'My Bubble Tea',
  },
  { // Bottom left — TEABALLS Himbeere clean bottle
    img: 'https://cdn.shopify.com/s/files/1/0368/6150/9769/files/TEABALLS_Himbeere_Flasche.png?v=1762429748',
    bg: '#1a0312', label: 'TEABALLS',
  },
  { // Bottom center — Patislove Pistachio Milk Choc Bar
    img: 'https://cdn.shopify.com/s/files/1/0763/2302/9259/files/Untitleddesign_49.webp?v=1759780663',
    bg: '#1e0f00', label: 'Patislove',
  },
  { // Bottom right — The Mallows Raspberry Hearts
    img: 'https://cdn.shopify.com/s/files/1/0763/2302/9259/files/43f6ead8336003ff8d56a822586ec842d1058f18327592c95d20214258a85e9b.jpg?v=1765704974',
    bg: '#1a0c1a', label: 'The Mallows',
  },
]

export default async function HomePage() {
  const [featuredProducts, newProducts, productCount] = await Promise.all([
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
  ])

  const allFeatured = [...featuredProducts, ...newProducts].slice(0, 8)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* ── HERO ── */
        .hero {
          background: var(--forest);
          position: relative; overflow: hidden;
          min-height: 680px; display: flex; align-items: center;
        }
        .hero-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 0; width: 100%; min-height: 680px;
        }
        .hero-left {
          padding: clamp(60px,7vw,100px) clamp(32px,5vw,80px);
          display: flex; flex-direction: column; justify-content: center;
          position: relative; z-index: 2;
        }
        .hero-right {
          position: relative; overflow: hidden;
          display: grid; grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr; gap: 3px;
        }
        .hero-right-img {
          position: relative; overflow: hidden;
          background: rgba(255,255,255,.04);
        }
        .hero-right-img:first-child { grid-column: span 2; min-height: 260px; }
        .hero-tag {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(22,163,122,.15); border: 1px solid rgba(22,163,122,.35);
          color: #5cf5cc; font-size: 10.5px; font-weight: 700;
          letter-spacing: 2.5px; text-transform: uppercase;
          padding: 7px 18px; border-radius: 100px; margin-bottom: 32px;
          width: fit-content;
        }
        .hero-h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(38px,4.8vw,64px); font-weight: 700;
          line-height: 1.04; letter-spacing: -0.04em; color: white;
          margin-bottom: 24px;
        }
        .hero-p {
          font-size: clamp(15px,1.5vw,17px); color: rgba(255,255,255,.6);
          line-height: 1.8; max-width: 460px; margin-bottom: 40px;
        }
        .hero-btns { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 56px; }
        .hero-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--accent); color: white;
          padding: 15px 32px; border-radius: 12px;
          font-size: 15px; font-weight: 700;
          box-shadow: 0 8px 28px rgba(22,163,122,.4);
          transition: transform .2s, box-shadow .2s;
          white-space: nowrap;
        }
        .hero-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(22,163,122,.5); }
        .hero-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          border: 1.5px solid rgba(255,255,255,.2); color: rgba(255,255,255,.8);
          padding: 14px 28px; border-radius: 12px;
          font-size: 15px; font-weight: 600;
          background: rgba(255,255,255,.05);
          transition: border-color .2s, background .2s;
          white-space: nowrap;
        }
        .hero-btn-ghost:hover { border-color: rgba(255,255,255,.5); background: rgba(255,255,255,.1); }
        .hero-stats { display: flex; gap: 0; flex-wrap: wrap; }
        .hero-stat-item { padding: 0 28px; border-right: 1px solid rgba(255,255,255,.1); }
        .hero-stat-item:first-child { padding-left: 0; }
        .hero-stat-item:last-child { border-right: none; }
        .hero-stat-num {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 30px; font-weight: 700; color: white; line-height: 1;
          letter-spacing: -0.05em;
        }
        .hero-stat-label { font-size: 12px; color: rgba(255,255,255,.45); margin-top: 6px; }

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

        /* ── RESPONSIVE ── */
        @media (max-width: 1100px) {
          .brands-grid { grid-template-columns: repeat(3,1fr); }
          .featured-grid { grid-template-columns: repeat(3,1fr); }
          .hero-grid { grid-template-columns: 1fr; }
          .hero-right { display: none; }
          .hero-left { padding: clamp(60px,7vw,88px) clamp(20px,5vw,60px); }
        }
        @media (max-width: 768px) {
          .brands-grid { grid-template-columns: repeat(2,1fr); gap: 12px; }
          .featured-grid { grid-template-columns: repeat(2,1fr); gap: 14px; }
          .steps-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
          .step-item::after { display: none; }
          .hero-stat-item { padding: 0 16px; }
          .trust-bar { gap: 0; }
          .trust-item { padding: 18px 20px; }
        }
        @media (max-width: 540px) {
          .brands-grid { grid-template-columns: 1fr 1fr; }
          .featured-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .steps-grid { grid-template-columns: 1fr; gap: 24px; }
          .brand-tile { min-height: 220px; }
        }
      ` }} />

      <Header />
      <main>

        {/* ══ HERO ══════════════════════════════════════════════════════ */}
        <section className="hero">
          {/* Ambient glow */}
          <div style={{ position:'absolute', top:'-10%', left:'40%', width:600, height:600,
            background:'radial-gradient(circle, rgba(22,163,122,.12) 0%, transparent 65%)',
            pointerEvents:'none' }}/>
          <div style={{ position:'absolute', bottom:'-10%', left:'10%', width:400, height:400,
            background:'radial-gradient(circle, rgba(22,163,122,.07) 0%, transparent 65%)',
            pointerEvents:'none' }}/>

          <div className="hero-grid">
            {/* Left */}
            <div className="hero-left">
              <div className="hero-tag">
                <span style={{ width:7, height:7, borderRadius:'50%', background:'#5cf5cc',
                  display:'inline-block', animation:'pulse-dot 2s infinite' }}/>
                B2B Grosshandel · Schweiz
              </div>

              <h1 className="hero-h1">
                Trend-Produkte.<br />
                Direktimport.<br />
                <span style={{ color:'#5cf5cc' }}>Ihr Erfolg.</span>
              </h1>

              <p className="hero-p">
                Bubble Tea, TEABALLS und Gourmet-Spezialitäten direkt vom Importeur.
                Exklusive B2B-Preise für Wiederverkäufer und Gastronomie in der Schweiz — seit 2015.
              </p>

              <div className="hero-btns">
                <Link href="/products" className="hero-btn-primary">
                  Sortiment entdecken →
                </Link>
                <Link href="/register" className="hero-btn-ghost">
                  B2B-Konto eröffnen
                </Link>
              </div>

              <div className="hero-stats">
                {[
                  { num: '500+', label: 'B2B-Kunden' },
                  { num: productCount.toString(), label: 'Produkte' },
                  { num: '5', label: 'Marken' },
                  { num: '2–4', label: 'Werktage' },
                ].map(({ num, label }) => (
                  <div key={label} className="hero-stat-item">
                    <div className="hero-stat-num">{num}</div>
                    <div className="hero-stat-label">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Image Mosaic */}
            <div className="hero-right">
              {HERO_MOSAIC.map((item, i) => (
                <div key={item.label} className="hero-right-img"
                  style={{ background: item.bg }}>
                  <Image
                    src={item.img} alt={item.label} fill
                    sizes="(max-width:1100px) 0px, 33vw"
                    style={{ objectFit: i === 0 ? 'cover' : 'contain', padding: i === 0 ? 0 : 20, transition:'transform .4s' }}
                    priority={i === 0}
                  />
                  <div style={{
                    position:'absolute', bottom:12, left:12,
                    background:'rgba(0,0,0,.55)', backdropFilter:'blur(8px)',
                    border:'1px solid rgba(255,255,255,.1)',
                    borderRadius:8, padding:'6px 12px',
                  }}>
                    <span style={{ fontSize:11.5, fontWeight:700, color:'white', fontFamily:"'Space Grotesk',sans-serif" }}>{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ TRUST BAR ════════════════════════════════════════════════ */}
        <div className="trust-bar">
          {[
            { icon:'🚚', main:'Gratis Lieferung', sub:'Ab CHF 300 · DPD Tracking' },
            { icon:'🏭', main:'Direktimport Basel', sub:'Kein Zwischenhändler' },
            { icon:'💰', main:'Bis –20% Rabatt', sub:'VIP · PREMIUM · STANDARD' },
            { icon:'📦', main:'Flexible Mindestmengen', sub:'Ab 6 Verkaufseinheiten' },
            { icon:'🇨🇭', main:'Schweizer Unternehmen', sub:'Prodigio GmbH seit 2015' },
          ].map(({ icon, main, sub }) => (
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
                        <span className="feat-price">{formatPrice(Number(p.price))}</span>
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
              { n:'04', icon:'🚚', title:'Lieferung erhalten', desc:'DPD Tracking Lieferung in 2–4 Werktagen direkt an Ihre Geschäftsadresse.' },
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
            Registrieren Sie sich kostenlos und erhalten Sie sofortigen Zugang
            zu Grosshandelspreisen, Neuheiten und persönlichem Support.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
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
            <a href="mailto:wholesale@prodigio.ch" style={{
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
            {['✓ Keine Mindestbestellung', '✓ Sofort freischaltbar', '✓ Persönlicher Support'].map(t => (
              <span key={t} style={{ fontSize:13, color:'var(--gray-400)', fontWeight:500 }}>{t}</span>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
