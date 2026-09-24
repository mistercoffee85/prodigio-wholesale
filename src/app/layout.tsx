import type { Metadata, Viewport } from 'next'
import { Archivo } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'
import CookieBanner from '@/components/layout/CookieBanner'

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-archivo',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://b2b.prodigio.ch'),
  title: { default: 'PRO.DI.GIO Grosshandel', template: '%s | PRO.DI.GIO Grosshandel' },
  description: 'B2B Grosshandel für Bubble Tea, TEABALLS & Sweets. Direktimport, exklusive Preise für Wiederverkäufer, Gastronomie und Einzelhandel in der Schweiz.',
  keywords: ['Grosshandel', 'B2B', 'Bubble Tea', 'TEABALLS', 'Sweets', 'Basel', 'Schweiz', 'Direktimport'],
  openGraph: {
    title: 'PRO.DI.GIO Grosshandel',
    description: 'B2B Grosshandel für Bubble Tea, TEABALLS & Sweets — Direktimport, beste Konditionen schweizweit.',
    url: 'https://b2b.prodigio.ch',
    siteName: 'PRO.DI.GIO Grosshandel',
    locale: 'de_CH',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={archivo.variable}>
      <body style={{ fontFamily: 'var(--font-archivo), -apple-system, sans-serif' }}>
        <Providers>
          {children}
          <CookieBanner />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: { background: '#0d0d0d', color: '#fff', borderRadius: '8px', fontSize: '13.5px' },
              success: { iconTheme: { primary: '#5E1EB8', secondary: '#fff' } },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
