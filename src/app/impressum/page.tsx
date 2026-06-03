import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const metadata = { title: 'Impressum – PRO.DI.GIO GmbH' }

export default function ImpressumPage() {
  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh', background: '#f8f9fb' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--forest) 0%, #1a3d28 100%)',
          color: 'white', padding: 'clamp(24px,5vw,48px) clamp(20px,6vw,80px)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>Rechtliches</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(24px,4vw,36px)', fontWeight: 700 }}>Impressum</h1>
        </div>

        <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(32px,4vw,56px) clamp(16px,4vw,40px)' }}>
          <div className="card" style={{ padding: 'clamp(24px,4vw,48px)', lineHeight: 1.8, fontSize: 14.5 }}>

            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: 'var(--forest)' }}>Angaben gemäss DSG</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  {[
                    ['Firma', 'PRO.DI.GIO GmbH'],
                    ['Adresse', 'Mailand-Strasse 31, 4053 Basel, Schweiz'],
                    ['E-Mail', 'contact@prodigio.ch'],
                    ['Web', 'www.prodigio.ch'],
                    ['Rechtsform', 'GmbH (Gesellschaft mit beschränkter Haftung)'],
                    ['Handelsregister', 'Kanton Basel-Stadt'],
                    ['MwSt-Nr.', 'CHE-XXX.XXX.XXX MWST'],
                    ['Tätigkeitsbereich', 'B2B Grosshandel – Trendprodukte, Direktimport'],
                  ].map(([key, value]) => (
                    <tr key={key} style={{ borderBottom: '1px solid var(--gray-100, #f3f4f6)' }}>
                      <td style={{ padding: '10px 0', fontWeight: 600, minWidth: 120, paddingRight: 16, color: 'var(--forest)', whiteSpace: 'nowrap' }}>{key}</td>
                      <td style={{ padding: '10px 0', color: 'var(--gray-600, #4b5563)' }}>{value}</td>
                    </tr>
                  ))}
                </table>
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: 'var(--forest)' }}>Haftungsausschluss</h2>
              <p style={{ color: 'var(--gray-600, #4b5563)' }}>
                Die PRO.DI.GIO GmbH übernimmt keine Gewähr für die Richtigkeit, Vollständigkeit und Aktualität der auf dieser Website bereitgestellten Informationen. Haftungsansprüche gegen die PRO.DI.GIO GmbH wegen Schäden materieller oder immaterieller Art, welche aus dem Zugriff oder der Nutzung bzw. Nichtnutzung der veröffentlichten Informationen entstanden sind, werden ausgeschlossen.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: 'var(--forest)' }}>Urheberrecht</h2>
              <p style={{ color: 'var(--gray-600, #4b5563)' }}>
                Die auf dieser Website veröffentlichten Inhalte unterliegen dem schweizerischen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung ausserhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung der PRO.DI.GIO GmbH.
              </p>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
