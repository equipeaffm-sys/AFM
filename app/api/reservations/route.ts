import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const jsonHeaders = { 'Cache-Control': 'no-store' }

// Basic validation bounds for the reservation request.
const MAX_NAME = 120
const MAX_EMAIL = 200
const MAX_PHONE = 40
const MAX_MESSAGE = 4000
const MAX_HOUSING = 120
const MAX_OTHER_PETS = 500
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function cleanString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

function cleanBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

// Very small in-memory rate limit (per server instance). Good enough to blunt
// casual abuse; the real protection is that writes go through the service role.
const RATE_WINDOW_MS = 60_000
const RATE_MAX = 5
const recentRequests = new Map<string, number[]>()

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const hits = (recentRequests.get(key) || []).filter((time) => now - time < RATE_WINDOW_MS)
  hits.push(now)
  recentRequests.set(key, hits)
  return hits.length > RATE_MAX
}

export async function POST(request: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Le service de réservation n’est pas configuré.' },
      { status: 503, headers: jsonHeaders }
    )
  }

  const clientKey =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(clientKey)) {
    return NextResponse.json(
      { error: 'Trop de demandes ont été envoyées. Merci de patienter quelques instants.' },
      { status: 429, headers: jsonHeaders }
    )
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'La requête doit contenir un JSON valide.' }, { status: 400, headers: jsonHeaders })
  }

  const body = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>

  const fullName = cleanString(body.full_name, MAX_NAME)
  const email = cleanString(body.email, MAX_EMAIL)
  const message = cleanString(body.message, MAX_MESSAGE)
  const phone = cleanString(body.phone, MAX_PHONE)
  const housingType = cleanString(body.housing_type, MAX_HOUSING)
  const otherPets = cleanString(body.other_pets, MAX_OTHER_PETS)
  const hasGarden = cleanBoolean(body.has_garden)
  const hasChildren = cleanBoolean(body.has_children)

  const dogIdRaw = cleanString(body.dog_id, 40)
  const dogId = dogIdRaw && UUID_RE.test(dogIdRaw) ? dogIdRaw : null
  const dogName = cleanString(body.dog_name, MAX_NAME)

  if (!fullName || !email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: 'Merci d’indiquer votre nom complet et une adresse e-mail valide.' },
      { status: 400, headers: jsonHeaders }
    )
  }

  try {
    const { error: insertError } = await supabaseAdmin.from('reservation_requests').insert({
      dog_id: dogId,
      dog_name: dogName,
      full_name: fullName,
      email,
      phone,
      message,
      housing_type: housingType,
      has_garden: hasGarden,
      has_children: hasChildren,
      other_pets: otherPets,
    })
    if (insertError) throw insertError

    const resendApiKey = process.env.RESEND_API_KEY
    const resendFromEmail = process.env.RESEND_FROM_EMAIL
    const resendToEmail = process.env.RESEND_TO_EMAIL || resendFromEmail

    if (resendApiKey && resendFromEmail && resendToEmail) {
      const resend = new Resend(resendApiKey)
      const subject = dogName
        ? `Nouvelle demande de réservation — ${dogName}`
        : 'Nouvelle demande de contact'
      const lines = [
        `Nom : ${fullName}`,
        `E-mail : ${email}`,
        phone ? `Téléphone : ${phone}` : null,
        dogName ? `Chien : ${dogName}` : null,
        housingType ? `Logement : ${housingType}` : null,
        hasGarden === null ? null : `Jardin : ${hasGarden ? 'oui' : 'non'}`,
        hasChildren === null ? null : `Enfants : ${hasChildren ? 'oui' : 'non'}`,
        otherPets ? `Autres animaux : ${otherPets}` : null,
        message ? `\nMessage :\n${message}` : null,
      ].filter(Boolean)

      try {
        const { error: emailError } = await resend.emails.send({
          from: resendFromEmail,
          to: resendToEmail,
          replyTo: email,
          subject,
          text: lines.join('\n'),
        })
        if (emailError) {
          console.error('Unable to send reservation notification email:', emailError.message)
        }
      } catch (error) {
        console.error('Unable to send reservation notification email:', error)
      }
    } else {
      console.error(
        'Reservation notification email not sent: configure RESEND_API_KEY and RESEND_FROM_EMAIL.'
      )
    }

    return NextResponse.json({ received: true }, { headers: jsonHeaders })
  } catch (error) {
    console.error('Unable to record a reservation request:', error)
    return NextResponse.json(
      { error: 'Votre demande n’a pas pu être enregistrée. Merci de réessayer.' },
      { status: 500, headers: jsonHeaders }
    )
  }
}
