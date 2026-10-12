'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Percent, RefreshCw, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { SHIPPING_ZONE_KEYS, type TaxRate } from '@/lib/shipping'

interface TaxDraft {
  country_code: string
  country_name: string
  rate_percent: string
  is_active: boolean
}

const EMPTY_DRAFT: TaxDraft = { country_code: '', country_name: '', rate_percent: '', is_active: true }
const COUNTRY_CODE_RE = /^[A-Za-z]{2}$/

function toDraft(rate: TaxRate): TaxDraft {
  return {
    country_code: rate.country_code,
    country_name: rate.country_name,
    rate_percent: rate.rate_percent === null || rate.rate_percent === undefined ? '' : String(rate.rate_percent),
    is_active: rate.is_active,
  }
}

export default function AdminFinanceTaxesPage() {
  const [rates, setRates] = useState<TaxRate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, TaxDraft>>({})
  const [newDraft, setNewDraft] = useState<TaxDraft | null>(null)
  const [saving, setSaving] = useState(false)

  const loadRates = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tax_rates')
        .select('country_code, country_name, rate_percent, is_active, updated_at')
        .order('country_code', { ascending: true })
      if (error) throw error
      setRates((data || []) as TaxRate[])
      setDrafts({})
    } catch (error: unknown) {
      console.error('Unable to load tax rates:', error)
      setLoadError('Impossible de charger les règles fiscales. Vérifiez les droits administrateur et réessayez.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRates()
  }, [loadRates])

  const draftFor = (rate: TaxRate): TaxDraft => drafts[rate.country_code] ?? toDraft(rate)

  const setDraft = (code: string, draft: TaxDraft) => {
    setDrafts((current) => ({ ...current, [code]: draft }))
  }

  const parseRate = (value: string): number | null | 'invalid' => {
    const trimmed = value.trim()
    if (trimmed === '') return null
    const parsed = Number(trimmed.replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return 'invalid'
    return Math.round(parsed * 100) / 100
  }

  const saveRate = async (draft: TaxDraft, originalCode?: string) => {
    const countryCode = draft.country_code.trim().toUpperCase()
    const countryName = draft.country_name.trim()
    if (!COUNTRY_CODE_RE.test(countryCode)) {
      toast.error('Le code pays doit être deux lettres (ex. FR).')
      return
    }
    if (!countryName) {
      toast.error('Le nom du pays est requis.')
      return
    }
    const rate = parseRate(draft.rate_percent)
    if (rate === 'invalid') {
      toast.error('Le taux doit être un nombre entre 0 et 100, ou vide pour « non décidé ».')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        country_code: countryCode,
        country_name: countryName,
        rate_percent: rate,
        is_active: draft.is_active,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('tax_rates').upsert(payload, { onConflict: 'country_code' })
      if (error) throw error

      if (originalCode && originalCode !== countryCode) {
        const { error: deleteError } = await supabase
          .from('tax_rates')
          .delete()
          .eq('country_code', originalCode)
        if (deleteError) throw deleteError
      }

      toast.success(`Règle fiscale enregistrée pour ${countryName}.`)
      await loadRates()
    } catch (error: unknown) {
      console.error('Unable to save a tax rate:', error)
      toast.error('Impossible d’enregistrer la règle fiscale.')
    } finally {
      setSaving(false)
    }
  }

  const createRate = async () => {
    if (!newDraft) return
    await saveRate(newDraft)
    setNewDraft(null)
  }

  const deleteRate = async (rate: TaxRate) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('tax_rates').delete().eq('country_code', rate.country_code)
      if (error) throw error
      toast.success(`Règle fiscale supprimée pour ${rate.country_name}.`)
      await loadRates()
    } catch (error: unknown) {
      console.error('Unable to delete a tax rate:', error)
      toast.error('Impossible de supprimer la règle fiscale.')
    }
  }

  const undecidedCount = rates.filter((rate) => rate.rate_percent === null || rate.rate_percent === undefined).length

  return (
    <div className="bg-[#FAF8F5] min-h-screen text-zinc-900 p-6 lg:p-12 space-y-8">
      <div className="border-b border-zinc-200 pb-6">
        <Link
          href="/admin/finance"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-[#C5A059] transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux finances
        </Link>
        <div className="flex items-center gap-3">
          <Percent className="w-7 h-7 text-[#C5A059]" />
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-950">Configuration fiscale</h1>
        </div>
        <p className="text-xs text-zinc-600 mt-2 max-w-3xl">
          Définissez le taux de TVA par pays desservi. Aucun taux n’est prérempli : un pays sans taux
          actif et renseigné bloque le paiement. Le traitement fiscal réel (prix TTC/HT, calcul Stripe,
          mentions légales) doit être validé avant d’ouvrir la boutique.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="font-serif text-base font-bold text-zinc-950">Règles par pays</h2>
            <p className="text-xs text-zinc-500">
              {rates.length} pays enregistré(s)
              {undecidedCount > 0 && ` · ${undecidedCount} sans taux décidé`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadRates()}
              className="p-2.5 bg-[#FAF8F5] border border-zinc-200 text-zinc-700 hover:text-[#C5A059] rounded-xl transition-colors cursor-pointer"
              aria-label="Rafraîchir les règles fiscales"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setNewDraft({ ...EMPTY_DRAFT })}
              className="px-4 py-2 bg-[#66563d] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#51432f] transition-colors cursor-pointer"
            >
              Ajouter un pays
            </button>
          </div>
        </div>
        {loadError ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            <p>{loadError}</p>
            <button type="button" onClick={() => void loadRates()} className="mt-3 font-semibold underline underline-offset-2">
              Réessayer
            </button>
          </div>
        ) : loading ? (
          <p role="status" className="py-12 text-center text-sm text-zinc-500">
            Chargement des règles fiscales…
          </p>
        ) : (
          <div className="overflow-x-auto border border-zinc-200 rounded-xl">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#FAF8F5] border-b border-zinc-200 text-[10px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Code pays</th>
                  <th className="px-4 py-3">Nom du pays</th>
                  <th className="px-4 py-3">Taux de TVA (%)</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {newDraft && (
                  <tr className="bg-emerald-50/40">
                    <td className="px-4 py-3">
                      <input
                        value={newDraft.country_code}
                        onChange={(event) => setNewDraft({ ...newDraft, country_code: event.target.value.toUpperCase() })}
                        placeholder="FR"
                        maxLength={2}
                        className="w-20 px-2 py-1.5 border border-zinc-300 rounded-lg font-mono text-xs uppercase"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={newDraft.country_name}
                        onChange={(event) => setNewDraft({ ...newDraft, country_name: event.target.value })}
                        placeholder="France"
                        className="w-full px-2 py-1.5 border border-zinc-300 rounded-lg text-xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={newDraft.rate_percent}
                        onChange={(event) => setNewDraft({ ...newDraft, rate_percent: event.target.value })}
                        placeholder="—"
                        inputMode="decimal"
                        className="w-24 px-2 py-1.5 border border-zinc-300 rounded-lg font-mono text-xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={newDraft.is_active}
                        onChange={(event) => setNewDraft({ ...newDraft, is_active: event.target.checked })}
                        className="h-4 w-4 accent-[#66563d]"
                        aria-label="Règle active"
                      />
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => void createRate()}
                        disabled={saving}
                        className="px-3 py-1.5 bg-[#66563d] text-white text-xs font-semibold rounded-lg hover:bg-[#51432f] disabled:opacity-50 cursor-pointer"
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewDraft(null)}
                        className="px-3 py-1.5 border border-zinc-300 text-zinc-700 text-xs font-semibold rounded-lg hover:bg-zinc-100 cursor-pointer"
                      >
                        Annuler
                      </button>
                    </td>
                  </tr>
                )}
                {rates.length === 0 && !newDraft ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-500">
                      Aucune règle fiscale enregistrée. Le paiement reste désactivé tant qu’une zone de
                      livraison active n’a pas de taux renseigné pour chacun de ses pays.
                    </td>
                  </tr>
                ) : (
                  rates.map((rate) => {
                    const draft = draftFor(rate)
                    return (
                      <tr key={rate.country_code} className="hover:bg-zinc-50">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-zinc-900">{rate.country_code}</td>
                        <td className="px-4 py-3">
                          <input
                            value={draft.country_name}
                            onChange={(event) => setDraft(rate.country_code, { ...draft, country_name: event.target.value })}
                            className="w-full px-2 py-1.5 border border-zinc-200 rounded-lg text-xs"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={draft.rate_percent}
                            onChange={(event) => setDraft(rate.country_code, { ...draft, rate_percent: event.target.value })}
                            placeholder="—"
                            inputMode="decimal"
                            className="w-24 px-2 py-1.5 border border-zinc-200 rounded-lg font-mono text-xs"
                          />
                          {rate.rate_percent === null && (
                            <span className="ml-2 text-[10px] font-semibold uppercase text-amber-700">Non décidé</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={draft.is_active}
                            onChange={(event) => setDraft(rate.country_code, { ...draft, is_active: event.target.checked })}
                            className="h-4 w-4 accent-[#66563d]"
                            aria-label={`Règle active pour ${rate.country_name}`}
                          />
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => void saveRate(draft, rate.country_code)}
                            disabled={saving}
                            className="px-3 py-1.5 bg-[#66563d] text-white text-xs font-semibold rounded-lg hover:bg-[#51432f] disabled:opacity-50 cursor-pointer"
                          >
                            Enregistrer
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteRate(rate)}
                            className="p-1.5 border border-zinc-200 text-zinc-500 hover:text-red-600 hover:border-red-200 rounded-lg transition-colors cursor-pointer"
                            aria-label={`Supprimer la règle pour ${rate.country_name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[11px] text-zinc-500">
          Les zones de livraison ({SHIPPING_ZONE_KEYS.join(', ')}) référencent ces pays. Un pays listé dans
          une zone active sans taux actif et renseigné empêche l’activation du paiement.
        </p>
      </div>
    </div>
  )
}
