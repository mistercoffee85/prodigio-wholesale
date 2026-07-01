import { Resend } from 'resend'

// Lazy init — API key only needed at runtime, not at build time
let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!)
  return _resend
}

const FROM    = process.env.EMAIL_FROM    ?? 'PRO.DI.GIO Grosshandel <onboarding@resend.dev>'
const ADMIN   = process.env.ADMIN_EMAIL   ?? 'contact@prodigio.ch'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://b2b.prodigio.ch'

async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const { error } = await getResend().emails.send({ from: FROM, to, subject, html })
  if (error) throw new Error(`Resend error: ${error.message}`)
}

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Inter, Arial, sans-serif; margin: 0; background: #f8f8f8; color: #0d0d0d; }
    .wrapper { max-width: 600px; margin: 32px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
    .header { background: #0d0d0d; color: white; padding: 28px 32px; }
    .header h1 { margin: 0; font-size: 20px; letter-spacing: 2px; }
    .header p { margin: 4px 0 0; font-size: 11px; opacity: .5; letter-spacing: 1px; }
    .body { padding: 32px; }
    .footer { background: #f8f8f8; padding: 20px 32px; font-size: 12px; color: #9e9e9e; border-top: 1px solid #e0e0e0; }
    .btn { display: inline-block; background: #1a9e7a; color: white !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-green { background: #e6f7f2; color: #1a9e7a; }
    .badge-red { background: #fef2f2; color: #e85c2a; }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    th { font-weight: 600; color: #555; font-size: 12px; text-transform: uppercase; }
    .total-row td { font-weight: 700; font-size: 16px; border-bottom: none; padding-top: 14px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>PRO.DI.GIO</h1>
      <p>GMBH · GROSSHANDEL · BASEL</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      PRO.DI.GIO GmbH · Mailand-Strasse 31, 4053 Basel · contact@prodigio.ch<br/>
      <a href="${APP_URL}" style="color:#1a9e7a;">b2b.prodigio.ch</a>
    </div>
  </div>
</body>
</html>`
}

// ── Email Templates ─────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string, companyName: string) {
  await sendMail({
    to,
    subject: 'Ihre Registrierung bei PRO.DI.GIO Grosshandel',
    html: baseTemplate(`
      <h2>Willkommen, ${name}!</h2>
      <p>Vielen Dank für Ihre Registrierung als B2B-Kunde bei PRO.DI.GIO Grosshandel.</p>
      <p>Ihr Konto für <strong>${companyName}</strong> wird momentan von unserem Team geprüft. Sie erhalten innerhalb von 1 Werktag eine Bestätigung.</p>
      <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung:</p>
      <a href="mailto:contact@prodigio.ch" class="btn">Kontakt aufnehmen</a>
      <p style="color:#9e9e9e; font-size:13px;">PRO.DI.GIO GmbH · Basel, Schweiz</p>
    `),
  })
}

export async function sendApprovalEmail(to: string, name: string) {
  await sendMail({
    to,
    subject: '✅ Ihr B2B-Konto wurde freigegeben',
    html: baseTemplate(`
      <h2>Ihr Konto ist aktiv!</h2>
      <p>Hallo ${name},</p>
      <p>Ihr B2B-Konto wurde erfolgreich von unserem Team geprüft und <span class="badge badge-green">freigegeben</span>.</p>
      <p>Sie können sich jetzt anmelden und unser komplettes Sortiment zu Grosshandelspreisen bestellen.</p>
      <a href="${APP_URL}/login" class="btn">Jetzt einloggen →</a>
      <p>Bei Fragen: <a href="mailto:contact@prodigio.ch" style="color:#1a9e7a;">contact@prodigio.ch</a></p>
    `),
  })
}

export async function sendRejectionEmail(to: string, name: string) {
  await sendMail({
    to,
    subject: 'Ihre Registrierung bei PRO.DI.GIO',
    html: baseTemplate(`
      <h2>Hallo ${name}</h2>
      <p>Leider können wir Ihre Registrierung aktuell nicht genehmigen.</p>
      <p>Für weitere Informationen kontaktieren Sie uns bitte direkt:</p>
      <a href="mailto:contact@prodigio.ch" class="btn">E-Mail senden</a>
    `),
  })
}

export async function sendAdminNewCustomerEmail(customerName: string, companyName: string, email: string) {
  await sendMail({
    to: ADMIN,
    subject: `🆕 Neuer B2B-Kunde: ${companyName}`,
    html: baseTemplate(`
      <h2>Neuer Kunde wartet auf Freigabe</h2>
      <table>
        <tr><td><strong>Name:</strong></td><td>${customerName}</td></tr>
        <tr><td><strong>Firma:</strong></td><td>${companyName}</td></tr>
        <tr><td><strong>E-Mail:</strong></td><td>${email}</td></tr>
      </table>
      <a href="${APP_URL}/admin/customers" class="btn">Im Admin verwalten →</a>
    `),
  })
}

export async function sendOrderConfirmationEmail(
  to: string,
  name: string,
  order: { orderNumber: string; total: number; paymentMethod: string; shippingOption?: string; shippingOptionLocal?: string; items: Array<{ name: string; quantity: number; unitPrice: number; unit?: string; sku?: string }> }
) {
  const itemRows = order.items.map(i => `
    <tr>
      <td>
        <strong>${i.name}</strong>
        ${i.sku ? `<br><span style="font-size:11px;color:#888;">Art.Nr.: ${i.sku}</span>` : ''}
      </td>
      <td style="text-align:center;white-space:nowrap">
        ${i.quantity} VE
        ${i.unit ? `<br><span style="font-size:11px;color:#888;">(${i.unit} / VE)</span>` : ''}
      </td>
      <td style="text-align:right;white-space:nowrap">CHF ${(i.unitPrice * i.quantity).toFixed(2)}</td>
    </tr>
  `).join('')

  const paymentLabel: Record<string, string> = {
    STRIPE_CARD:   'Kreditkarte / Apple Pay / Google Pay',
    STRIPE_TWINT:  'TWINT',
    STRIPE_PAYPAL: 'PayPal',
    STRIPE_KLARNA: 'Klarna',
    BANK_TRANSFER: 'Vorauskasse (Banküberweisung)',
  }

  await sendMail({
    to,
    subject: `Bestellbestätigung #${order.orderNumber}`,
    html: baseTemplate(`
      <h2>Vielen Dank für Ihre Bestellung!</h2>
      <p>Hallo ${name}, Ihre Bestellung <strong>#${order.orderNumber}</strong> wurde erfolgreich aufgenommen.</p>
      <h3>Bestellübersicht</h3>
      <table>
        <thead><tr><th>Produkt</th><th>Menge</th><th>Betrag</th></tr></thead>
        <tbody>${itemRows}</tbody>
        <tr class="total-row"><td colspan="2">Gesamtbetrag (inkl. MwSt.)</td><td style="text-align:right">CHF ${order.total.toFixed(2)}</td></tr>
      </table>
      <p><strong>Zahlungsmethode:</strong> ${paymentLabel[order.paymentMethod] ?? order.paymentMethod}</p>
      ${order.shippingOptionLocal ? `
        <div style="background:#f8f8f8;border-radius:8px;padding:14px 16px;margin:12px 0;">
          <strong>🇮🇹 Cash &amp; Carry (aus Italien):</strong><br/>
          ${order.shippingOption === 'SELF_PICKUP'
            ? '🚗 Selbstabholung Ex Works — Sie holen direkt beim Lieferanten in Italien ab. Verzollung und Transport liegen bei Ihnen.'
            : '🚚 Transport &amp; Verzollung durch PRO.DI.GIO GmbH — Transportkosten werden separat bestätigt und 1:1 weiterverrechnet.'}
        </div>
        <div style="background:#f8f8f8;border-radius:8px;padding:14px 16px;margin:12px 0;">
          <strong>🇨🇭 Lagerprodukte (ab Basel):</strong><br/>
          ${order.shippingOptionLocal === 'LOCAL_PICKUP'
            ? '🏢 Abholung bei PRO.DI.GIO GmbH, Mailand-Strasse 31, 4053 Basel — wir kontaktieren Sie zur Terminvereinbarung.'
            : '🚚 Lieferung durch PRO.DI.GIO GmbH — Versandkosten im Gesamtbetrag enthalten.'}
        </div>
      ` : `
        <p><strong>Lieferung:</strong> ${order.shippingOption === 'SELF_PICKUP'
          ? '🚗 Selbstabholung Ex Works – Verzollung und Transport liegen bei Ihnen.'
          : order.shippingOption === 'LOCAL_PICKUP'
          ? '🏢 Abholung bei PRO.DI.GIO GmbH, Mailand-Strasse 31, 4053 Basel – wir kontaktieren Sie zur Terminvereinbarung.'
          : order.shippingOption === 'LOCAL_DELIVERY'
          ? '🚚 Lieferung durch PRO.DI.GIO GmbH – Versandkosten im Gesamtbetrag enthalten.'
          : '🚚 Transport &amp; Verzollung durch PRO.DI.GIO GmbH – Transportkosten werden separat bestätigt.'
        }</p>
      `}
      ${order.paymentMethod === 'BANK_TRANSFER' || order.paymentMethod === 'NET_30' ? `
        <div style="background:#fff7ed; padding:16px; border-radius:8px; margin:16px 0; border:1px solid #fcd9b6;">
          <strong style="color:#c2430c;">⚠️ Wichtig: Zahlung innert 3 Werktagen!</strong><br/>
          Bei nicht fristgerechter Zahlung wird die Bestellung automatisch storniert.<br/><br/>
          <strong>Bankdaten für Vorauszahlung:</strong><br/>
          IBAN: CH40 0023 3233 2287 0701 P<br/>
          Bank: UBS Basel<br/>
          Zahlungsreferenz: <strong>#${order.orderNumber}</strong>
        </div>
      ` : ''}
      <a href="${APP_URL}/dashboard/orders" class="btn">Bestellung ansehen →</a>
    `),
  })
}

export async function sendOrderCancelledEmail(to: string, name: string, orderNumber: string) {
  await sendMail({
    to,
    subject: `Bestellung #${orderNumber} storniert — Zahlung nicht eingegangen`,
    html: baseTemplate(`
      <h2>Bestellung storniert</h2>
      <p>Hallo ${name},</p>
      <p>Ihre Bestellung <strong>#${orderNumber}</strong> wurde <span class="badge badge-red">storniert</span>,
      da die Vorauszahlung nicht innert 3 Werktagen bei uns eingegangen ist.</p>
      <p>Die reservierten Artikel wurden wieder freigegeben. Sie können jederzeit eine neue Bestellung aufgeben.</p>
      <a href="${APP_URL}/products" class="btn">Neue Bestellung aufgeben →</a>
      <p style="color:#9e9e9e; font-size:13px;">Bereits überwiesen? Melden Sie sich bitte umgehend unter
      <a href="mailto:contact@prodigio.ch" style="color:#1a9e7a;">contact@prodigio.ch</a> — wir kümmern uns darum.</p>
    `),
  })
}

export async function sendTransportCostEmail(
  to: string,
  name: string,
  order: { orderNumber: string; shippingCost: number; subtotal: number; tax: number; total: number },
  paymentLinkUrl: string
) {
  await sendMail({
    to,
    subject: `Transportkosten Bestellung #${order.orderNumber} — Bitte sofort bezahlen`,
    html: baseTemplate(`
      <h2>Transportkosten bestätigt</h2>
      <p>Hallo ${name},</p>
      <p>Die Transportkosten für Ihre Bestellung <strong>#${order.orderNumber}</strong> wurden berechnet und müssen separat bezahlt werden.</p>

      <div style="background:#f8f9fb; border-radius:10px; padding:18px 20px; margin:20px 0;">
        <table>
          <tr><td style="color:#666;">Warenwert</td><td style="text-align:right;">CHF ${order.subtotal.toFixed(2)}</td></tr>
          <tr><td style="color:#666;">MwSt.</td><td style="text-align:right;">CHF ${order.tax.toFixed(2)}</td></tr>
          <tr><td style="color:#666;"><strong>Transportkosten</strong></td><td style="text-align:right;"><strong>CHF ${order.shippingCost.toFixed(2)}</strong></td></tr>
          <tr style="border-top:2px solid #0d0d0d;"><td style="padding-top:10px;font-weight:800;font-size:16px;">Gesamttotal</td><td style="text-align:right;padding-top:10px;font-weight:800;font-size:16px;">CHF ${order.total.toFixed(2)}</td></tr>
        </table>
      </div>

      <div style="background:#fff7ed; border:1px solid #fcd9b6; border-radius:10px; padding:16px 18px; margin:16px 0;">
        <strong style="color:#c2430c;">⚠️ Bitte sofort bezahlen!</strong><br/>
        Klicken Sie auf den Button und bezahlen Sie die Transportkosten direkt online. Ihre Bestellung wird erst nach Zahlungseingang bearbeitet und versendet.
      </div>

      <a href="${paymentLinkUrl}" class="btn" style="font-size:16px; padding:14px 32px;">
        CHF ${order.total.toFixed(2)} jetzt bezahlen →
      </a>

      <p style="font-size:12px; color:#9e9e9e; margin-top:20px;">
        Bei Fragen: <a href="mailto:contact@prodigio.ch" style="color:#1a9e7a;">contact@prodigio.ch</a>
      </p>
    `),
  })
}

export async function sendPaymentConfirmationEmail(
  to: string,
  name: string,
  order: { orderNumber: string; total: number }
) {
  await sendMail({
    to,
    subject: `✅ Zahlung erhalten — Bestellung #${order.orderNumber} wird bearbeitet`,
    html: baseTemplate(`
      <h2>Vielen Dank — Zahlung erhalten!</h2>
      <p>Hallo ${name},</p>
      <p>Wir haben Ihre Zahlung für Bestellung <strong>#${order.orderNumber}</strong> erhalten.</p>

      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:16px 18px; margin:16px 0;">
        <strong style="color:#166534;">✓ Bezahlt: CHF ${order.total.toFixed(2)}</strong><br/>
        <span style="color:#15803d; font-size:13px;">Ihre Bestellung wird jetzt bearbeitet und baldmöglichst versandt.</span>
      </div>

      <p>Bei Fragen: <a href="mailto:contact@prodigio.ch" style="color:#1a9e7a;">contact@prodigio.ch</a></p>
      <a href="${APP_URL}/dashboard/orders" class="btn">Bestellung ansehen →</a>
    `),
  })
}

export async function sendAdminOrderPaidEmail(
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  total: number,
  orderId: string
) {
  await sendMail({
    to: ADMIN,
    subject: `💰 Bestellung #${orderNumber} bezahlt — bereit zur Bearbeitung`,
    html: baseTemplate(`
      <h2>Zahlung eingegangen</h2>
      <p>Bestellung <strong>#${orderNumber}</strong> wurde vollständig bezahlt.</p>
      <table>
        <tr><td><strong>Kunde:</strong></td><td>${customerName}</td></tr>
        <tr><td><strong>E-Mail:</strong></td><td>${customerEmail}</td></tr>
        <tr><td><strong>Betrag:</strong></td><td><strong>CHF ${total.toFixed(2)}</strong></td></tr>
      </table>
      <a href="${APP_URL}/admin/orders" class="btn">Im Admin ansehen →</a>
    `),
  })
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await sendMail({
    to,
    subject: 'Passwort zurücksetzen',
    html: baseTemplate(`
      <h2>Passwort zurücksetzen</h2>
      <p>Sie haben eine Passwort-Zurücksetzen-Anfrage gestellt. Klicken Sie auf den Button, um ein neues Passwort zu setzen:</p>
      <a href="${resetUrl}" class="btn">Passwort zurücksetzen →</a>
      <p style="color:#9e9e9e; font-size:12px;">Dieser Link ist 1 Stunde gültig. Wenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.</p>
    `),
  })
}
