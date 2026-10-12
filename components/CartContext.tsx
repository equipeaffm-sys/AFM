'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export interface CartItem {
  id: string
  title: string
  price_cents: number
  image: string
  quantity: number
  category?: string
}

interface CartContextType {
  cart: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalCount: number
  subtotalCents: number
  isHydrated: boolean
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  toggleCart: () => void
  openCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const LOCAL_STORAGE_KEY = 'lm_luxury_cart'

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load cart from localStorage on client side mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        setCart(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Error reading cart from localStorage', e)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cart))
      } catch (e) {
        console.error('Error saving cart to localStorage', e)
      }
    }
  }, [cart, isHydrated])

  const addItem = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const qtyToAdd = item.quantity || 1
    const previousQuantity = cart.find((cartItem) => cartItem.id === item.id)?.quantity || 0
    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === item.id)
      if (existingIndex > -1) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qtyToAdd,
        }
        return updated
      } else {
        return [...prev, { ...item, quantity: qtyToAdd }]
      }
    })
    toast.custom(
      (toastInstance) => (
        <div
          role="status"
          className="flex items-center gap-4 rounded-xl border border-[#8f8065]/40 bg-[#20211f] px-4 py-3 text-sm text-zinc-100 shadow-xl"
        >
          <span>{`"${item.title}" ajouté au panier.`}</span>
          <button
            type="button"
            onClick={() => {
              setCart((currentCart) => {
                const currentItem = currentCart.find((cartItem) => cartItem.id === item.id)
                if (!currentItem || currentItem.quantity <= previousQuantity) return currentCart

                const nextQuantity = Math.max(previousQuantity, currentItem.quantity - qtyToAdd)
                return nextQuantity === 0
                  ? currentCart.filter((cartItem) => cartItem.id !== item.id)
                  : currentCart.map((cartItem) =>
                      cartItem.id === item.id
                        ? { ...cartItem, quantity: nextQuantity }
                        : cartItem
                    )
              })
              toast.dismiss(toastInstance.id)
            }}
            className="shrink-0 font-semibold text-[#d6c8aa] underline underline-offset-2 hover:text-white"
          >
            Annuler
          </button>
        </div>
      ),
      {
        duration: 3000,
        position: 'bottom-right',
      }
    )
    setIsCartOpen(true)
  }

  const removeItem = (id: string) => {
    const itemToRemove = cart.find((i) => i.id === id)
    setCart((prev) => prev.filter((item) => item.id !== id))
    if (itemToRemove) {
      toast.error(`"${itemToRemove.title}" retiré du panier.`)
    }
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const toggleCart = () => {
    setIsCartOpen((prev) => !prev)
  }

  const openCart = () => {
    setIsCartOpen(true)
  }

  const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0)
  const subtotalCents = cart.reduce((acc, item) => acc + item.price_cents * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        subtotalCents,
        isHydrated,
        isCartOpen,
        setIsCartOpen,
        toggleCart,
        openCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
