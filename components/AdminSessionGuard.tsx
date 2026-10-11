'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, LogOut, Lock } from 'lucide-react'

interface AdminSessionGuardProps {
  children: React.ReactNode
  timeoutMinutes?: number
}

export default function AdminSessionGuard({
  children,
  timeoutMinutes = 15,
}: AdminSessionGuardProps) {
  const router = useRouter()
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(60)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const resetInactivityTimer = () => {
    if (showWarningModal) return // Don't reset if warning modal is active

    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

    // Set timer for (timeoutMinutes - 1) minutes before warning modal appears
    const warningTimeMs = (timeoutMinutes * 60 - 60) * 1000

    inactivityTimerRef.current = setTimeout(() => {
      setShowWarningModal(true)
      setSecondsRemaining(60)

      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!)
            handleAutoLogout()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, warningTimeMs)
  }

  const handleKeepAlive = () => {
    setShowWarningModal(false)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    resetInactivityTimer()
  }

  const handleAutoLogout = () => {
    setShowWarningModal(false)
    router.push('/login?logout_reason=inactivity')
  }

  useEffect(() => {
    resetInactivityTimer()

    const handleUserActivity = () => resetInactivityTimer()

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity)
    })

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeoutMinutes])

  return (
    <div className="relative">
      {children}

      {/* Inactivity Warning Countdown Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#C5A059] max-w-md w-full rounded-3xl p-8 shadow-2xl space-y-6 text-center animate-fadeIn">
            <div className="w-14 h-14 bg-amber-100 text-[#C5A059] rounded-2xl flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 animate-pulse text-[#C5A059]" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif font-bold text-2xl text-zinc-950">
                Session Inactive
              </h3>
              <p className="text-xs text-zinc-600 font-light leading-relaxed">
                Par mesure de sécurité haut de gamme, votre session administrateur sera clôturée automatiquement dans :
              </p>
              <div className="text-4xl font-mono font-bold text-[#C5A059] pt-2">
                {secondsRemaining}s
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleAutoLogout}
                className="w-1/2 py-3 border border-zinc-300 text-zinc-700 font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-zinc-100 cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Se Déconnecter
              </button>
              <button
                onClick={handleKeepAlive}
                className="w-1/2 py-3 bg-[#0D0D0D] text-[#C5A059] font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-[#C5A059] hover:text-[#0D0D0D] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Rester Connecté
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
