'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Save, ShieldCheck, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import {
  SHIPPING_ZONE_KEYS,
  isValidStripeRateId,
  normalizeCountries,
  type ShippingZone,
} from '@/lib/shipping'

const ZONE_LABELS: Record<string, string> = {
  france: 'France',
  europe: 'Europe (hors France)',
  international: 'International',
}

interface ZoneDraft {
  id: string | null
  zone_key: string
  label: string
  countries: string
  carrier_name: string
  fee_cents: string
  free_threshold_cents: string
  stripe_shipping_rate_id: string
  is_active: boolean
}

const EMPTY_DRAFT: ZoneDraft = {
  id: null,
  zone_key: 'france',
  label: '',
  countries: '',
  carrier_name: '',
  fee_cents: '',
  free_threshold_cents: '',
  stripe_shipping_rate_id: '',
  is_active: false,
}

function toDraft(zone: ShippingZone): ZoneDraft {
  return {
    id: zone.id,
    zone_key: zone.zone_key,
    label: zone.label,
    countries: normalizeCountries(zone.countries).join(', '),
    carrier_name: zone.carrier_name ?? '',
    fee_cents: zone.fee_cents === null || zone.fee_cents === undefined ? '' : String(zone.fee_cents),
    free_threshold_cents:
      zone.free_threshold_cents === null || zone.free_threshold_cents === undefined
        ? ''
        : String(zone.free_threshold_cents),
    stripe_shipping_rate_id: zone.stripe_shipping_rate_id ?? '',
    is_active: zone.is_active,
  }
}

function parseOptionalInt(value: string): number | null | 'invalid' {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  if (!Number.isInteger(parsed) || parsed < 0) return 'invalid'
  return parsed
}

