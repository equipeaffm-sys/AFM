// Shared types and validation for shipping zones and per-country tax rules.
// Used by the admin UI (display + editing) and by the server-side checkout
// configuration check. No real rate, fee, threshold or country list is hard
// coded here: every value is entered by an administrator in Supabase.

export const SHIPPING_ZONE_KEYS = ['france', 'europe', 'international'] as const
export type ShippingZoneKey = (typeof SHIPPING_ZONE_KEYS)[number]

export interface ShippingZone {
  id: string
  zone_key: string
  label: string
  countries: string[]
  carrier_name: string | null
  fee_cents: number | null
  free_threshold_cents: number | null
  stripe_shipping_rate_id: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface TaxRate {
  country_code: string
  country_name: string
  rate_percent: number | null
  is_active: boolean
  created_at?: string | null
  updated_at?: string | null
}

const STRIPE_RATE_RE = /^shr_[A-Za-z0-9]+$/
const ISO_COUNTRY_RE = /^[A-Z]{2}$/

export function normalizeCountries(value: unknown): string[] {
  const list = Array.isArray(value) ? value : []
  const seen = new Set<string>()
  for (const entry of list) {
    if (typeof entry !== 'string') continue
    const code = entry.trim().toUpperCase()
    if (ISO_COUNTRY_RE.test(code)) seen.add(code)
  }
  return Array.from(seen)
}

export function parseCountriesInput(value: string): string[] {
  return normalizeCountries(value.split(/[\s,;]+/))
}

export function isValidStripeRateId(value: string | null | undefined): boolean {
  return typeof value === 'string' && STRIPE_RATE_RE.test(value.trim())
}

export interface ShippingConfigurationIssue {
  zone_key: string
  message: string
}

// A zone is only usable when it is active, lists at least one valid ISO country,
// points to a real Stripe shipping rate, and every listed country has an active
// tax rule with a decided rate. Returns the list of problems (empty = valid).
export function evaluateShippingConfiguration(
  zones: ShippingZone[],
  taxRates: Pick<TaxRate, 'country_code' | 'rate_percent' | 'is_active'>[]
): ShippingConfigurationIssue[] {
  const issues: ShippingConfigurationIssue[] = []

  const decidedTax = new Set<string>()
  for (const rate of taxRates) {
    const code = typeof rate.country_code === 'string' ? rate.country_code.trim().toUpperCase() : ''
    if (
      rate.is_active &&
      typeof rate.rate_percent === 'number' &&
      Number.isFinite(rate.rate_percent) &&
      ISO_COUNTRY_RE.test(code)
    ) {
      decidedTax.add(code)
    }
  }

  const activeZones = zones.filter((zone) => zone.is_active)
  if (activeZones.length === 0) {
    issues.push({ zone_key: '*', message: 'Aucune zone de livraison active.' })
    return issues
  }

  const covered = new Set<string>()
  for (const zone of activeZones) {
    const label = zone.label || zone.zone_key
    const countries = normalizeCountries(zone.countries)

    if (countries.length === 0) {
      issues.push({
        zone_key: zone.zone_key,
        message: `La zone « ${label} » ne contient aucun pays valide.`,
      })
    }
    if (!isValidStripeRateId(zone.stripe_shipping_rate_id)) {
      issues.push({
        zone_key: zone.zone_key,
        message: `La zone « ${label} » n’a pas de tarif de livraison Stripe valide.`,
      })
    }
    for (const country of countries) {
      covered.add(country)
      if (!decidedTax.has(country)) {
        issues.push({
          zone_key: zone.zone_key,
          message: `Aucune règle fiscale active et renseignée pour ${country} (zone « ${label} »).`,
        })
      }
    }
  }

  if (covered.size === 0) {
    issues.push({ zone_key: '*', message: 'Aucun pays desservi par les zones actives.' })
  }

  return issues
}

export function collectAllowedCountries(zones: ShippingZone[]): string[] {
  return Array.from(
    new Set(zones.filter((zone) => zone.is_active).flatMap((zone) => normalizeCountries(zone.countries)))
  )
}

export function activeShippingOptions(zones: ShippingZone[]): { shipping_rate: string }[] {
  return zones
    .filter((zone) => zone.is_active && isValidStripeRateId(zone.stripe_shipping_rate_id))
    .map((zone) => ({ shipping_rate: zone.stripe_shipping_rate_id as string }))
}
