'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'

const NAV = [
  { href: '/admin',           icon: '📊', label: 'Dashboard'          },
  { href: '/admin/orders',    icon: '📦', label: 'Bestellungen'       },
  { href: '/admin/customers', icon: '👥', label: 'Kunden'             },
  { href: '/admin/products',  icon: '🛍️', label: 'Produkte'           },
  { href: '/admin/preise',    icon: '💰', label: 'Marge & Preise'     },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <style>{`
        .admin-sidebar {
          width: 240px;
          flex-shrink: 0;
          background: var(--forest);
          color: white;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }
        .admin-hamburger {
          display: none;
        }
        .admin-sidebar-overlay {
          display: none;
        }
        @media (max-width: 768px) {
          .admin-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 1000;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            min-height: unset;
            width: 260px;
            max-width: 85vw;
          }
          .admin-sidebar.admin-sidebar--open {
            transform: translateX(0);
          }
          .admin-hamburger {
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            top: 12px;
            left: 12px;
            z-index: 1100;
            background: var(--forest, #1a4a3a);
            color: white;
            border: none;
            border-radius: 8px;
            width: 40px;
            height: 40px;
            cursor: pointer;
            font-size: 18px;
            box-shadow: 0 2px 8px rgba(0,0,0,.3);
          }
          .admin-sidebar-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,.45);
            z-index: 999;
          }
        }
      `}</style>

      {/* Mobile hamburger button */}
      <button
        className="admin-hamburger"
        onClick={() => setMobileOpen(true)}
        aria-label="Menü öffnen"
      >
        ☰
      </button>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`admin-sidebar${mobileOpen ? ' admin-sidebar--open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'white' }} onClick={() => setMobileOpen(false)}>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: 3 }}>PRO.DI.GIO</div>
            <div style={{ fontSize: 8.5, letterSpacing: 2, opacity: .45, marginTop: 3 }}>GROSSHANDEL · BASEL</div>
          </Link>
          <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(26,158,122,.25)', border: '1px solid rgba(26,158,122,.4)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600, color: '#4dffcc' }}>
            ⚙️ Admin-Panel
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,.35)', marginBottom: 10, paddingLeft: 8, textTransform: 'uppercase' }}>
            Navigation
          </div>
          {NAV.map(item => {
            const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 'var(--radius)',
                fontSize: 13.5, fontWeight: 500, marginBottom: 2,
                color: isActive ? 'white' : 'rgba(255,255,255,.6)',
                background: isActive ? 'rgba(26,158,122,.3)' : 'transparent',
                border: isActive ? '1px solid rgba(26,158,122,.4)' : '1px solid transparent',
                transition: 'all .15s', textDecoration: 'none',
              }}>
                <span style={{ width: 20, textAlign: 'center', fontSize: 15 }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <Link href="/products" onClick={() => setMobileOpen(false)} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            borderRadius: 'var(--radius)', fontSize: 13, color: 'rgba(255,255,255,.55)',
            textDecoration: 'none', marginBottom: 4, transition: 'all .15s',
          }}>
            <span style={{ width: 20, textAlign: 'center' }}>🏪</span>
            Shop ansehen
          </Link>
          <button onClick={() => signOut({ callbackUrl: '/' })} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '10px 12px', borderRadius: 'var(--radius)',
            fontSize: 13, color: 'rgba(255,100,100,.8)', cursor: 'pointer',
            background: 'none', border: 'none', transition: 'all .15s',
          }}>
            <span style={{ width: 20, textAlign: 'center' }}>↗</span>
            Abmelden
          </button>
        </div>
      </aside>
    </>
  )
}
