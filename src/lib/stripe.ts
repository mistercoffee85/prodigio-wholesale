import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
})

export const STRIPE_CONFIG = {
  currency: 'chf',
  // TWINT is available via Stripe for Swiss merchants
  paymentMethods: ['card', 'twint'],
}

/**
 * Calculate discounted price based on customer price group
 */
export function getPricedAmount(basePrice: number, priceGroup: string): number {
  const discounts: Record<string, number> = {
    STANDARD: 1.0,
    PREMIUM:  0.90, // -10%
    VIP:      0.80, // -20%
  }
  const factor = discounts[priceGroup] ?? 1.0
  return Math.round(basePrice * factor * 100) / 100
}

/**
 * Convert CHF decimal to Stripe cents (Rappen)
 */
export function toStripeAmount(chf: number): number {
  return Math.round(chf * 100)
}
