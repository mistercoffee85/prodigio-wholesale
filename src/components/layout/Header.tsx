'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useCartStore } from '@/store/cart'
import CartSidebar from '@/components/shop/CartSidebar'
import { usePathname } from 'next/navigation'

type NavItem = { href: string; label: string; children?: { href: string; label: string }[] }

const NAV: NavItem[] = [
  { href: '/products', label: 'Alle Produkte' },
  {
    href: '/products?category=bubble-tea', label: '🧋 Bubble Tea',
    children: [
      { href: '/products?category=bubble-tea-rtd',               label: 'Ready to Drink' },
      { href: '/products?category=bubble-tea-sets',              label: 'Sets' },
      { href: '/products?category=bubble-tea-fruchtperlen-240g', label: 'Fruchtperlen 240g' },
      { href: '/products?category=bubble-tea-1-5kg',             label: 'Fruchtperlen 1.5kg' },
      { href: '/products?category=bubble-tea-tapioka',           label: 'Tapioka' },
      { href: '/products?category=bubble-tea-zubehoer',          label: 'Zubehör' },
    ],
  },
  {
    href: '/products?category=teaballs', label: '🍵 TEABALLS',
    children: [
      { href: '/products?category=teaballs-glasflaschen',      label: 'Glasflaschen' },
      { href: '/products?category=teaballs-glasflaschen-bio',  label: 'Glasflaschen Bio' },
      { href: '/products?category=teaballs-vorratsglas-100g',  label: 'Vorratsglas 100g' },
      { href: '/products?category=teaballs-vorratsglas-500g',  label: 'Vorratsglas 500g' },
    ],
  },
  {
    href: '/products?category=patislove', label: '🍫 Patislove',
    children: [
      { href: '/products?category=patislove-bars',    label: 'Bars' },
      { href: '/products?category=patislove-dragees', label: 'Dragées' },
      { href: '/products?category=patislove-cookies', label: 'Cookies' },
      { href: '/products?category=patislove-sticks',  label: 'Sticks' },
    ],
  },
  { href: '/products?category=the-mallows', label: '☁️ The Mallows' },
  { href: '/products?category=gastro-reinigung', label: '🧹 Gastro/Reinigung' },
  { href: '/products?category=cash-carry',       label: '🇮🇹 Cash & Carry' },
]

