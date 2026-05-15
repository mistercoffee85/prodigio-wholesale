import { DefaultSession } from 'next-auth'

// ── Extend NextAuth session ─────────────────────────────────────
declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role: string
      status: string
      priceGroup: string
      companyName: string | null
    }
  }
}

// ── Cart ─────────────────────────────────────────────────────────
export interface CartItem {
  productId: string     // real DB product ID
  cartKey: string       // unique key for cart (productId + variantLabel if any)
  variantLabel?: string // variant label for API price lookup
  name: string
  brand: string
  emoji: string
  image?: string
  bgGradient?: string | null
  unit: string
  moq: number
  quantity: number
  unitPrice: number   // already discounted price
  total: number
  taxRate?: number        // 0.026 Lebensmittel | 0.081 Normalsatz
  supplierSource?: string // 'migroweb' = Cash & Carry IT, undefined/null = local stock
}

export interface CartState {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'total'>) => void
  removeItem: (cartKey: string) => void
  updateQuantity: (cartKey: string, quantity: number) => void
  clearCart: () => void
  openSidebar: () => void
  closeSidebar: () => void
  itemCount: number
  subtotal: number
}

// ── API Responses ────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

// ── Product (client-safe) ────────────────────────────────────────
export interface ProductCard {
  id: string
  name: string
  slug: string
  brand: string
  emoji: string
  bgGradient: string | null
  price: number
  comparePrice: number | null
  unit: string
  moq: number
  stock: number
  badge: string | null
  categorySlug: string
  categoryName: string
}
