/**
 * Mondu B2B BNPL Integration
 * Docs: https://docs.mondu.ai
 *
 * Environment variables required:
 *   MONDU_API_KEY       — from Mondu Dashboard (Sandbox + Production)
 *   MONDU_WEBHOOK_SECRET — from Mondu Dashboard (for webhook signature verification)
 *   MONDU_SANDBOX       — 'true' for sandbox, omit for production
 */

const MONDU_BASE = process.env.MONDU_SANDBOX === 'true'
  ? 'https://api.sandbox.mondu.ai/api/v1'
  : 'https://api.mondu.ai/api/v1'

function getHeaders() {
  const key = process.env.MONDU_API_KEY
  if (!key) throw new Error('MONDU_API_KEY nicht gesetzt')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`,
  }
}

export interface MonduBuyer {
  email:        string
  first_name:   string
  last_name:    string
  company_name: string
  phone?:       string
  address: {
    line1:        string
    city:         string
    country_code: string   // 'CH', 'DE', 'AT'
    zip_code:     string
  }
}

export interface MonduLineItem {
  title:          string
  net_price_per_item_cents: number  // in Rappen (CHF × 100)
  quantity:       number
  item_type:      string
  external_reference_id?: string
}

export interface MonduOrderPayload {
  currency:     string  // 'CHF'
  state_flow:   'mondu_checkout' | 'direct_debit_checkout'
  buyer:        MonduBuyer
  lines:        MonduLineItem[]
  gross_amount_cents:   number  // total incl. MwSt + Versand, in Rappen
  tax_cents:            number  // MwSt in Rappen
  external_reference_id: string  // your order number
  success_url:  string
  decline_url:  string
  cancel_url:   string
}

export interface MonduOrderResponse {
  order: {
    uuid:            string
    state:           'created' | 'confirmed' | 'declined' | 'pending'
    external_reference_id: string
    hosted_checkout_url: string  // redirect buyer here
    authorized_net_terms: number  // e.g. 30 (days)
  }
}

/**
 * Create a Mondu order — returns hosted_checkout_url to redirect the buyer.
 * Mondu performs instant credit check during checkout.
 */
export async function createMonduOrder(payload: MonduOrderPayload): Promise<MonduOrderResponse> {
  const res = await fetch(`${MONDU_BASE}/orders`, {
    method:  'POST',
    headers: getHeaders(),
    body:    JSON.stringify({ order: payload }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Mondu API Fehler ${res.status}: ${JSON.stringify(err)}`)
  }

  return res.json()
}

/**
 * Get order status from Mondu
 */
export async function getMonduOrder(uuid: string): Promise<MonduOrderResponse> {
  const res = await fetch(`${MONDU_BASE}/orders/${uuid}`, {
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error(`Mondu order fetch failed: ${res.status}`)
  return res.json()
}

/**
 * Verify Mondu webhook signature
 * Mondu sends X-Mondu-Signature header with HMAC-SHA256 of the raw body
 */
export function verifyMonduWebhook(rawBody: string, signature: string): boolean {
  const secret = process.env.MONDU_WEBHOOK_SECRET
  if (!secret) return false

  const crypto = require('crypto')
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  return expected === signature
}
