'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => unknown
}

export default function PageTransitions({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return

      const target = event.target instanceof Element ? event.target : null
      const link = target?.closest<HTMLAnchorElement>('a[href]')
      if (
        !link ||
        link.target ||
        link.hasAttribute('download') ||
        link.dataset.noPageTransition !== undefined
      ) return

      const destination = new URL(link.href, window.location.href)
      if (
        destination.origin !== window.location.origin ||
        destination.pathname === window.location.pathname && destination.search === window.location.search
      ) return

      const nextUrl = `${destination.pathname}${destination.search}${destination.hash}`
      const documentWithTransitions = document as ViewTransitionDocument
      if (!documentWithTransitions.startViewTransition) return

      event.preventDefault()
      documentWithTransitions.startViewTransition(() => router.push(nextUrl))
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [router])

  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  )
}
