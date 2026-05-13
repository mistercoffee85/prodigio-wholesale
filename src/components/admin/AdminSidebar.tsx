'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const NAV = [
  { href: '/admin',           icon: '📊', label: 'Dashboard'          },
  { href: '/admin/orders',    icon: '📦', label: 'Bestellungen'       },
  { href: '/admin/customers', icon: '👥', label: 'Kunden'             },
  { href: '/admin/products',  icon: '🛍️', label: 'Produkte'           },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 240, flexShrink: 0, background: 'var(--forest)', color: 'white',
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'white' }}>
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
            <Link key={item.href} href={item.href} style={{
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
        <Link href="/products" style={{
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
  )
}
