'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ScrollUtilities() {
  const [progress, setProgress] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    let frame = 0

    const updateScrollState = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        const scrollableHeight =
          document.documentElement.scrollHeight - window.innerHeight
        const scrollY = window.scrollY
        setProgress(scrollableHeight > 0 ? Math.min(scrollY / scrollableHeight, 1) : 0)
        setShowBackToTop(scrollY > window.innerHeight)
        frame = 0
      })
    }

    updateScrollState()
    window.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)

    return () => {
      window.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  const scrollToTop = () => {
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth'
    window.scrollTo({ top: 0, behavior })
  }

  return (
    <>
      <div
        role="progressbar"
        aria-label="Progression de lecture"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        className="reading-progress fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-[#b6a17d] shadow-[0_0_10px_rgba(182,161,125,0.4)]"
        style={{ transform: `scaleX(${progress})` }}
      />
      <button
        type="button"
        aria-label="Retour en haut"
        title="Retour en haut"
        onClick={scrollToTop}
        className={`motion-link fixed bottom-24 right-5 z-[45] flex h-11 w-11 items-center justify-center rounded-full border border-[#b6a17d]/35 bg-[#20211f]/90 text-[#d4c6a8] shadow-lg shadow-black/25 backdrop-blur-xl transition-all duration-300 hover:border-[#b6a17d]/70 hover:bg-[#2a2b27] ${
          showBackToTop
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        <ArrowUp className="h-4 w-4" aria-hidden="true" />
      </button>
    </>
  )
}
