'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

interface SavedProductsContextValue {
  favoriteIds: string[]
  recentlyViewedIds: string[]
  isHydrated: boolean
  toggleFavorite: (productId: string) => void
  markViewed: (productId: string) => void
}

const FAVORITES_KEY = 'lm_favorite_products'
const RECENTLY_VIEWED_KEY = 'lm_recently_viewed_products'
const MAX_RECENT_PRODUCTS = 12
const SavedProductsContext = createContext<SavedProductsContextValue | null>(null)

function readIds(key: string, maximum: number): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || '[]')
    if (!Array.isArray(value)) return []
    return Array.from(new Set(value.filter((id): id is string => typeof id === 'string' && id.length <= 80)))
      .slice(0, maximum)
  } catch (error) {
    console.error(`Unable to read saved product list "${key}":`, error)
    return []
  }
}

export function SavedProductsProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setFavoriteIds(readIds(FAVORITES_KEY, 100))
    setRecentlyViewedIds(readIds(RECENTLY_VIEWED_KEY, MAX_RECENT_PRODUCTS))
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds))
    } catch (error) {
      console.error('Unable to save favorite products:', error)
    }
  }, [favoriteIds, isHydrated])

  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recentlyViewedIds))
    } catch (error) {
      console.error('Unable to save recently viewed products:', error)
    }
  }, [recentlyViewedIds, isHydrated])

  const toggleFavorite = useCallback((productId: string) => {
    setFavoriteIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [productId, ...current].slice(0, 100)
    )
  }, [])

  const markViewed = useCallback((productId: string) => {
    setRecentlyViewedIds((current) =>
      [productId, ...current.filter((id) => id !== productId)].slice(0, MAX_RECENT_PRODUCTS)
    )
  }, [])

  const value = useMemo(
    () => ({ favoriteIds, recentlyViewedIds, isHydrated, toggleFavorite, markViewed }),
    [favoriteIds, recentlyViewedIds, isHydrated, toggleFavorite, markViewed]
  )

  return <SavedProductsContext.Provider value={value}>{children}</SavedProductsContext.Provider>
}

export function useSavedProducts() {
  const context = useContext(SavedProductsContext)
  if (!context) throw new Error('useSavedProducts must be used within a SavedProductsProvider')
  return context
}
