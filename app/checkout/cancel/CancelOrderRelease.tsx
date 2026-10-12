'use client'

import { useEffect, useState } from 'react'

export default function CancelOrderRelease({ orderId }: { orderId?: string }) {
  const [releaseError, setReleaseError] = useState(false)

  useEffect(() => {
    if (!orderId) return

    fetch('/api/checkout/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const result: unknown = await response.json()
          const message =
            typeof result === 'object' &&
            result !== null &&
            'error' in result &&
            typeof result.error === 'string'
              ? result.error
              : 'Impossible de libérer la réservation du panier.'
          throw new Error(message)
        }
      })
      .catch((error: unknown) => {
        console.error('Unable to release cancelled checkout reservation:', error)
        setReleaseError(true)
      })
  }, [orderId])

  return releaseError ? (
    <p role="status" className="text-sm text-amber-300">
      Le paiement n’a pas été débité, mais la libération du stock réservé est en attente.
    </p>
  ) : null
}
