'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type Currency = 'EUR' | 'USD' | 'GBP'

interface CurrencyContextType {
  currency: Currency
  setCurrency: (c: Currency) => void
  formatPrice: (priceCents: number) => string
}

// Fixed exchange rates relative to base EUR
const RATES: Record<Currency, { rate: number; symbol: string; locale: string }> = {
  EUR: { rate: 1.0, symbol: '€', locale: 'fr-FR' },
  USD: { rate: 1.08, symbol: '$', locale: 'en-US' },
  GBP: { rate: 0.85, symbol: '£', locale: 'en-GB' },
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('EUR')

  useEffect(() => {
    const saved = localStorage.getItem('lm_currency') as Currency
    if (saved && RATES[saved]) {
      setCurrencyState(saved)
    }
  }, [])

  const setCurrency = (c: Currency) => {
    setCurrencyState(c)
    localStorage.setItem('lm_currency', c)
  }

  const formatPrice = (priceCentsEUR: number): string => {
    const config = RATES[currency] || RATES.EUR
    // Exact cent precision conversion
    const convertedAmount = (priceCentsEUR * config.rate) / 100
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(convertedAmount)
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
