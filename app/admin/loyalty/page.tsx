'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Crown, Gift, Users, Save } from 'lucide-react'

export default function AdminLoyaltyPage() {
  const [multiplier, setMultiplier] = useState<number | ''>('')
  const [maisonThreshold, setMaisonThreshold] = useState<number | ''>('')
  const [privilegeThreshold, setPrivilegeThreshold] = useState<number | ''>('')
  const [ambassadeurThreshold, setAmbassadeurThreshold] = useState<number | ''>('')
  const [message, setMessage] = useState<string | null>(null)

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('La sauvegarde de ce programme n’est pas configurée.')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-zinc-100 space-y-8">
      {/* Admin Loyalty Header */}
      <div className="bg-zinc-900/60 border border-amber-500/30 rounded-2xl p-8 backdrop-blur-md shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold uppercase tracking-widest">
            <Crown className="w-3.5 h-3.5" />
            Programme de fidélité
          </div>
          <h1 className="text-3xl font-serif font-bold text-amber-500 mt-2">Configuration du programme</h1>
          <p className="text-zinc-400 text-sm font-light mt-1">
            Configuration des taux de cumul de points, des seuils de statut VIP et des avantages débloqués.
          </p>
        </div>

        <Link
          href="/admin"
          className="px-4 py-2.5 border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors self-start md:self-auto"
        >
          Retour Administration
        </Link>
      </div>

      {message && (
        <div className="p-4 bg-amber-950/50 border border-amber-800 text-amber-300 text-xs rounded-xl">
          {message}
        </div>
      )}

      {/* Rules Config Form */}
      <form onSubmit={handleSaveConfig} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-base">
              <Gift className="w-5 h-5" />
              Multiplicateur de Cumul de Points
            </div>
            <div>
              <label className="block text-xs uppercase text-zinc-400 mb-1">
                Taux de Conversion (1€ dépensé = X Points)
              </label>
              <input
                type="number"
                step="0.1"
                value={multiplier}
                onChange={(e) => setMultiplier(Number(e.target.value))}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 font-mono text-sm focus:border-amber-500 outline-none"
              />
            </div>
            <p className="text-[11px] text-zinc-500 font-light">
              Aucun multiplicateur n’est configuré.
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-base">
              <Users className="w-5 h-5" />
              Seuils des Statuts VIP
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Niveau 1</label>
                <input
                  type="number"
                  value={maisonThreshold}
                  onChange={(e) => setMaisonThreshold(Number(e.target.value))}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-amber-400 mb-1">Niveau 2</label>
                <input
                  type="number"
                  value={privilegeThreshold}
                  onChange={(e) => setPrivilegeThreshold(Number(e.target.value))}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-amber-500 mb-1">Niveau 3</label>
                <input
                  type="number"
                  value={ambassadeurThreshold}
                  onChange={(e) => setAmbassadeurThreshold(Number(e.target.value))}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-3 bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-xl"
          >
            <Save className="w-4 h-4" />
            Enregistrer la Configuration VIP
          </button>
        </div>
      </form>
    </div>
  )
}
