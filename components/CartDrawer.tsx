'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, Trash2, Plus, Minus, ShoppingBag, ImageOff, LockKeyhole } from 'lucide-react'
import { useCart } from './CartContext'
import { useCurrency } from './CurrencyContext'
import { useLanguage } from './LanguageContext'
import toast from 'react-hot-toast'

export const CartDrawer: React.FC = () => {
  const [checkoutEnabled, setCheckoutEnabled] = useState(false)
  const [checkoutStatusError, setCheckoutStatusError] = useState(false)
  const [isStartingCheckout, setIsStartingCheckout] = useState(false)
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeItem,
    subtotalCents,
    totalCount,
  } = useCart()

  const { formatPrice, currency } = useCurrency()
  const { t } = useLanguage()

  useEffect(() => {
    if (!isCartOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsCartOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isCartOpen, setIsCartOpen])

  useEffect(() => {
    if (!isCartOpen || cart.length === 0) return
    const controller = new AbortController()

    fetch('/api/checkout', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Impossible de vérifier la disponibilité du paiement.')
        const result: unknown = await response.json()
        if (typeof result !== 'object' || result === null || !('enabled' in result)) {
          throw new Error('Réponse de disponibilité du paiement invalide.')
        }
        setCheckoutEnabled(result.enabled === true)
        setCheckoutStatusError(false)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        console.error('Unable to check Stripe Checkout availability:', error)
        setCheckoutEnabled(false)
        setCheckoutStatusError(true)
      })

    return () => controller.abort()
  }, [isCartOpen, cart.length])

  const startCheckout = async () => {
    setIsStartingCheckout(true)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(({ id, quantity }) => ({ id, quantity })),
        }),
      })
      const result: unknown = await response.json()
      if (
        !response.ok ||
        typeof result !== 'object' ||
        result === null ||
        !('url' in result) ||
        typeof result.url !== 'string'
      ) {
        const message =
          typeof result === 'object' &&
          result !== null &&
          'error' in result &&
          typeof result.error === 'string'
            ? result.error
            : 'Impossible de démarrer le paiement.'
        throw new Error(message)
      }
      window.location.assign(result.url)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Impossible de démarrer le paiement.'
      toast.error(message)
    } finally {
      setIsStartingCheckout(false)
    }
  }

  if (!isCartOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop with Backdrop Blur */}
      <div
        className="cart-backdrop fixed inset-0 bg-black/75 backdrop-blur-md"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-4 sm:pl-10">
        <section
          role="dialog"
          aria-modal="true"
          aria-label={t.cartTitle}
          className="cart-panel flex w-screen max-w-md flex-col border-l border-white/[0.08] bg-[#20211f] text-zinc-200 shadow-2xl"
        >
          {/* Drawer Header */}
          <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-[#242523]">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-[#b6a17d]" />
              <h2 className="font-serif text-xl font-medium tracking-wide text-zinc-100">
                {t.cartTitle} ({totalCount})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-lg text-zinc-400 hover:text-[#c2b18f] hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-zinc-500">
                <ShoppingBag className="w-12 h-12 text-zinc-600" />
                <p className="font-serif text-base text-zinc-300">{t.emptyCart}</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-[#665d4d] text-[#eeeae2] hover:bg-[#77705f] text-xs font-semibold uppercase tracking-widest rounded-lg transition-all"
                >
                  {t.continueShopping}
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 bg-[#252623] p-4 rounded-xl border border-white/[0.08] shadow-sm transition-all hover:border-[#8f8065]/60"
                >
                  <div className="relative w-20 h-20 bg-[#30312e] rounded-lg overflow-hidden shrink-0 border border-white/[0.08]">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-500">
                        <ImageOff className="h-5 w-5" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-serif text-sm font-medium text-zinc-200 line-clamp-1">
                          {item.title}
                        </h3>
                        {item.category && (
                          <span className="text-[10px] text-[#b6a17d] uppercase tracking-wider font-semibold">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-zinc-400 hover:text-red-600 transition-colors p-1"
                        title="Supprimer l'article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-2 bg-[#1b1c1b] px-2 py-1 rounded-lg border border-white/[0.08]">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="text-zinc-400 hover:text-[#c2b18f] p-0.5"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono font-semibold px-2 text-zinc-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="text-zinc-400 hover:text-[#c2b18f] p-0.5"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-sm font-serif font-semibold text-[#c2b18f]">
                        {formatPrice(item.price_cents * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer / Summary */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-white/[0.08] bg-[#242523] space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>{t.subtotal}</span>
                  <span className="font-mono text-zinc-200 font-medium">
                    {formatPrice(subtotalCents)}
                  </span>
                </div>
                <div className="border-t border-white/[0.08] pt-3 flex justify-between text-sm font-semibold text-zinc-200">
                  <span>Sous-total</span>
                  <span className="font-serif text-lg text-[#c2b18f]">
                    {formatPrice(subtotalCents)}
                  </span>
                </div>
              </div>

              <div className="border-t border-white/[0.08] pt-3 text-center text-xs text-zinc-400">
                {currency !== 'EUR'
                  ? 'Le paiement sécurisé est actuellement disponible en euros uniquement.'
                  : checkoutStatusError
                    ? 'La disponibilité du paiement ne peut pas être vérifiée pour le moment.'
                    : checkoutEnabled
                      ? 'Le paiement sécurisé est assuré par Stripe. Les moyens disponibles dépendent de votre pays et de la configuration du compte.'
                      : 'Le paiement en ligne sera ouvert après la configuration de Stripe et des conditions de livraison.'}
              </div>

              <button
                type="button"
                onClick={startCheckout}
                disabled={!checkoutEnabled || currency !== 'EUR' || isStartingCheckout}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#b6a17d] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-zinc-950 transition-colors hover:bg-[#c2b18f] disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                {isStartingCheckout
                  ? 'Préparation du paiement…'
                  : checkoutEnabled && currency === 'EUR'
                    ? 'Payer en toute sécurité'
                    : 'Paiement bientôt disponible'}
              </button>
              {checkoutEnabled && currency === 'EUR' && (
                <p className="text-center text-[10px] text-zinc-500">
                  Vous serez redirigé vers le paiement sécurisé Stripe.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
