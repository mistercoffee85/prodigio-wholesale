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
 * Convert CHF decimal to Stripe cents (Rappen)
 */
export function toStripeAmount(chf: number): number {
  return Math.round(chf * 100)
}