export function ShippingZonesManager() {
  const [zones, setZones] = useState<ShippingZone[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, ZoneDraft>>({})
  const [saving, setSaving] = useState(false)

  const loadZones = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('shipping_zones')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      setZones((data || []) as ShippingZone[])
      setDrafts({})
    } catch (error: unknown) {
      console.error('Unable to load shipping zones:', error)
      setLoadError('Impossible de charger les zones de livraison. Vérifiez les droits administrateur et réessayez.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadZones()
  }, [loadZones])

  const draftFor = (zone: ShippingZone): ZoneDraft => drafts[zone.zone_key] ?? toDraft(zone)

  const setDraft = (key: string, draft: ZoneDraft) => {
    setDrafts((current) => ({ ...current, [key]: draft }))
  }

  const availableKeys = SHIPPING_ZONE_KEYS.filter(
    (key) => !zones.some((zone) => zone.zone_key === key)
  )

  const saveZone = async (draft: ZoneDraft) => {
    const key = draft.zone_key
    const label = draft.label.trim() || ZONE_LABELS[key] || key
    const countries = normalizeCountries(draft.countries.split(/[\s,;]+/))
    const stripeRateId = draft.stripe_shipping_rate_id.trim()
    const feeCents = parseOptionalInt(draft.fee_cents)
    const thresholdCents = parseOptionalInt(draft.free_threshold_cents)

    if (!SHIPPING_ZONE_KEYS.includes(key as (typeof SHIPPING_ZONE_KEYS)[number])) {
      toast.error('Choisissez une clé de zone valide (france, europe, international).')
      return
    }
    if (countries.length === 0) {
      toast.error('Indiquez au moins un code pays ISO à deux lettres (ex. FR, BE…).')
      return
    }
    if (feeCents === 'invalid' || thresholdCents === 'invalid') {
      toast.error('Les frais et le seuil doivent être des montants entiers en centimes, ou vides.')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        zone_key: key,
        label,
        countries,
        carrier_name: draft.carrier_name.trim() || null,
        fee_cents: feeCents,
        free_threshold_cents: thresholdCents,
        stripe_shipping_rate_id: stripeRateId || null,
        is_active: draft.is_active,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase
        .from('shipping_zones')
        .upsert(payload, { onConflict: 'zone_key' })
      if (error) throw error
      toast.success(`Zone « ${label} » enregistrée.`)
      await loadZones()
    } catch (error: unknown) {
      console.error('Unable to save a shipping zone:', error)
      toast.error('Impossible d’enregistrer la zone de livraison.')
    } finally {
      setSaving(false)
    }
  }

  const deleteZone = async (zone: ShippingZone) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('shipping_zones').delete().eq('id', zone.id)
      if (error) throw error
      toast.success(`Zone « ${zone.label} » supprimée.`)
      await loadZones()
    } catch (error: unknown) {
      console.error('Unable to delete a shipping zone:', error)
      toast.error('Impossible de supprimer la zone de livraison.')
    }
  }
  const [newDraft, setNewDraft] = useState<ZoneDraft | null>(null)

  const activeMissingRate = zones.filter(
    (zone) => zone.is_active && !isValidStripeRateId(zone.stripe_shipping_rate_id)
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="font-serif text-base font-bold text-zinc-950 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
            Zones d&apos;expédition et frais de port
          </h2>
          <p className="text-xs text-zinc-500 max-w-2xl">
            Chaque zone regroupe des pays (codes ISO à deux lettres), un transporteur, des frais et un
            identifiant de tarif Stripe <code className="font-mono">shr_…</code>. Aucune valeur n’est
            préremplie. Le paiement reste désactivé tant qu’une zone active n’a pas de tarif Stripe valide
            et un taux de TVA renseigné pour chacun de ses pays.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadZones()}
            className="p-2.5 bg-[#FAF8F5] border border-zinc-200 text-zinc-700 hover:text-[#C5A059] rounded-xl transition-colors cursor-pointer"
            aria-label="Rafraîchir les zones"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setNewDraft({ ...EMPTY_DRAFT, zone_key: availableKeys[0] ?? 'france' })}
            disabled={availableKeys.length === 0}
            className="px-4 py-2 bg-[#66563d] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#51432f] transition-colors disabled:opacity-50 cursor-pointer"
          >
            Ajouter une zone
          </button>
        </div>
      </div>

      {activeMissingRate.length > 0 && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          {activeMissingRate.length} zone(s) active(s) sans tarif Stripe valide : le paiement reste
          désactivé tant que ce n’est pas corrigé.
        </div>
      )}

      {loadError ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <p>{loadError}</p>
          <button type="button" onClick={() => void loadZones()} className="mt-3 font-semibold underline underline-offset-2">
            Réessayer
          </button>
        </div>
      ) : loading ? (
        <p role="status" className="py-10 text-center text-sm text-zinc-500">
          Chargement des zones de livraison…
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {zones.length === 0 && !newDraft ? (
            <p className="text-zinc-500 text-sm col-span-full">
              Aucune zone d’expédition configurée. Ajoutez une zone pour commencer.
            </p>
          ) : (
            zones.map((zone) => {
              const draft = draftFor(zone)
              return (
                <div key={zone.id} className="p-4 bg-[#FAF8F5] border border-zinc-200 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-950 text-sm">{zone.label}</span>
                    <label className="inline-flex items-center gap-2 text-[10px] font-bold uppercase text-zinc-500">
                      <input
                        type="checkbox"
                        checked={draft.is_active}
                        onChange={(event) => setDraft(zone.zone_key, { ...draft, is_active: event.target.checked })}
                        className="h-4 w-4 accent-[#66563d]"
                      />
                      Active
                    </label>
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono">{zone.zone_key}</p>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Libellé
                      <input
                        value={draft.label}
                        onChange={(event) => setDraft(zone.zone_key, { ...draft, label: event.target.value })}
                        className="mt-1 w-full px-2 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900"
                      />
                    </label>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Pays (ISO, séparés par virgule)
                      <input
                        value={draft.countries}
                        onChange={(event) => setDraft(zone.zone_key, { ...draft, countries: event.target.value })}
                        placeholder="FR"
                        className="mt-1 w-full px-2 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-mono text-zinc-900"
                      />
                    </label>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Transporteur
                      <input
                        value={draft.carrier_name}
                        onChange={(event) => setDraft(zone.zone_key, { ...draft, carrier_name: event.target.value })}
                        className="mt-1 w-full px-2 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Frais (centimes)
                        <input
                          value={draft.fee_cents}
                          onChange={(event) => setDraft(zone.zone_key, { ...draft, fee_cents: event.target.value })}
                          inputMode="numeric"
                          className="mt-1 w-full px-2 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-mono text-zinc-900"
                        />
                      </label>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Gratuit dès (centimes)
                        <input
                          value={draft.free_threshold_cents}
                          onChange={(event) =>
                            setDraft(zone.zone_key, { ...draft, free_threshold_cents: event.target.value })
                          }
                          inputMode="numeric"
                          className="mt-1 w-full px-2 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-mono text-zinc-900"
                        />
                      </label>
                    </div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Tarif Stripe (shr_…)
                      <input
                        value={draft.stripe_shipping_rate_id}
                        onChange={(event) =>
                          setDraft(zone.zone_key, { ...draft, stripe_shipping_rate_id: event.target.value })
                        }
                        placeholder="shr_…"
                        className="mt-1 w-full px-2 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-mono text-zinc-900"
                      />
                    </label>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
                    <button
                      type="button"
                      onClick={() => void deleteZone(zone)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                      aria-label={`Supprimer la zone ${zone.label}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveZone(draft)}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#66563d] text-white text-xs font-semibold rounded-lg hover:bg-[#51432f] disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Enregistrer
                    </button>
                  </div>
                </div>
              )
            })
          )}
          {newDraft && (
            <div className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-zinc-950 text-sm">Nouvelle zone</span>
                <select
                  value={newDraft.zone_key}
                  onChange={(event) => setNewDraft({ ...newDraft, zone_key: event.target.value })}
                  className="px-2 py-1 bg-white border border-zinc-300 rounded-lg text-xs"
                >
                  {availableKeys.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Libellé
                <input
                  value={newDraft.label}
                  onChange={(event) => setNewDraft({ ...newDraft, label: event.target.value })}
                  placeholder={ZONE_LABELS[newDraft.zone_key] ?? ''}
                  className="mt-1 w-full px-2 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900"
                />
              </label>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Pays (ISO, séparés par virgule)
                <input
                  value={newDraft.countries}
                  onChange={(event) => setNewDraft({ ...newDraft, countries: event.target.value })}
                  placeholder="FR"
                  className="mt-1 w-full px-2 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900"
                />
              </label>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Transporteur
                <input
                  value={newDraft.carrier_name}
                  onChange={(event) => setNewDraft({ ...newDraft, carrier_name: event.target.value })}
                  className="mt-1 w-full px-2 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Frais (centimes)
                  <input
                    value={newDraft.fee_cents}
                    onChange={(event) => setNewDraft({ ...newDraft, fee_cents: event.target.value })}
                    inputMode="numeric"
                    className="mt-1 w-full px-2 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900"
                  />
                </label>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Gratuit dès (centimes)
                  <input
                    value={newDraft.free_threshold_cents}
                    onChange={(event) => setNewDraft({ ...newDraft, free_threshold_cents: event.target.value })}
                    inputMode="numeric"
                    className="mt-1 w-full px-2 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900"
                  />
                </label>
              </div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Tarif Stripe (shr_…)
                <input
                  value={newDraft.stripe_shipping_rate_id}
                  onChange={(event) => setNewDraft({ ...newDraft, stripe_shipping_rate_id: event.target.value })}
                  placeholder="shr_…"
                  className="mt-1 w-full px-2 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-mono text-zinc-900"
                />
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600">
                <input
                  type="checkbox"
                  checked={newDraft.is_active}
                  onChange={(event) => setNewDraft({ ...newDraft, is_active: event.target.checked })}
                  className="h-4 w-4 accent-[#66563d]"
                />
                Zone active
              </label>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200">
                <button
                  type="button"
                  onClick={() => setNewDraft(null)}
                  className="px-3 py-1.5 border border-zinc-300 text-zinc-700 text-xs font-semibold rounded-lg hover:bg-zinc-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await saveZone(newDraft)
                    setNewDraft(null)
                  }}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#66563d] text-white text-xs font-semibold rounded-lg hover:bg-[#51432f] disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Enregistrer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
