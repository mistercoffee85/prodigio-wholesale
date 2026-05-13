import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'
import CookieBanner from '@/components/layout/CookieBanner'

export const metadata: Metadata = {
  title: { default: 'PRO.DI.GIO Grosshandel', template: '%s | PRO.DI.GIO Grosshandel' },
  description: 'B2B Grosshandel für Bubble Tea, Tea Balls & Sweets. Exklusive Preise für Wiederverkäufer, Gastronomie und Einzelhandel.',
  keywords: ['Grosshandel', 'B2B', 'Bubble Tea', 'Tea Balls', 'Sweets', 'Basel', 'Schweiz'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <Providers>
          {children}
          <CookieBanner />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: { background: '#0d0d0d', color: '#fff', borderRadius: '8px', fontSize: '13.5px' },
              success: { iconTheme: { primary: '#1a9e7a', secondary: '#fff' } },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
