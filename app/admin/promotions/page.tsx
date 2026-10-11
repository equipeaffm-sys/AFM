'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Tag, Percent, Calendar, Sparkles, RefreshCw, Plus, Trash2, Clock, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Product } from '@/lib/constants'

interface PromoCode {
  id: string
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  max_uses: number
  used_count: number
  expires_at: string
  is_active: boolean
}

export default function PromotionsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Bulk Discount Form
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [saleDays, setSaleDays] = useState<number>(0)
  const [applying, setApplying] = useState(false)

  // Promo Codes State
  const [promoCodes] = useState<PromoCode[]>([])

  // New Code Form Inputs
  const [newCode, setNewCode] = useState('')
  const [newDiscountType, setNewDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [newDiscountValue, setNewDiscountValue] = useState<number>(0)
  const [newMaxUses, setNewMaxUses] = useState<number>(0)

  // Urgency Banners Toggle
  const [urgencyBannerActive, setUrgencyBannerActive] = useState(false)
  const [urgencyText, setUrgencyText] = useState('')

  const loadProducts = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setProducts(data || [])
    } catch {
      setProducts([])
      toast.error('Impossible de charger les produits.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // Apply Bulk Discount & Revalidate Cache
  const handleApplyBulkDiscount = async () => {
    const targets = products.filter((p) => selectedCategory === 'all' || p.category === selectedCategory)
    if (targets.length === 0) {
      toast.error('Aucun produit disponible pour cette promotion.')
      return
    }
    if (discountPercent <= 0 || saleDays <= 0) {
      toast.error('Renseignez une réduction et une durée valides.')
      return
    }

    setApplying(true)
    const saleEndsAt = new Date(Date.now() + saleDays * 24 * 60 * 60 * 1000).toISOString()

    try {
      const updates = new Map(targets.map((product) => [
        product.id,
        {
          sale_price_cents: Math.round(product.price_cents * (1 - discountPercent / 100)),
          sale_ends_at: saleEndsAt,
        },
      ]))

      const supabase = createClient()
      for (const t of targets) {
        const { error } = await supabase
          .from('products')
          .update(updates.get(t.id)!)
          .eq('id', t.id)
        if (error) throw error
      }

      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/', type: 'layout' }),
      }).catch(() => null)

      setProducts((prev) => prev.map((product) => {
        const update = updates.get(product.id)
        return update ? { ...product, ...update } : product
      }))
      toast.success(`Réduction de ${discountPercent}% appliquée aux produits sélectionnés.`)
    } catch {
      toast.error('Impossible d’appliquer la promotion.')
    } finally {
      setApplying(false)
    }
  }

  // Clear Bulk Promotions
  const handleClearPromotions = async () => {
    if (products.length === 0) {
      toast.error('Aucun produit disponible.')
      return
    }
    setApplying(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('products')
        .update({ sale_price_cents: null, sale_ends_at: null })
        .in('id', products.map((product) => product.id))
      if (error) throw error

      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/', type: 'layout' }),
      }).catch(() => null)

      setProducts((prev) => prev.map((p) => ({ ...p, sale_price_cents: undefined, sale_ends_at: undefined })))
      toast.success('Toutes les promotions en cours ont été désactivées.')
    } catch {
      toast.error('Impossible de désactiver les promotions.')
    } finally {
      setApplying(false)
    }
  }

  // Create Custom Promo Code
  const handleCreatePromoCode = (e: React.FormEvent) => {
    e.preventDefault()
    toast.error('La gestion des codes promo n’est pas connectée à une source persistante.')
  }

  const handleDeletePromoCode = (id: string) => {
    void id
    toast.error('La gestion des codes promo n’est pas configurée.')
  }

  const handleTogglePromoCode = (id: string) => {
    void id
    toast.error('La gestion des codes promo n’est pas configurée.')
  }

  // Save Urgency Banner Config
  const handleSaveUrgencyBanner = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('site_settings').upsert({
        key: 'promotions_config',
        value: {
          urgency_active: urgencyBannerActive,
          urgency_text: urgencyText,
        },
        updated_at: new Date().toISOString(),
      })
      if (error) throw error

      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/', type: 'layout' }),
      }).catch(() => null)

      toast.success('Bandeau d\'urgence et compte à rebours synchronisés !')
    } catch {
      toast.error('Impossible d’enregistrer la configuration.')
    }
  }

  return (
    <div className="bg-[#FEFDF5] text-zinc-900 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600 hover:text-[#C5A059] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au Dashboard Admin
          </Link>
          <span className="text-xs uppercase tracking-widest text-[#C5A059] font-bold">
            Promotions &amp; Urgency Engine
          </span>
        </div>

        {/* Title Box */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#C5A059]">
              <Tag className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Offres Privées, Codes &amp; Badges</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-zinc-950">
              Moteur de Promotions Dynamiques
            </h1>
            <p className="text-zinc-600 text-xs font-light">
              Créez des codes promo sur mesure (% ou €), activez des ventes flash en masse et personnalisez les badges d&apos;urgence.
            </p>
          </div>

          <button
            onClick={loadProducts}
            className="p-3 bg-[#FAF8F5] border border-zinc-200 text-zinc-700 hover:text-[#C5A059] rounded-xl transition-colors self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Urgency Banner & Countdown Controller */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h2 className="font-serif text-base font-bold text-zinc-950 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C5A059]" />
              1. Bandeau d&apos;Urgence &amp; Compte à Rebours (Urgency Badges)
            </h2>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-zinc-500">
                {urgencyBannerActive ? 'Affiché' : 'Masqué'}
              </span>
              <button
                type="button"
                onClick={() => setUrgencyBannerActive(!urgencyBannerActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  urgencyBannerActive ? 'bg-emerald-600' : 'bg-zinc-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    urgencyBannerActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                Texte d&apos;Accroche d&apos;Urgence
              </label>
              <input
                type="text"
                value={urgencyText}
                onChange={(e) => setUrgencyText(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-[#C5A059]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSaveUrgencyBanner}
                className="w-full py-2.5 bg-[#0D0D0D] text-[#C5A059] font-bold uppercase rounded-xl hover:bg-[#C5A059] hover:text-[#0D0D0D] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Enregistrer Bandeau
              </button>
            </div>
          </div>
        </div>

        {/* Promo Codes Creator Section */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="font-serif text-base font-bold text-zinc-950 flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Tag className="w-4 h-4 text-[#C5A059]" />
            2. Gestionnaire de Codes Promo &amp; Réductions Sur Mesure
          </h2>

          <form onSubmit={handleCreatePromoCode} className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">Code Promo</label>
              <input
                type="text"
                placeholder="ex: VIP20"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-zinc-200 rounded-lg text-zinc-900 font-mono font-bold uppercase focus:outline-none focus:border-[#C5A059]"
                required
              />
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">Type Réduction</label>
              <select
                value={newDiscountType}
                onChange={(e) => setNewDiscountType(e.target.value as 'percent' | 'fixed')}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-[#C5A059] cursor-pointer"
              >
                <option value="percent">Pourcentage (-X%)</option>
                <option value="fixed">Montant Fixe (-X€)</option>
              </select>
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">Valeur (-X)</label>
              <input
                type="number"
                value={newDiscountValue}
                onChange={(e) => setNewDiscountValue(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-zinc-200 rounded-lg text-zinc-900 font-mono font-bold focus:outline-none focus:border-[#C5A059]"
                required
              />
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">Max Utilisations</label>
              <input
                type="number"
                value={newMaxUses}
                onChange={(e) => setNewMaxUses(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-zinc-200 rounded-lg text-zinc-900 font-mono focus:outline-none focus:border-[#C5A059]"
                required
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-[#0D0D0D] text-[#C5A059] font-bold uppercase rounded-lg hover:bg-[#C5A059] hover:text-[#0D0D0D] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Créer Code
              </button>
            </div>
          </form>

          {/* Active Promo Codes Table */}
          <div className="overflow-x-auto border border-zinc-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-zinc-200 text-zinc-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Réduction</th>
                  <th className="py-3 px-4">Utilisations</th>
                  <th className="py-3 px-4">Expiration</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-mono">
                {promoCodes.map((pc) => (
                  <tr key={pc.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#C5A059]">{pc.code}</td>
                    <td className="py-3 px-4 font-bold text-zinc-900">
                      {pc.discount_type === 'percent' ? `-${pc.discount_value}%` : `-${pc.discount_value} €`}
                    </td>
                    <td className="py-3 px-4 text-zinc-600">
                      {pc.used_count} / {pc.max_uses}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 text-[11px]">
                      {new Date(pc.expires_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleTogglePromoCode(pc.id)}
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase cursor-pointer ${
                          pc.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-500'
                        }`}
                      >
                        {pc.is_active ? 'ACTIF' : 'INACTIF'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeletePromoCode(pc.id)}
                        className="text-zinc-400 hover:text-red-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bulk Promotion Controls */}
        <div className="bg-white border-2 border-[#C5A059]/40 rounded-2xl p-8 shadow-md space-y-6">
          <h2 className="font-serif text-lg font-bold text-zinc-950 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C5A059]" />
            3. Vente Flash &amp; Solides en Masse par Rayon
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                Pourcentage de Réduction (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="90"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseInt(e.target.value || '0', 10))}
                  className="w-full pl-4 pr-10 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-950 focus:outline-none focus:border-[#C5A059]"
                />
                <Percent className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                Rayon / Catégorie Cible
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#C5A059] cursor-pointer"
              >
                <option value="all">Tous les Rayons</option>
                {Array.from(new Set(products.map((product) => product.category))).map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                Durée de la Promo (Jours)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={saleDays}
                  onChange={(e) => setSaleDays(parseInt(e.target.value || '1', 10))}
                  className="w-full pl-4 pr-10 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-950 focus:outline-none focus:border-[#C5A059]"
                />
                <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClearPromotions}
              disabled={applying}
              className="px-5 py-3 border border-zinc-300 text-zinc-700 hover:bg-zinc-100 text-xs font-semibold uppercase rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Annuler Toutes les Promos
            </button>
            <button
              type="button"
              onClick={handleApplyBulkDiscount}
              disabled={applying}
              className="px-8 py-3 bg-[#0D0D0D] text-[#C5A059] hover:bg-[#C5A059] hover:text-[#0D0D0D] text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {applying ? 'Application...' : `Appliquer -${discountPercent}%`}
            </button>
          </div>
        </div>

        {/* Promotions Active Table */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-100 font-serif font-bold text-base text-zinc-950 flex items-center justify-between">
            <span>Aperçu des Prix Soldés dans le Catalogue</span>
            <span className="text-xs font-mono font-normal text-zinc-500">
              {products.filter((p) => p.sale_price_cents).length} article(s) soldé(s)
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-zinc-500 font-serif text-sm">
              Chargement des tarifs...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-zinc-200 text-zinc-600 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-4 px-6">Produit</th>
                    <th className="py-4 px-6">Rayon</th>
                    <th className="py-4 px-6">Prix Régulier</th>
                    <th className="py-4 px-6">Prix Soldé (Barré)</th>
                    <th className="py-4 px-6">Expiration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {products.map((p) => {
                    const regularEuros = p.price_cents / 100
                    const saleEuros = p.sale_price_cents ? p.sale_price_cents / 100 : null

                    return (
                      <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="py-4 px-6 flex items-center gap-3">
                          <div className="relative w-10 h-10 bg-zinc-100 rounded-lg overflow-hidden shrink-0">
                            {p.images[0] && (
                              <Image
                                src={p.images[0]}
                                alt={p.title}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <span className="font-serif font-bold text-zinc-950 block">{p.title}</span>
                        </td>

                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 bg-zinc-100 border border-zinc-200 text-zinc-800 rounded-full font-semibold text-[10px] uppercase">
                            {p.category}
                          </span>
                        </td>

                        <td className="py-4 px-6 font-mono text-zinc-700">
                          {regularEuros.toFixed(2)} €
                        </td>

                        <td className="py-4 px-6">
                          {saleEuros ? (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold rounded-lg text-xs">
                              {saleEuros.toFixed(2)} € (Offre Privée)
                            </span>
                          ) : (
                            <span className="text-zinc-400 font-light">—</span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-zinc-500 font-mono text-[11px]">
                          {p.sale_ends_at
                            ? new Date(p.sale_ends_at).toLocaleDateString('fr-FR')
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
