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

export type PriceTier = { minQty: number; price: number }

/** Parse the priceTiers JSON column into a sorted, validated tier list. */
export function parseTiers(raw: unknown): PriceTier[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((t): t is PriceTier =>
      !!t && typeof t === 'object' &&
      Number.isFinite(Number((t as PriceTier).minQty)) &&
      Number.isFinite(Number((t as PriceTier).price)))
    .map(t => ({ minQty: Number(t.minQty), price: Number(t.price) }))
    .sort((a, b) => a.minQty - b.minQty)
}

/** Unit price for a quantity: the highest tier whose minQty is still <= qty.
 *  Falls back to basePrice when no tier qualifies (or none are defined). */
export function tierPrice(basePrice: number, tiers: PriceTier[], qty: number): number {
  let price = basePrice
  for (const t of tiers) {
    if (qty >= t.minQty) price = t.price
    else break
  }
  return price
}

export const SHIPPING_CARRIER = 'DPD / Palettenversand'
export const FREE_SHIPPING_THRESHOLD = 300
const PALETTE_COST = 85.00
const FLAT_RATE = 9.90

const DPD_BRACKETS: Array<{ maxKg: number; base: number }> = [
  { maxKg: 1,    base: 7.35 },
  { maxKg: 2,    base: 7.75 },
  { maxKg: 3,    base: 8.15 },
  { maxKg: 4,    base: 8.66 },
  { maxKg: 7,    base: 10.17 },
  { maxKg: 10.5, base: 12.48 },
]
const DPD_SURCHARGE = 1.133

function dpdCostForWeight(kg: number): number {
  if (kg <= 0) return 0
  const parcels = Math.ceil(kg / 10.5)
  const perParcel = kg / parcels
  const bracket = DPD_BRACKETS.find(b => perParcel <= b.maxKg) ?? DPD_BRACKETS[DPD_BRACKETS.length - 1]
  return Math.round(bracket.base * DPD_SURCHARGE * parcels * 100) / 100
}

export interface ShippingResult {
  cost: number
  label: string
  method: 'DPD' | 'PALETTE' | 'FREE'
  internalCost: number
}

export function calcShippingWeightBased(subtotal: number, totalWeightKg: number): ShippingResult {
  const dpd = dpdCostForWeight(totalWeightKg)
  const usePalette = dpd > PALETTE_COST
  const internalCost = usePalette ? PALETTE_COST : dpd
  const method = usePalette ? 'PALETTE' as const : 'DPD' as const

  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return { cost: 0, label: 'Gratisversand', method: 'FREE', internalCost }
  }
  return { cost: FLAT_RATE, label: method === 'PALETTE' ? 'Palettenversand' : 'DPD Paket', method, internalCost }
}

export function calcShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_RATE
}

export function shippingLabel(subtotal: number): string {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 'Gratisversand' : 'DPD Paket'
}

/** Swiss VAT rates */
export const VAT_RATE_FOOD     = 0.026  // Lebensmittel (reduzierter Satz)
export const VAT_RATE_STANDARD = 0.081  // Normalsatz
/** @deprecated Use VAT_RATE_STANDARD for non-food or VAT_RATE_FOOD for food */
export const VAT_RATE = VAT_RATE_STANDARD

/** Calculate tax for a single amount at the given rate */
export function calcTaxAtRate(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100
}

/** @deprecated — use calcTaxAtRate with the product's taxRate */
export function calcTax(amount: number): number {
  return calcTaxAtRate(amount, VAT_RATE_STANDARD)
}

/** Summarise tax across cart items: returns {food, standard} tax amounts.
 *  C&C products (supplierSource === 'migroweb') are Ex Works Italy — no Swiss VAT. */
export function calcCartTaxBreakdown(
  items: Array<{ total: number; taxRate?: number; supplierSource?: string }>,
  shipping: number,
): { food: number; standard: number; total: number } {
  let food = 0
  let standard = 0
  for (const item of items) {
    // Cash & Carry products from Italy: Ex Works — Swiss VAT does not apply
    if (item.supplierSource === 'migroweb') continue
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
  APPROVED: 'Freigegeben', REJECTED: 'Abgelehnt',
}
