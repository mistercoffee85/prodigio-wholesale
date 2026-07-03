import {
  Document, Page, Text, View, StyleSheet, Font,
} from '@react-pdf/renderer'

// Register a font with full Unicode support for German umlauts
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 700 },
  ],
})

const C = {
  green:   '#16a37a',
  dark:    '#0d1f17',
  gray:    '#6b7280',
  light:   '#f3f4f6',
  border:  '#e5e7eb',
  white:   '#ffffff',
  red:     '#dc2626',
}

const s = StyleSheet.create({
  page:        { fontFamily: 'Helvetica', fontSize: 9, color: C.dark, padding: '32 40', backgroundColor: C.white },
  row:         { flexDirection: 'row' },
  col:         { flex: 1 },

  // Header
  header:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  logo:        { fontSize: 20, fontWeight: 700, color: C.green, letterSpacing: -0.5 },
  logoSub:     { fontSize: 8, color: C.gray, marginTop: 2, letterSpacing: 1 },
  headerRight: { textAlign: 'right' },
  invoiceLabel:{ fontSize: 7, fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 3 },
  invoiceNum:  { fontSize: 18, fontWeight: 700, color: C.dark },
  invoiceDate: { fontSize: 8, color: C.gray, marginTop: 3 },

  // Divider
  divider:     { borderBottom: `1 solid ${C.border}`, marginVertical: 14 },
  dividerGreen:{ borderBottom: `2 solid ${C.green}`, marginVertical: 0 },

  // Addresses
  addrSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  addrBlock:   { flex: 1 },
  addrLabel:   { fontSize: 7, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 },
  addrLine:    { fontSize: 9, color: C.dark, marginBottom: 2, lineHeight: 1.4 },
  addrGray:    { fontSize: 8, color: C.gray, marginBottom: 2 },

  // Table
  tableHeader: { flexDirection: 'row', backgroundColor: C.dark, padding: '6 8', borderRadius: 2, marginBottom: 1 },
  tableHeaderText: { fontSize: 7, fontWeight: 700, color: C.white, textTransform: 'uppercase', letterSpacing: 0.8 },
  tableRow:    { flexDirection: 'row', padding: '7 8', borderBottom: `1 solid ${C.border}` },
  tableRowAlt: { flexDirection: 'row', padding: '7 8', borderBottom: `1 solid ${C.border}`, backgroundColor: '#fafafa' },
  tableCell:   { fontSize: 9, color: C.dark },
  tableCellGray:{ fontSize: 8, color: C.gray, marginTop: 1 },

  colPos:      { width: 28 },
  colName:     { flex: 1, paddingRight: 8 },
  colQty:      { width: 36, textAlign: 'right' },
  colUnit:     { width: 52, textAlign: 'right' },
  colTotal:    { width: 60, textAlign: 'right' },

  // Totals
  totalsArea:  { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  totalsBox:   { width: 220 },
  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel:  { fontSize: 9, color: C.gray },
  totalValue:  { fontSize: 9, color: C.dark, fontWeight: 400 },
  grandRow:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 8, borderTop: `2 solid ${C.green}` },
  grandLabel:  { fontSize: 11, fontWeight: 700, color: C.dark },
  grandValue:  { fontSize: 11, fontWeight: 700, color: C.green },

  // Payment info box
  payBox:      { marginTop: 24, backgroundColor: '#f0fdf4', border: `1 solid #bbf7d0`, borderRadius: 4, padding: '12 14' },
  payTitle:    { fontSize: 9, fontWeight: 700, color: C.green, marginBottom: 8 },
  payRow:      { flexDirection: 'row', marginBottom: 4 },
  payLabel:    { width: 90, fontSize: 8, color: C.gray },
  payValue:    { fontSize: 8, color: C.dark, fontWeight: 700, flex: 1 },

  // Status badge
  badgePaid:   { backgroundColor: '#dcfce7', color: '#166534', fontSize: 7, fontWeight: 700, padding: '3 7', borderRadius: 10 },
  badgeUnpaid: { backgroundColor: '#fee2e2', color: C.red,   fontSize: 7, fontWeight: 700, padding: '3 7', borderRadius: 10 },

  // Footer
  footer:      { position: 'absolute', bottom: 24, left: 40, right: 40 },
  footerText:  { fontSize: 7, color: C.gray, textAlign: 'center', lineHeight: 1.6 },
})

