# PRO.DI.GIO Grosshandel — Setup Guide

## 1. Voraussetzungen

- Node.js 18+
- PostgreSQL Datenbank (Supabase empfohlen — kostenlos)
- Stripe Account (Schweiz)
- Gmail oder andere SMTP für E-Mails

---

## 2. Installation

```bash
cd /Users/devitagionatan/Documents/GitHub/prodigio-wholesale
npm install
```

---

## 3. Umgebungsvariablen

```bash
cp .env.example .env.local
```

Dann `.env.local` ausfüllen:

### Supabase (kostenlose Datenbank)
1. supabase.com → Neues Projekt erstellen
2. Settings → Database → Connection string → URI kopieren
3. In `.env.local` als `DATABASE_URL` einfügen

### NextAuth Secret
```bash
openssl rand -base64 32
```
Als `NEXTAUTH_SECRET` einfügen.

### Stripe
1. dashboard.stripe.com → Developers → API Keys
2. Test-Keys kopieren (sk_test_... / pk_test_...)
3. Für TWINT: Stripe Switzerland aktivieren

### E-Mail (Gmail)
1. Google Account → Sicherheit → 2-Schritt-Verifizierung
2. App-Passwörter → Neues App-Passwort erstellen
3. Als `SMTP_PASS` einfügen

---

## 4. Datenbank Setup

```bash
# Schema auf DB übertragen
npm run db:push

# Demo-Daten importieren (17 Produkte, Admin, Demo-Kunde)
npm run db:seed
```

---

## 5. Dev-Server starten

```bash
npm run dev
```

→ http://localhost:3000

---

## 6. Login-Daten (nach Seed)

| Rolle   | E-Mail                       | Passwort   |
|---------|------------------------------|------------|
| Admin   | gionatan.devita@gmail.com    | Admin123!  |
| Kunde   | demo@kunde.ch                | Demo123!   |

---

## 7. Stripe Webhook (Lokal testen)

```bash
# Stripe CLI installieren
brew install stripe/stripe-cli/stripe

# Webhook weiterleiten
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Den `whsec_...` Key in `.env.local` als `STRIPE_WEBHOOK_SECRET` einfügen.

---

## 8. Produktion (Vercel)

```bash
npm install -g vercel
vercel

# Alle Env-Variablen im Vercel Dashboard eintragen
# Domain: wholesale.prodigio.ch → CNAME auf vercel
```

---

## 9. Systemübersicht

```
/                         → Shop-Startseite
/products                 → Produktkatalog (mit Filter)
/login                    → B2B Login
/register                 → B2B Registrierung
/checkout                 → Kasse (Stripe + Banküberweisung)
/checkout/success         → Bestellbestätigung
/dashboard                → Kundenbereich (Bestellungen)
/admin                    → Admin Dashboard
/admin/customers          → Kundenverwaltung (Freigabe)
/admin/orders             → Bestellverwaltung
/admin/products           → Produktverwaltung

API:
POST /api/auth/register   → Registrierung
GET  /api/products        → Produkte (mit Preisgruppe)
POST /api/checkout        → Bestellung aufgeben
POST /api/webhooks/stripe → Stripe Webhook
POST /api/admin/customers → Kunde freigeben/ablehnen
```

---

## 10. B2B Workflow

1. Kunde registriert sich → Status: PENDING
2. Admin erhält E-Mail → /admin/customers
3. Admin gibt frei (Standard / Premium / VIP)
4. Kunde erhält Freigabe-Mail
5. Kunde bestellt → Preise je nach Gruppe:
   - STANDARD: Normalpreis
   - PREMIUM: -10%
   - VIP: -20% (für ALDI, Coop, etc.)
6. Zahlung: Karte, TWINT oder Banküberweisung
7. Admin verwaltet Status in /admin/orders
