import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const metadata = { title: 'Datenschutz – PRO.DI.GIO GmbH' }

export default function DatenschutzPage() {
  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh', background: '#f8f9fb' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--forest) 0%, #1a3d28 100%)',
          color: 'white', padding: 'clamp(24px,5vw,48px) clamp(20px,6vw,80px)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>Rechtliches</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(24px,4vw,36px)', fontWeight: 700 }}>Datenschutzerklärung</h1>
          <p style={{ opacity: .65, marginTop: 8, fontSize: 14 }}>PRO.DI.GIO GmbH · Stand: Januar 2025</p>
        </div>

        <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(32px,4vw,56px) clamp(16px,4vw,40px)' }}>
          <div className="card" style={{ padding: 'clamp(24px,4vw,48px)', lineHeight: 1.8, fontSize: 14.5 }}>

            <Section title="1. Verantwortliche Stelle">
              PRO.DI.GIO GmbH, Dreispitz, 4142 Basel, Schweiz. E-Mail: wholesale@prodigio.ch. Telefon: +41 61 212 34 56.
            </Section>

            <Section title="2. Erhobene Daten">
              Wir erheben folgende personenbezogene Daten: Name, Firmenname, E-Mail-Adresse, Telefonnummer, Lieferadresse sowie Bestelldaten. Diese Daten werden ausschliesslich für die Abwicklung Ihrer Bestellungen und die Kommunikation mit Ihnen verwendet.
            </Section>

            <Section title="3. Zweck der Datenverarbeitung">
              Ihre Daten werden verwendet für: die Vertragsabwicklung und Rechnungsstellung, die Lieferung von Waren, die Kundenbetreuung und den Support, sowie für die Benutzerkonten-Verwaltung auf unserer Plattform.
            </Section>

            <Section title="4. Weitergabe von Daten">
              Wir geben Ihre Daten nicht an Dritte weiter, ausser an Dienstleister, die zur Vertragserfüllung notwendig sind (z.B. DPD für die Lieferung). Diese sind vertraglich zur Vertraulichkeit verpflichtet.
            </Section>

            <Section title="5. Datenspeicherung">
              Ihre Daten werden so lange gespeichert, wie es für die Vertragsabwicklung und die gesetzlichen Aufbewahrungsfristen (10 Jahre gemäss OR) erforderlich ist.
            </Section>

            <Section title="6. Ihre Rechte">
              Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer Daten. Wenden Sie sich dazu an: wholesale@prodigio.ch.
            </Section>

            <Section title="7. Cookies">
              Diese Plattform verwendet technisch notwendige Cookies für die Sitzungsverwaltung und den Warenkorb. Es werden keine Tracking- oder Marketing-Cookies eingesetzt.
            </Section>

            <Section title="8. Anwendbares Recht">
              Es gilt das Schweizer Datenschutzgesetz (DSG). Bei Fragen zum Datenschutz wenden Sie sich bitte an wholesale@prodigio.ch.
            </Section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: 'var(--forest)' }}>{title}</h2>
      <p style={{ color: 'var(--gray-600, #4b5563)' }}>{children}</p>
    </div>
  )
}
