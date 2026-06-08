import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const metadata = { title: 'AGB – PRO.DI.GIO GmbH' }

export default function AGBPage() {
  return (
    <>
      <Header />
      <main style={{ minHeight: '80vh', background: '#f8f9fb' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--forest) 0%, #1a3d28 100%)',
          color: 'white', padding: 'clamp(24px,5vw,48px) clamp(20px,6vw,80px)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 8 }}>Rechtliches</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(24px,4vw,36px)', fontWeight: 700 }}>Allgemeine Geschäftsbedingungen</h1>
          <p style={{ opacity: .65, marginTop: 8, fontSize: 14 }}>PRO.DI.GIO GmbH · Stand: Januar 2025</p>
        </div>

        <div style={{ maxWidth: 860, width: '100%', margin: '0 auto', padding: 'clamp(32px,4vw,56px) clamp(16px,4vw,40px)' }}>
          <div className="card" style={{ padding: 'clamp(24px,4vw,48px)', lineHeight: 1.8, fontSize: 14.5 }}>

            <Section title="1. Geltungsbereich">
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Bestellungen, die über die B2B-Grosshandelsplattform der PRO.DI.GIO GmbH, Mailand-Strasse 31, 4053 Basel, Schweiz (nachfolgend «Anbieter») aufgegeben werden. Die AGB richten sich ausschliesslich an gewerbliche Kunden (B2B).
            </Section>

            <Section title="2. Vertragsschluss">
              Die Darstellung der Produkte auf der Plattform stellt kein bindendes Angebot dar. Durch das Absenden einer Bestellung gibt der Kunde ein verbindliches Angebot ab. Der Vertrag kommt mit der Auftragsbestätigung per E-Mail zustande.
            </Section>

            <Section title="3. Preise und Zahlungsbedingungen">
              Alle Preise verstehen sich in Schweizer Franken (CHF) exklusive Mehrwertsteuer. Auf Lebensmittel wird der reduzierte MwSt.-Satz von 2,6 % erhoben; auf übrige Artikel der Normalsatz von 8,1 %. Die Zahlung erfolgt ausschliesslich per Vorauskasse (Banküberweisung) innert 3 Werktagen nach Bestelleingang. Bei nicht fristgerechter Zahlung wird die Bestellung automatisch storniert. Bei Zahlungsverzug werden Verzugszinsen von 5 % p.a. berechnet.
            </Section>

            <Section title="4. Lieferung">
              Die Lieferung erfolgt ausschliesslich innerhalb der Schweiz. Die Versandkosten werden automatisch nach Bestellwert berechnet: bis CHF 100 → CHF 9.90; bis CHF 200 → CHF 19.90; bis CHF 300 → CHF 29.90; bis CHF 400 → CHF 49.90; ab CHF 400 → CHF 90.00 (Palette). Die Lieferkosten werden direkt bei Bestellung berechnet und sind im Gesamtbetrag enthalten. Die Lieferzeit beträgt in der Regel 2–4 Werktage. Liefertermine sind unverbindlich, sofern nicht ausdrücklich schriftlich anders vereinbart.
            </Section>

            <Section title="5. Mindestbestellmengen">
              Für einzelne Produkte gelten Mindestbestellmengen (MOQ), die auf der jeweiligen Produktseite ausgewiesen sind. Der Anbieter behält sich das Recht vor, Bestellungen unter der angegebenen Mindestmenge abzulehnen.
            </Section>

            <Section title="6. Eigentumsvorbehalt">
              Die gelieferte Ware bleibt bis zur vollständigen Bezahlung des Kaufpreises Eigentum des Anbieters.
            </Section>

            <Section title="7. Gewährleistung und Haftung">
              Offensichtliche Mängel sind innerhalb von 5 Werktagen nach Wareneingang schriftlich zu rügen. Die Gewährleistungsfrist beträgt 1 Jahr. Die Haftung für indirekte Schäden oder entgangenen Gewinn ist ausgeschlossen.
            </Section>

            <Section title="8. Gerichtsstand und anwendbares Recht">
              Es gilt Schweizer Recht unter Ausschluss des UN-Kaufrechts (CISG). Ausschliesslicher Gerichtsstand ist Basel, Schweiz.
            </Section>

            <Section title="9. Kontakt">
              PRO.DI.GIO GmbH · Mailand-Strasse 31, 4053 Basel · Tel: +41 61 685 95 33 · E-Mail: contact@prodigio.ch
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