// ── Types ───────────────────────────────────────────────────────────────────
export interface InvoiceData {
  orderNumber:   string
  createdAt:     string   // formatted date string
  paidAt?:       string
  isPaid:        boolean

  customer: {
    name:     string
    email:    string
    company?: string
    uid?:     string
    address?: string
    industry?: string
  }

  items: {
    name:      string
    sku:       string
    quantity:  number
    unitPrice: number
    total:     number
    unit?:     string
  }[]

  subtotal:     number
  tax:          number
  shippingCost: number
  total:        number
  paymentMethod: string
  shippingOption?: string
}

function chf(n: number) {
  return `CHF ${n.toFixed(2)}`
}

const SHIPPING_LABELS: Record<string, string> = {
  PRODIGIO_DELIVERS: 'Lieferung durch Prodigio',
  SELF_PICKUP:       'Abholung Ex-Works',
  LOCAL_PICKUP:      'Abholung lokal',
  LOCAL_DELIVERY:    'Lokale Lieferung',
}

const PAYMENT_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Vorauskasse / Banküberweisung',
  STRIPE_CARD:   'Kreditkarte',
  STRIPE_TWINT:  'TWINT',
  STRIPE_PAYPAL: 'PayPal',
  STRIPE_KLARNA: 'Klarna',
}

