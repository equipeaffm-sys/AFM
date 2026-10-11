'use client'

import { useEffect, useRef } from 'react'

export default function InteractiveEffects() {
  const glowRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const glow = glowRef.current
    const cursor = cursorRef.current
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!glow || !cursor || !finePointer.matches || reducedMotion.matches) return

    let frame = 0
    let pointerX = 0
    let pointerY = 0
    let activeCard: HTMLElement | null = null
    let activeTarget: Element | null = null

    document.body.classList.add('has-custom-cursor')

    const update = () => {
      glow.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`
      let cursorX = pointerX
      let cursorY = pointerY
      if (activeTarget) {
        const rect = activeTarget.getBoundingClientRect()
        const targetX = rect.left + rect.width / 2
        const targetY = rect.top + rect.height / 2
        const distance = Math.hypot(targetX - pointerX, targetY - pointerY)
        const strength = Math.min(0.16, 7 / Math.max(distance, 1))
        cursorX += (targetX - pointerX) * strength
        cursorY += (targetY - pointerY) * strength
      }
      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`
      frame = 0
    }

    const handlePointerMove = (event: PointerEvent) => {
      pointerX = event.clientX
      pointerY = event.clientY

      const target = event.target instanceof Element ? event.target : null
      activeTarget = target?.closest('a, button, input, select, [role="button"]') || null
      cursor.classList.toggle('is-interactive', Boolean(activeTarget))
      const card = target?.closest<HTMLElement>('.motion-card') || null
      if (activeCard !== card) {
        activeCard?.classList.remove('is-tilting')
        activeCard?.style.removeProperty('--tilt-x')
        activeCard?.style.removeProperty('--tilt-y')
        activeCard?.style.removeProperty('--shine-x')
        activeCard?.style.removeProperty('--shine-y')
        activeCard = card
      }

      if (card) {
        const rect = card.getBoundingClientRect()
        const horizontal = rect.width ? (event.clientX - rect.left) / rect.width : 0.5
        const vertical = rect.height ? (event.clientY - rect.top) / rect.height : 0.5
        card.style.setProperty('--tilt-x', `${(0.5 - vertical) * 3.5}deg`)
        card.style.setProperty('--tilt-y', `${(horizontal - 0.5) * 3.5}deg`)
        card.style.setProperty('--shine-x', `${horizontal * 100}%`)
        card.style.setProperty('--shine-y', `${vertical * 100}%`)
        card.classList.add('is-tilting')
      }

      glow.classList.toggle('is-interactive', Boolean(activeTarget))
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    const resetCard = () => {
      activeCard?.classList.remove('is-tilting')
      activeCard?.style.removeProperty('--tilt-x')
      activeCard?.style.removeProperty('--tilt-y')
      activeCard?.style.removeProperty('--shine-x')
      activeCard?.style.removeProperty('--shine-y')
      activeCard = null
      activeTarget = null
      glow.classList.remove('is-interactive')
      cursor.classList.remove('is-interactive')
    }

    const handlePointerLeave = () => {
      resetCard()
      glow.classList.add('is-hidden')
      cursor.classList.add('is-hidden')
    }

    const handlePointerEnter = () => {
      glow.classList.remove('is-hidden')
      cursor.classList.remove('is-hidden')
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.addEventListener('pointerleave', handlePointerLeave)
    document.addEventListener('pointerenter', handlePointerEnter)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerleave', handlePointerLeave)
      document.removeEventListener('pointerenter', handlePointerEnter)
      if (frame) window.cancelAnimationFrame(frame)
      resetCard()
      document.body.classList.remove('has-custom-cursor')
    }
  }, [])

  return (
    <>
      <div ref={glowRef} className="glow-cursor is-hidden" aria-hidden="true" />
      <div ref={cursorRef} className="magnetic-cursor is-hidden" aria-hidden="true" />
    </>
  )
}
