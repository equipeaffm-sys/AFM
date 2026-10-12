// Shared types and helpers for the Maison L&M kennel showcase.
// No breed, name, pedigree, price or testimonial is hard-coded here: every dog
// and every value comes from Supabase, entered by an administrator.

export const DOG_CATEGORIES = ['puppy', 'breeder', 'adult'] as const
export type DogCategory = (typeof DOG_CATEGORIES)[number]

export const DOG_STATUSES = ['available', 'reserved', 'adopted'] as const
export type DogStatus = (typeof DOG_STATUSES)[number]

export const DOG_SEXES = ['male', 'female'] as const
export type DogSex = (typeof DOG_SEXES)[number]

export interface Dog {
  id: string
  slug: string
  name: string
  breed: string | null
  category: DogCategory
  sex: DogSex | null
  birth_date: string | null
  price_cents: number | null
  price_on_request: boolean
  status: DogStatus
  description: string | null
  pedigree: string | null
  health_tests: string | null
  characteristics: string[]
  ideal_environment: string | null
  images: string[]
  video_url: string | null
  is_published: boolean
  is_featured: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

export interface ReservationRequest {
  id: string
  dog_id: string | null
  dog_name: string | null
  full_name: string
  email: string
  phone: string | null
  message: string | null
  housing_type: string | null
  has_garden: boolean | null
  has_children: boolean | null
  other_pets: string | null
  status: 'new' | 'contacted' | 'closed'
  created_at: string
}

export const CATEGORY_LABELS: Record<DogCategory, string> = {
  puppy: 'Chiot',
  breeder: 'Reproducteur',
  adult: 'Chien adulte',
}

export const STATUS_LABELS: Record<DogStatus, string> = {
  available: 'Disponible',
  reserved: 'Réservé',
  adopted: 'Adopté',
}

export const SEX_LABELS: Record<DogSex, string> = {
  male: 'Mâle',
  female: 'Femelle',
}

export function isDogCategory(value: unknown): value is DogCategory {
  return typeof value === 'string' && (DOG_CATEGORIES as readonly string[]).includes(value)
}

export function isDogStatus(value: unknown): value is DogStatus {
  return typeof value === 'string' && (DOG_STATUSES as readonly string[]).includes(value)
}

// Compute an age label in French from a birth date. Returns null when unknown.
export function formatAgeLabel(birthDate: string | null): string | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null

  const now = new Date()
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (now.getDate() < birth.getDate()) months -= 1
  if (months < 0) months = 0

  if (months < 1) return "Moins d'un mois"
  if (months < 24) return `${months} mois`
  const years = Math.floor(months / 12)
  return `${years} an${years > 1 ? 's' : ''}`
}

export function formatBirthDate(birthDate: string | null): string | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null
  return birth.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Price is shown only when a real amount is set. Otherwise "on request".
export function formatDogPrice(
  priceCents: number | null,
  priceOnRequest: boolean,
  formatPrice: (cents: number) => string
): string {
  if (typeof priceCents === 'number' && priceCents > 0 && !priceOnRequest) {
    return formatPrice(priceCents)
  }
  return 'Prix sur demande'
}

export function normalizeImages(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((url): url is string => typeof url === 'string' && url.length > 0)
}