// ── PDF Document ─────────────────────────────────────────────────────────────
export function InvoicePDF({ d }: { d: InvoiceData }) {
  const showBankDetails = !d.isPaid && d.paymentMethod === 'BANK_TRANSFER'

  return (
    <Document title={`Rechnung-${d.orderNumber}`} author="PRO.DI.GIO GmbH">
      <Page size="A4" style={s.page}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View>
            <Text style={s.logo}>PRO.DI.GIO</Text>
            <Text style={s.logoSub}>GmbH · B2B Grosshandel Schweiz</Text>
            <View style={{ marginTop: 8 }}>
              <Text style={s.addrGray}>Prodigio GmbH</Text>
              <Text style={s.addrGray}>Güterstrasse 82, 4053 Basel</Text>
              <Text style={s.addrGray}>info@prodigio.ch · b2b.prodigio.ch</Text>
              <Text style={s.addrGray}>UID: CHE-123.456.789</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.invoiceLabel}>Rechnung</Text>
            <Text style={s.invoiceNum}>#{d.orderNumber}</Text>
            <Text style={s.invoiceDate}>Datum: {d.createdAt}</Text>
            {d.isPaid && d.paidAt && (
              <Text style={[s.invoiceDate, { marginTop: 4 }]}>Bezahlt: {d.paidAt}</Text>
            )}
            <View style={{ marginTop: 8, alignItems: 'flex-end' }}>
              <Text style={d.isPaid ? s.badgePaid : s.badgeUnpaid}>
                {d.isPaid ? '✓ BEZAHLT' : 'OFFEN'}
              </Text>
            </View>
          </View>
        </View>
        <View style={s.dividerGreen} />
        <View style={{ marginBottom: 4 }} />

        {/* ── ADDRESSES ── */}
        <View style={s.addrSection}>
          <View style={[s.addrBlock, { paddingRight: 24 }]}>
            <Text style={s.addrLabel}>Rechnungsempfänger</Text>
            <Text style={[s.addrLine, { fontWeight: 700 }]}>{d.customer.company ?? d.customer.name}</Text>
            {d.customer.company && <Text style={s.addrLine}>{d.customer.name}</Text>}
            {d.customer.address && <Text style={s.addrLine}>{d.customer.address}</Text>}
            {d.customer.uid && <Text style={s.addrGray}>UID: {d.customer.uid}</Text>}
            <Text style={s.addrGray}>{d.customer.email}</Text>
          </View>
          <View style={[s.addrBlock, { alignItems: 'flex-end' }]}>
            <Text style={s.addrLabel}>Lieferung / Versand</Text>
            <Text style={s.addrLine}>{SHIPPING_LABELS[d.shippingOption ?? ''] ?? d.shippingOption ?? '—'}</Text>
            <Text style={[s.addrGray, { marginTop: 8 }]}>Zahlungsart</Text>
            <Text style={s.addrLine}>{PAYMENT_LABELS[d.paymentMethod] ?? d.paymentMethod}</Text>
          </View>
        </View>

        {/* ── TABLE ── */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderText, s.colPos]}>#</Text>
          <Text style={[s.tableHeaderText, s.colName]}>Artikel</Text>
          <Text style={[s.tableHeaderText, s.colQty]}>Menge</Text>
          <Text style={[s.tableHeaderText, s.colUnit]}>Einzelpreis</Text>
          <Text style={[s.tableHeaderText, s.colTotal]}>Total</Text>
        </View>

        {d.items.map((item, i) => (
          <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <Text style={[s.tableCell, s.colPos]}>{i + 1}</Text>
            <View style={s.colName}>
              <Text style={s.tableCell}>{item.name}</Text>
              {item.sku ? <Text style={s.tableCellGray}>SKU: {item.sku}</Text> : null}
            </View>
            <Text style={[s.tableCell, s.colQty]}>{item.quantity}{item.unit ? ` ${item.unit}` : ''}</Text>
            <Text style={[s.tableCell, s.colUnit]}>{chf(item.unitPrice)}</Text>
            <Text style={[s.tableCell, s.colTotal, { fontWeight: 700 }]}>{chf(item.total)}</Text>
          </View>
        ))}

        {/* ── TOTALS ── */}
        <View style={s.totalsArea}>
          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Zwischensumme</Text>
              <Text style={s.totalValue}>{chf(d.subtotal)}</Text>
            </View>
            {d.shippingCost > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Versandkosten</Text>
                <Text style={s.totalValue}>{chf(d.shippingCost)}</Text>
              </View>
            )}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>MwSt. (inkl.)</Text>
              <Text style={s.totalValue}>{chf(d.tax)}</Text>
            </View>
            <View style={s.grandRow}>
              <Text style={s.grandLabel}>Total CHF</Text>
              <Text style={s.grandValue}>{chf(d.total)}</Text>
            </View>
          </View>
        </View>

        {/* ── BANK DETAILS (only if unpaid + bank transfer) ── */}
        {showBankDetails && (
          <View style={s.payBox}>
            <Text style={s.payTitle}>Zahlungsinformationen</Text>
            {[
              ['Empfänger',        'PRO.DI.GIO GmbH'],
              ['IBAN',             'CH40 0023 3233 2287 0701 P'],
              ['Bank',             'UBS AG, Basel'],
              ['Verwendungszweck', `Bestellung #${d.orderNumber}`],
              ['Betrag',           chf(d.total)],
              ['Zahlungsziel',     '3 Werktage ab Rechnungsdatum'],
            ].map(([label, value]) => (
              <View key={label} style={s.payRow}>
                <Text style={s.payLabel}>{label}</Text>
                <Text style={s.payValue}>{value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── FOOTER ── */}
        <View style={s.footer} fixed>
          <View style={s.divider} />
          <Text style={s.footerText}>
            PRO.DI.GIO GmbH · Güterstrasse 82 · 4053 Basel · info@prodigio.ch · UID: CHE-123.456.789{'\n'}
            Alle Preise in CHF inkl. MwSt. · Gerichtsstand: Basel · b2b.prodigio.ch
          </Text>
        </View>

      </Page>
    </Document>
  )
}