/* ── Desktop dropdown item ── */
function NavDropdown({ item, pathname }: { item: NavItem; pathname: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>()

  const base = item.href.split('?')[0]
  const isActive = item.href === '/products'
    ? pathname === '/products' && !pathname.includes('category')
    : pathname.startsWith(base)

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const linkStyle = {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '8px 12px', fontSize: 13.5, fontWeight: 500,
    borderRadius: 'var(--radius)', transition: 'all .15s', whiteSpace: 'nowrap' as const,
    color: isActive ? 'var(--accent)' : 'var(--gray-700)',
    background: isActive || open ? 'var(--accent-pale)' : 'transparent',
  }

  if (!item.children?.length) {
    return <Link href={item.href} style={linkStyle}>{item.label}</Link>
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}
      onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpen(true) }}
      onMouseLeave={() => { closeTimer.current = setTimeout(() => setOpen(false), 280) }}
    >
      <Link href={item.href} style={linkStyle}>
        {item.label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ opacity:.4, transform: open ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </Link>

      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, zIndex:400, paddingTop:6 }}>
          <div style={{
            background:'white', border:'1px solid var(--gray-100)',
            borderRadius:'var(--radius-lg)', boxShadow:'0 8px 32px rgba(0,0,0,.12)',
            minWidth:195, overflow:'hidden', padding:'6px 0',
          }}>
            {item.children.map(child => (
              <Link key={child.href} href={child.href} style={{
                display:'block', padding:'9px 16px',
                fontSize:13.5, color:'var(--gray-700)', whiteSpace:'nowrap',
                transition:'background .12s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--cream)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {child.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Mobile nav section (accordion) ── */
function MobileNavItem({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const [open, setOpen] = useState(false)

  if (!item.children?.length) {
    return (
      <Link href={item.href} onClick={onClose} style={{
        display:'block', padding:'14px 24px', fontSize:15, fontWeight:500,
        color:'var(--gray-700)', borderBottom:'1px solid var(--gray-100)',
      }}>
        {item.label}
      </Link>
    )
  }

  return (
    <div style={{ borderBottom:'1px solid var(--gray-100)' }}>
      <button onClick={() => setOpen(!open)} style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        width:'100%', padding:'14px 24px', fontSize:15, fontWeight:500,
        color:'var(--gray-700)', background:'none', border:'none', cursor:'pointer',
      }}>
        {item.label}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ opacity:.4, transform: open ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div style={{ background:'var(--cream)', borderTop:'1px solid var(--gray-100)' }}>
          <Link href={item.href} onClick={onClose} style={{
            display:'block', padding:'11px 32px', fontSize:14,
            fontWeight:600, color:'var(--accent)', borderBottom:'1px solid var(--gray-100)',
          }}>
            Alle {item.label.replace(/^[^\w]+/, '')} →
          </Link>
          {item.children.map(child => (
            <Link key={child.href} href={child.href} onClick={onClose} style={{
              display:'block', padding:'11px 32px', fontSize:14,
              color:'var(--gray-600)', borderBottom:'1px solid var(--gray-100)',
            }}>
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Hamburger icon ── */
function Hamburger({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width:42, height:42, display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:5,
      borderRadius:'var(--radius)', border:'1.5px solid var(--gray-200)',
      background:'transparent', cursor:'pointer', transition:'all .15s',
    }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          display:'block', width:20, height:2, borderRadius:2,
          background:'var(--gray-700)', transition:'all .25s',
          transform: open
            ? i === 0 ? 'rotate(45deg) translate(4px, 5px)'
            : i === 2 ? 'rotate(-45deg) translate(4px, -5px)'
            : 'scaleX(0)'
            : 'none',
          opacity: open && i === 1 ? 0 : 1,
        }}/>
      ))}
    </button>
  )
}

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const itemCount      = useCartStore(s => s.items.reduce((n, i) => n + i.quantity, 0))
  const cartOpen       = useCartStore(s => s.isOpen)
  const openSidebar    = useCartStore(s => s.openSidebar)
  const closeSidebar   = useCartStore(s => s.closeSidebar)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [scrolled,    setScrolled]    = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false) }, [pathname])

  // Prevent body scroll when mobile nav open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .header-topbar { display: flex; }
        .header-nav { display: flex; }
        .header-hamburger { display: none; }
        @media (max-width: 900px) {
          .header-topbar { display: none !important; }
          .header-nav     { display: none !important; }
          .header-hamburger { display: flex !important; }
        }
      ` }} />

      {/* Topbar */}
      <div className="header-topbar" style={{
        background:'var(--forest)', color:'rgba(255,255,255,.65)',
        fontSize:11.5, fontWeight:500, padding:'0 32px',
        height:'var(--topbar-h)', alignItems:'center',
        justifyContent:'space-between', letterSpacing:.2,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          {[
            ['✓','Gratis Lieferung ab CHF 300'],
            ['✓','Exklusive B2B-Preise'],
            ['✓','2–4 Werktage'],
          ].map(([icon, text]) => (
            <span key={text} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ color:'var(--accent)', fontWeight:700 }}>{icon}</span> {text}
            </span>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <a href="tel:+41612123456" style={{ display:'flex', alignItems:'center', gap:5, opacity:.8 }}>
            <span>📞</span> +41 61 212 34 56
          </a>
          <a href="mailto:contact@prodigio.ch" style={{ display:'flex', alignItems:'center', gap:5, opacity:.8 }}>
            <span>✉</span> contact@prodigio.ch
          </a>
        </div>
      </div>

      {/* Main Header */}
      <header style={{
        position:'sticky', top:0, zIndex:300,
        background:'rgba(255,255,255,.97)',
        backdropFilter:'blur(16px)',
        borderBottom:'1px solid var(--gray-100)',
        height:'var(--header-h)',
        display:'flex', alignItems:'center',
        padding:'0 clamp(16px,3vw,32px)', gap:20,
        transition:'box-shadow .2s',
        boxShadow: scrolled ? 'var(--shadow)' : 'none',
      }}>
        {/* Logo */}
        <Link href="/" style={{ flexShrink:0, lineHeight:1, textDecoration:'none' }}>
          <div style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:18, letterSpacing:3, color:'var(--black)', lineHeight:1 }}>
            PRO.DI.GIO
          </div>
          <div style={{ fontSize:7.5, letterSpacing:2.5, color:'var(--gray-400)', marginTop:3 }}>
            GROSSHANDEL · BASEL
          </div>
        </Link>

        <div style={{ width:1, height:28, background:'var(--gray-100)', flexShrink:0 }}/>

        {/* Desktop Nav */}
        <nav className="header-nav" style={{ gap:2, flex:1, alignItems:'center' }}>
          {NAV.map(item => (
            <NavDropdown key={item.href} item={item} pathname={pathname}/>
          ))}
        </nav>

        {/* Actions */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
          {/* Cart */}
          <button onClick={() => openSidebar()} style={{
            position:'relative', width:42, height:42,
            borderRadius:'var(--radius)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:18, transition:'all .15s',
            border:'1.5px solid var(--gray-100)',
            background: itemCount > 0 ? 'var(--accent-pale)' : 'transparent',
          }} title="Warenkorb">
            🛒
            {itemCount > 0 && (
              <span style={{
                position:'absolute', top:3, right:3,
                background:'var(--accent)', color:'white',
                fontSize:9, fontWeight:800, borderRadius:'50%',
                width:17, height:17,
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 0 0 2px white',
              }}>{itemCount > 9 ? '9+' : itemCount}</span>
            )}
          </button>

          {/* Desktop Auth */}
          {session ? (
            <div style={{ position:'relative' }} className="header-nav">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'7px 12px', borderRadius:'var(--radius)',
                fontSize:13.5, fontWeight:500,
                border:'1.5px solid var(--gray-200)',
                background: userMenuOpen ? 'var(--gray-50)' : 'white',
                transition:'all .15s',
              }}>
                <span style={{
                  width:26, height:26, borderRadius:'50%',
                  background:'var(--accent)', color:'white',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11.5, fontWeight:700, flexShrink:0,
                }}>
                  {(session.user.companyName ?? session.user.name ?? 'U')[0].toUpperCase()}
                </span>
                <span style={{ maxWidth:110, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {session.user.companyName ?? session.user.name}
                </span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ opacity:.4, transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {userMenuOpen && (
                <>
                  <div style={{ position:'fixed', inset:0, zIndex:290 }} onClick={() => setUserMenuOpen(false)}/>
                  <div style={{
                    position:'absolute', top:'calc(100% + 10px)', right:0, zIndex:310,
                    background:'white', border:'1px solid var(--gray-100)',
                    borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-xl)',
                    minWidth:230, overflow:'hidden',
                  }} className="fade-in">
                    <div style={{ padding:'16px 18px', background:'var(--cream)', borderBottom:'1px solid var(--gray-100)' }}>
                      <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>
                        {session.user.companyName ?? session.user.name}
                      </div>
                      <div style={{ fontSize:12, color:'var(--gray-400)' }}>{session.user.email}</div>
                      {session.user.priceGroup && session.user.priceGroup !== 'STANDARD' && (
                        <span style={{
                          display:'inline-block', marginTop:8, fontSize:11, fontWeight:700,
                          color: session.user.priceGroup === 'VIP' ? '#92650a' : 'var(--accent)',
                          background: session.user.priceGroup === 'VIP' ? '#fdf8ec' : 'var(--accent-light)',
                          padding:'3px 10px', borderRadius:20,
                        }}>
                          {session.user.priceGroup === 'VIP' ? '⭐ VIP (-20%)' : '🏆 Premium (-10%)'}
                        </span>
                      )}
                    </div>
                    <div style={{ padding:'6px 0' }}>
                      {[
                        { href:'/dashboard', icon:'📦', label:'Meine Bestellungen' },
                        ...(session.user.role === 'ADMIN' ? [{ href:'/admin', icon:'⚙️', label:'Admin-Panel', accent:true }] : []),
                      ].map(item => (
                        <Link key={item.href} href={item.href} style={{
                          display:'flex', alignItems:'center', gap:10,
                          padding:'10px 18px', fontSize:13.5,
                          color: (item as any).accent ? 'var(--accent)' : 'var(--black)',
                          fontWeight: (item as any).accent ? 600 : 400,
                          transition:'background .12s',
                        }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ width:20, textAlign:'center' }}>{item.icon}</span>
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    <div style={{ borderTop:'1px solid var(--gray-100)', padding:'6px 0' }}>
                      <button onClick={() => signOut({ callbackUrl:'/' })} style={{
                        display:'flex', alignItems:'center', gap:10, width:'100%',
                        textAlign:'left', padding:'10px 18px', fontSize:13.5,
                        color:'var(--warn)', transition:'background .12s',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--warn-bg)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ width:20, textAlign:'center' }}>↗</span>
                        Abmelden
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display:'flex', gap:8 }} className="header-nav">
              <Link href="/login"    className="btn btn-outline btn-sm">Anmelden</Link>
              <Link href="/register" className="btn btn-black btn-sm">Konto eröffnen</Link>
            </div>
          )}

          {/* Hamburger (mobile only) */}
          <div className="header-hamburger">
            <Hamburger open={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}/>
          </div>
        </div>
      </header>

      {/* ── Mobile Nav ── */}
      {mobileOpen && (
        <>
          <div className="mobile-nav-overlay" onClick={() => setMobileOpen(false)}/>
          <div className="mobile-nav-drawer">
            {/* Drawer header */}
            <div style={{
              padding:'16px 24px', borderBottom:'1px solid var(--gray-100)',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div>
                <div style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:16, letterSpacing:2 }}>PRO.DI.GIO</div>
                <div style={{ fontSize:9, letterSpacing:2, color:'var(--gray-400)' }}>GROSSHANDEL · BASEL</div>
              </div>
              <button onClick={() => setMobileOpen(false)} style={{
                width:34, height:34, borderRadius:'var(--radius)', border:'1.5px solid var(--gray-200)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, cursor:'pointer',
              }}>✕</button>
            </div>

            {/* Nav items */}
            <div style={{ flex:1 }}>
              {NAV.map(item => (
                <MobileNavItem key={item.href} item={item} onClose={() => setMobileOpen(false)}/>
              ))}
            </div>

            {/* Auth section */}
            <div style={{ padding:'20px 24px', borderTop:'1px solid var(--gray-100)', background:'var(--cream)' }}>
              {session ? (
                <div>
                  <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>
                    {session.user.companyName ?? session.user.name}
                  </div>
                  <div style={{ fontSize:12, color:'var(--gray-400)', marginBottom:16 }}>{session.user.email}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="btn btn-outline btn-sm" style={{ justifyContent:'flex-start' }}>
                      📦 Meine Bestellungen
                    </Link>
                    <button onClick={() => signOut({ callbackUrl:'/' })} className="btn btn-ghost btn-sm" style={{ justifyContent:'flex-start', color:'var(--warn)' }}>
                      ↗ Abmelden
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <Link href="/login"    onClick={() => setMobileOpen(false)} className="btn btn-outline" style={{ width:'100%', justifyContent:'center' }}>Anmelden</Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="btn btn-black"   style={{ width:'100%', justifyContent:'center' }}>B2B-Konto eröffnen</Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <CartSidebar open={cartOpen} onClose={closeSidebar}/>
    </>
  )
}
