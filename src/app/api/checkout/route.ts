import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { stripe, toStripeAmount } from '@/lib/stripe'
import { generateOrderNumber, calcShipping, calcCartTaxBreakdown, applyDiscount } from '@/lib/utils'
import { sendOrderConfirmationEmail } from '@/lib/email'

const itemSchema = z.object({
  productId:    z.string(),
  quantity:     z.number().int().positive(),
  variantLabel: z.string().optional(),
})

const schema = z.object({
  items:          z.array(itemSchema).min(1),
  paymentMethod:  z.enum(['STRIPE_CARD', 'STRIPE_TWINT', 'STRIPE_PAYPAL', 'BANK_TRANSFER']),
  shippingOption:      z.enum(['PRODIGIO_DELIVERS', 'SELF_PICKUP', 'LOCAL_PICKUP', 'LOCAL_DELIVERY']).default('LOCAL_DELIVERY'),
  shippingOptionLocal: z.enum(['LOCAL_PICKUP', 'LOCAL_DELIVERY']).optional(), // only for mixed carts
  notes:          z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await req.json()
    const { items, paymentMethod, shippingOption, shippingOptionLocal, notes } = schema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: true },
    })
    if (!user || user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Konto nicht freigegeben' }, { status: 403 })
    }

    const priceGroup = user.company?.priceGroup ?? 'STANDARD'

    // Fetch and validate products
    const productIds = items.map(i => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'Ein oder mehrere Produkte nicht gefunden' }, { status: 400 })
    }

    // Validate MOQ and stock
    for (const item of items) {
      const product = products.find(p => p.id === item.productId)!
      if (item.quantity < product.moq) {
        return NextResponse.json({
          error: `Mindestbestellmenge für ${product.name}: ${product.moq} VE`
        }, { status: 400 })
      }
      if (item.quantity > product.stock) {
        return NextResponse.json({
          error: `Nicht genug Lagerbestand für ${product.name}`
        }, { status: 400 })
      }
    }

    // Calculate totals
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.productId)!

      let unitPrice: number
      if (item.variantLabel) {
        // Look up price from variant JSON (structure: [{label, price, unit, moq, packCount?}])
        const variants = (product.variants as Array<{ label: string; price: number; packCount?: number }>) ?? []
        const variant = variants.find(v => v.label === item.variantLabel)
        if (!variant) {
          throw new Error(`Variante "${item.variantLabel}" für ${product.name} nicht gefunden`)
        }
        // packCount multiplies the per-pack price to get total per VE
        unitPrice = variant.price * (variant.packCount ?? 1)
      } else {
        unitPrice = applyDiscount(Number(product.price), priceGroup)
      }

      return {
        productId:      item.productId,
        quantity:       item.quantity,
        unitPrice,
        total:          Math.round(unitPrice * item.quantity * 100) / 100,
        taxRate:        Number(product.taxRate),
        supplierSource: product.supplierSource ?? undefined,  // 'migroweb' = Ex Works IT, no CH VAT
        unit:           product.unit ?? '',                   // VE 1:1 from Migroweb
        productName:    product.name,                         // snapshot at order time
        productSku:     product.supplierSku ?? '',            // Migroweb SKU for re-order
      }
    })

    const subtotal   = orderItems.reduce((s, i) => s + i.total, 0)
    // Shipping: 0 for self-pickup; for Prodigio delivery it's set by admin later
    const shipping   = shippingOption === 'SELF_PICKUP' ? 0 : 0
    const taxBreak   = calcCartTaxBreakdown(orderItems, shipping)
    const tax        = taxBreak.total
    const total      = Math.round((subtotal + shipping + tax) * 100) / 100
    // Transport cost is pending when Prodigio organises any logistics leg
    const shippingPending = shippingOption === 'PRODIGIO_DELIVERS'
      || shippingOption === 'LOCAL_DELIVERY'
      || shippingOptionLocal === 'LOCAL_DELIVERY'

    const orderNumber = generateOrderNumber()
    // Vorauskasse: 3 Werktage Zahlungsziel
    const dueDate = paymentMethod === 'BANK_TRANSFER'
      ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      : null

    // ── Create order in DB ───────────────────────────────────────
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId:          user.id,
        paymentMethod:   paymentMethod as any,
        shippingOption:      shippingOption as any,
        shippingOptionLocal: shippingOptionLocal as any ?? null,
        shippingPending,
        status:          'PENDING',
        paymentStatus:   'UNPAID',
        subtotal,
        tax,
        shippingCost:    shipping,
        total,
        notes,
        dueDate,
        items: {
          create: orderItems.map(i => ({
            productId:   i.productId,
            quantity:    i.quantity,
            unitPrice:   i.unitPrice,
            total:       i.total,
            unit:        i.unit,
            productName: i.productName,
            productSku:  i.productSku,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    })

    // ── Stripe Payment (card / TWINT) ─────────────────────────────
    if (paymentMethod === 'STRIPE_CARD' || paymentMethod === 'STRIPE_TWINT' || paymentMethod === 'STRIPE_PAYPAL') {
      const paymentMethods = paymentMethod === 'STRIPE_TWINT' ? ['twint'] : paymentMethod === 'STRIPE_PAYPAL' ? ['paypal'] : ['card']

      const paymentIntent = await stripe.paymentIntents.create({
        amount:   toStripeAmount(total),
        currency: 'chf',
        payment_method_types: paymentMethods,
        metadata: { orderId: order.id, orderNumber },
      })

      await prisma.order.update({
        where: { id: order.id },
        data:  { stripePaymentId: paymentIntent.id },
      })

      return NextResponse.json({
        orderId:      order.id,
        orderNumber,
        clientSecret: paymentIntent.client_secret,
        type:         'stripe',
      })
    }

    // ── Bank Transfer / Net30 → confirm immediately ───────────────
    await prisma.order.update({
      where: { id: order.id },
      data:  { status: 'CONFIRMED' },
    })

    // Update stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data:  { stock: { decrement: item.quantity } },
      })
    }

    // Send confirmation email
    sendOrderConfirmationEmail(user.email, user.name, {
      orderNumber,
      total,
      paymentMethod,
      shippingOption,
      shippingOptionLocal,
      items: order.items.map(i => ({
        name:      i.product.name,
        quantity:  i.quantity,
        unitPrice: Number(i.unitPrice),
        unit:      (i as any).unit      || i.product.unit || '',
        sku:       (i as any).productSku || i.product.supplierSku || '',
      })),
    }).catch(console.error)

    return NextResponse.json({ orderId: order.id, orderNumber, type: 'manual' })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }
    if (err instanceof Error && err.message.startsWith('Variante')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('[checkout]', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
