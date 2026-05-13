import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/** Generate a unique order number: PD-YYYYMMDD-XXXX */
export function generateOrderNumber(): string {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `PD-${y}${m}${d}-${rand}`
}

/** Format CHF price */
export function formatPrice(amount: number | string): string {
  return `CHF ${Number(amount).toFixed(2)}`
}

/** Apply price group discount */
export function applyDiscount(price: number, priceGroup: string): number {
  const factors: Record<string, number> = { STANDARD: 1, PREMIUM: 0.9, VIP: 0.8 }
  return Math.round(price * (factors[priceGroup] ?? 1) * 100) / 100
}

/** Discount label */
export function discountLabel(priceGroup: string): string | null {
  const labels: Record<string, string> = { PREMIUM: '-10%', VIP: '-20%' }
  return labels[priceGroup] ?? null
}

/** Free shipping threshold */
export const FREE_SHIPPING_THRESHOLD = 300
export const SHIPPING_COST = 29.90
export const SHIPPING_CARRIER = 'DPD Tracking'

/** Swiss VAT rates */
export const VAT_RATE_FOOD     = 0.026  // Lebensmittel (reduzierter Satz)
export const VAT_RATE_STANDARD = 0.081  // Normalsatz
/** @deprecated Use VAT_RATE_STANDARD for non-food or VAT_RATE_FOOD for food */
export const VAT_RATE = VAT_RATE_STANDARD

export function calcShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
}

/** Calculate tax for a single amount at the given rate */
export function calcTaxAtRate(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100
}

/** @deprecated — use calcTaxAtRate with the product's taxRate */
export function calcTax(amount: number): number {
  return calcTaxAtRate(amount, VAT_RATE_STANDARD)
}

/** Summarise tax across cart items: returns {food, standard} tax amounts */
export function calcCartTaxBreakdown(
  items: Array<{ total: number; taxRate?: number }>,
  shipping: number,
): { food: number; standard: number; total: number } {
  let food = 0
  let standard = 0
  for (const item of items) {
    const rate = item.taxRate ?? VAT_RATE_STANDARD
    if (rate <= VAT_RATE_FOOD) {
      food += item.total * rate
    } else {
      standard += item.total * rate
    }
  }
  // Shipping is a service → Normalsatz 8.1%
  standard += shipping * VAT_RATE_STANDARD

  food     = Math.round(food * 100) / 100
  standard = Math.round(standard * 100) / 100
  return { food, standard, total: Math.round((food + standard) * 100) / 100 }
}

/** Truncate text */
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}

/** Status colors */
export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-800',
  CONFIRMED:  'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED:    'bg-indigo-100 text-indigo-800',
  DELIVERED:  'bg-green-100 text-green-800',
  CANCELLED:  'bg-red-100 text-red-800',
}

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  UNPAID:        'bg-red-100 text-red-800',
  PAID:          'bg-green-100 text-green-800',
  PARTIALLY_PAID:'bg-yellow-100 text-yellow-800',
  REFUNDED:      'bg-gray-100 text-gray-800',
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ausstehend', CONFIRMED: 'Bestätigt', PROCESSING: 'In Bearbeitung',
  SHIPPED: 'Versendet', DELIVERED: 'Geliefert', CANCELLED: 'Storniert',
  UNPAID: 'Unbezahlt', PAID: 'Bezahlt', PARTIALLY_PAID: 'Teilweise bezahlt', REFUNDED: 'Erstattet',
  STANDARD: 'Standard', PREMIUM: 'Premium (-10%)', VIP: 'VIP (-20%)',
  APPROVED: 'Freigegeben', REJECTED: 'Abgelehnt',
}
