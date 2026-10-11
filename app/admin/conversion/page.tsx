'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, TrendingUp, RefreshCw, Save, Users, Clock, AlertTriangle, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

interface ConversionConfig {
  live_popups_enabled: boolean
  viewing_counter_enabled: boolean
  stock_scarcity_enabled: boolean
  shipping_timer_enabled: boolean
  low_stock_threshold: number
}

const DEFAULT_CONVERSION_CONFIG: ConversionConfig = {
  live_popups_enabled: false,
  viewing_counter_enabled: false,
  stock_scarcity_enabled: false,
  shipping_timer_enabled: false,
  low_stock_threshold: 0,
}

export default function AdminConversionPage() {
  const [config, setConfig] = useState<ConversionConfig>(DEFAULT_CONVERSION_CONFIG)
  const [saving, setSaving] = useState(false)

  const loadConfig = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'conversion_config')
        .single()

      if (data?.value) {
        setConfig({
          ...DEFAULT_CONVERSION_CONFIG,
          ...data.value,
          live_popups_enabled: false,
          viewing_counter_enabled: false,
          stock_scarcity_enabled: false,
          shipping_timer_enabled: false,
        })
      }
    } catch {
      setConfig(DEFAULT_CONVERSION_CONFIG)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('site_settings').upsert({
        key: 'conversion_config',
        value: config,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        toast.error('Impossible d’enregistrer la configuration.')
      } else {
        toast.success('Configuration enregistrée.')
      }
    } catch {
      toast.error('Impossible d’enregistrer la configuration.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-[#FEFDF5] text-zinc-900 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600 hover:text-[#C5A059] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au Dashboard Admin
          </Link>
          <span className="text-xs uppercase tracking-widest text-[#C5A059] font-bold">
            CRO &amp; Conversion Control
          </span>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#C5A059]">
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Social Proof &amp; Urgency</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-zinc-950">
              Module de Preuve Sociale &amp; Conversion (CRO)
            </h1>
            <p className="text-zinc-600 text-xs font-light">
              Les indicateurs de rareté, de fréquentation et de délai restent désactivés tant qu’ils ne reposent pas sur des données vérifiées.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadConfig}
              className="p-3 bg-[#FAF8F5] border border-zinc-200 text-zinc-700 hover:text-[#C5A059] rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3.5 bg-[#0D0D0D] text-[#C5A059] hover:bg-[#C5A059] hover:text-[#0D0D0D] text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Enregistrement...' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Live Sales Popups Settings */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2 text-zinc-950 font-serif font-bold text-base">
                <MessageSquare className="w-5 h-5 text-[#C5A059]" />
                1. Popups de Vente en Direct
              </div>
              <button
                type="button"
                disabled
                onClick={() =>
                  setConfig((prev) => ({ ...prev, live_popups_enabled: !prev.live_popups_enabled }))
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  config.live_popups_enabled ? 'bg-emerald-600' : 'bg-zinc-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    config.live_popups_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-zinc-600 font-light leading-relaxed">
              Désactivé : aucune source de commandes réelles ni d’envoi de notification n’est configurée.
            </p>
          </div>

          {/* Active Viewers Counter Settings */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2 text-zinc-950 font-serif font-bold text-base">
                <Users className="w-5 h-5 text-[#C5A059]" />
                2. Compteur de Visiteurs
              </div>
              <button
                type="button"
                disabled
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    viewing_counter_enabled: !prev.viewing_counter_enabled,
                  }))
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  config.viewing_counter_enabled ? 'bg-emerald-600' : 'bg-zinc-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    config.viewing_counter_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-zinc-600 font-light leading-relaxed">
              Désactivé : aucun compteur de fréquentation vérifié n’est disponible.
            </p>
          </div>

          {/* Stock Scarcity Threshold Settings */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2 text-zinc-950 font-serif font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                3. Alerte Rareté de Stock
              </div>
              <button
                type="button"
                disabled
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    stock_scarcity_enabled: !prev.stock_scarcity_enabled,
                  }))
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  config.stock_scarcity_enabled ? 'bg-emerald-600' : 'bg-zinc-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    config.stock_scarcity_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold uppercase tracking-wider text-zinc-700 block">
                Seuil de Stock Critique (pièces)
              </label>
              <input
                type="number"
                value={config.low_stock_threshold}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    low_stock_threshold: parseInt(e.target.value || '0', 10),
                  }))
                }
                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl font-mono font-bold text-zinc-950 focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>

          {/* Shipping Countdown Timer Settings */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2 text-zinc-950 font-serif font-bold text-base">
                <Clock className="w-5 h-5 text-[#C5A059]" />
                4. Compte à Rebours d&apos;Expédition
              </div>
              <button
                type="button"
                disabled
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    shipping_timer_enabled: !prev.shipping_timer_enabled,
                  }))
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  config.shipping_timer_enabled ? 'bg-emerald-600' : 'bg-zinc-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    config.shipping_timer_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-zinc-600 font-light leading-relaxed">
              Désactivé : aucun délai d’expédition réel n’est connecté.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
