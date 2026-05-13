'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEffect, useState } from 'react'
import { CartItem, CartState } from '@/types'
import { calcShipping, calcCartTaxBreakdown } from '@/lib/utils'

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openSidebar:  () => set({ isOpen: true }),
      closeSidebar: () => set({ isOpen: false }),

      addItem: (item) => {
        set(state => {
          const key = item.cartKey
          const existing = state.items.find(i => i.cartKey === key)
          if (existing) {
            return {
              isOpen: true,
              items: state.items.map(i =>
                i.cartKey === key
                  ? { ...i, quantity: i.quantity + item.quantity, total: (i.quantity + item.quantity) * i.unitPrice }
                  : i
              ),
            }
          }
          return {
            isOpen: true,
            items: [...state.items, { ...item, total: item.quantity * item.unitPrice }],
          }
        })
      },

      removeItem: (cartKey) =>
        set(state => ({ items: state.items.filter(i => i.cartKey !== cartKey) })),

      updateQuantity: (cartKey, quantity) =>
        set(state => ({
          items: state.items.map(i =>
            i.cartKey === cartKey
              ? { ...i, quantity, total: quantity * i.unitPrice }
              : i
          ),
        })),

      clearCart: () => set({ items: [] }),

      get itemCount() { return get().items.reduce((s, i) => s + i.quantity, 0) },
      get subtotal() { return get().items.reduce((s, i) => s + i.total, 0) },
    }),
    {
      name: 'prodigio-cart',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        // v1 → v2: add cartKey field (was missing, causing checkout to fail)
        if (version < 2) {
          const state = persistedState as { items: CartItem[] }
          state.items = (state.items ?? []).map(item => ({
            ...item,
            cartKey: item.cartKey ?? item.productId,
          }))
        }
        return persistedState as CartState
      },
    }
  )
)

export function useCartTotals() {
  const items = useCartStore(s => s.items)
  const subtotal  = items.reduce((s, i) => s + i.total, 0)
  const shipping  = calcShipping(subtotal)
  const taxBreak  = calcCartTaxBreakdown(items, shipping)
  const tax       = taxBreak.total
  const total     = Math.round((subtotal + shipping + tax) * 100) / 100
  return { subtotal, shipping, tax, taxFood: taxBreak.food, taxStandard: taxBreak.standard, total }
}

/**
 * Returns true once the zustand persist store has rehydrated from localStorage.
 * Use this on pages that read cart state to avoid showing an empty cart on hard navigation.
 */
export function useCartHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    // If already hydrated (SPA nav), resolve immediately; otherwise wait for rehydration
    const unsub = useCartStore.persist.onFinishHydration(() => setHydrated(true))
    // Check if already rehydrated (e.g. SPA navigation)
    if (useCartStore.persist.hasHydrated()) setHydrated(true)
    return unsub
  }, [])
  return hydrated
}
