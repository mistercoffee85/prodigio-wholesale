import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM = process.env.EMAIL_FROM ?? 'PRO.DI.GIO Grosshandel <wholesale@prodigio.ch>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

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
      PRO.DI.GIO GmbH · Dreispitz, 4142 Basel · wholesale@prodigio.ch · +41 61 212 34 56<br/>
      <a href="${APP_URL}" style="color:#1a9e7a;">wholesale.prodigio.ch</a>
    </div>
  </div>
</body>
</html>`
}

// ── Email Templates ─────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string, companyName: string) {
  await transporter.sendMail({
    from: FROM, to,
    subject: 'Ihre Registrierung bei PRO.DI.GIO Grosshandel',
    html: baseTemplate(`
      <h2>Willkommen, ${name}!</h2>
      <p>Vielen Dank für Ihre Registrierung als B2B-Kunde bei PRO.DI.GIO Grosshandel.</p>
      <p>Ihr Konto für <strong>${companyName}</strong> wird momentan von unserem Team geprüft. Sie erhalten innerhalb von 1 Werktag eine Bestätigung.</p>
      <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung:</p>
      <a href="mailto:wholesale@prodigio.ch" class="btn">Kontakt aufnehmen</a>
      <p style="color:#9e9e9e; font-size:13px;">PRO.DI.GIO GmbH · Basel, Schweiz</p>
    `),
  })
}

export async function sendApprovalEmail(to: string, name: string) {
  await transporter.sendMail({
    from: FROM, to,
    subject: '✅ Ihr B2B-Konto wurde freigegeben',
    html: baseTemplate(`
      <h2>Ihr Konto ist aktiv!</h2>
      <p>Hallo ${name},</p>
      <p>Ihr B2B-Konto wurde erfolgreich von unserem Team geprüft und <span class="badge badge-green">freigegeben</span>.</p>
      <p>Sie können sich jetzt anmelden und unser komplettes Sortiment zu Grosshandelspreisen bestellen.</p>
      <a href="${APP_URL}/login" class="btn">Jetzt einloggen →</a>
      <p>Bei Fragen: <a href="mailto:wholesale@prodigio.ch" style="color:#1a9e7a;">wholesale@prodigio.ch</a></p>
    `),
  })
}

export async function sendRejectionEmail(to: string, name: string) {
  await transporter.sendMail({
    from: FROM, to,
    subject: 'Ihre Registrierung bei PRO.DI.GIO',
    html: baseTemplate(`
      <h2>Hallo ${name}</h2>
      <p>Leider können wir Ihre Registrierung aktuell nicht genehmigen.</p>
      <p>Für weitere Informationen kontaktieren Sie uns bitte direkt:</p>
      <a href="mailto:wholesale@prodigio.ch" class="btn">E-Mail senden</a>
    `),
  })
}

export async function sendAdminNewCustomerEmail(customerName: string, companyName: string, email: string) {
  await transporter.sendMail({
    from: FROM,
    to: process.env.SMTP_USER ?? 'gionatan.devita@gmail.com',
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
  order: { orderNumber: string; total: number; paymentMethod: string; items: Array<{ name: string; quantity: number; unitPrice: number }> }
) {
  const itemRows = order.items.map(i => `
    <tr>
      <td>${i.name}</td>
      <td style="text-align:center">${i.quantity}x</td>
      <td style="text-align:right">CHF ${(i.unitPrice * i.quantity).toFixed(2)}</td>
    </tr>
  `).join('')

  const paymentLabel: Record<string, string> = {
    STRIPE_CARD: 'Kreditkarte',
    STRIPE_TWINT: 'TWINT',
    BANK_TRANSFER: 'Banküberweisung',
    NET_30: 'Rechnung (Net 30)',
  }

  await transporter.sendMail({
    from: FROM, to,
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
      ${order.paymentMethod === 'BANK_TRANSFER' ? `
        <div style="background:#f8f8f8; padding:16px; border-radius:8px; margin:16px 0;">
          <strong>Bankdaten für Überweisung:</strong><br/>
          IBAN: CH56 0483 5012 3456 7800 9<br/>
          Bank: UBS Basel<br/>
          Zahlungsreferenz: <strong>#${order.orderNumber}</strong>
        </div>
      ` : ''}
      <a href="${APP_URL}/dashboard/orders" class="btn">Bestellung ansehen →</a>
    `),
  })
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await transporter.sendMail({
    from: FROM, to,
    subject: 'Passwort zurücksetzen',
    html: baseTemplate(`
      <h2>Passwort zurücksetzen</h2>
      <p>Sie haben eine Passwort-Zurücksetzen-Anfrage gestellt. Klicken Sie auf den Button, um ein neues Passwort zu setzen:</p>
      <a href="${resetUrl}" class="btn">Passwort zurücksetzen →</a>
      <p style="color:#9e9e9e; font-size:12px;">Dieser Link ist 1 Stunde gültig. Wenn Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.</p>
    `),
  })
}
