import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const jsonHeaders = { 'Cache-Control': 'no-store' }

export async function GET() {
  return NextResponse.json(
    { configured: Boolean(process.env.CHAT_API_KEY) },
    { headers: jsonHeaders }
  )
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > 20_000) {
    return NextResponse.json(
      { error: 'Le message envoyé est trop volumineux.' },
      { status: 413, headers: jsonHeaders }
    )
  }

  const apiKey = process.env.CHAT_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Le conseiller n’est pas configuré pour le moment.' },
      { status: 503, headers: jsonHeaders }
    )
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'La requête doit contenir un JSON valide.' },
      { status: 400, headers: jsonHeaders }
    )
  }

  const rawMessages = (payload as { messages?: unknown } | null)?.messages
  if (!Array.isArray(rawMessages) || rawMessages.length === 0 || rawMessages.length > 10) {
    return NextResponse.json(
      { error: 'La conversation contient un nombre de messages invalide.' },
      { status: 400, headers: jsonHeaders }
    )
  }

  const messages: ChatMessage[] = []
  for (const item of rawMessages) {
    if (
      !item ||
      typeof item !== 'object' ||
      !('role' in item) ||
      !('content' in item) ||
      !['user', 'assistant'].includes(String(item.role)) ||
      typeof item.content !== 'string' ||
      item.content.trim().length === 0 ||
      item.content.length > 1000
    ) {
      return NextResponse.json(
        { error: 'Un message est invalide ou dépasse la longueur autorisée.' },
        { status: 400, headers: jsonHeaders }
      )
    }
    if (item.role !== 'user' && item.role !== 'assistant') {
      return NextResponse.json(
        { error: 'Le rôle du message est invalide.' },
        { status: 400, headers: jsonHeaders }
      )
    }
    messages.push({ role: item.role, content: item.content.trim() })
  }

  if (messages[messages.length - 1].role !== 'user') {
    return NextResponse.json(
      { error: 'Le dernier message doit être une question du client.' },
      { status: 400, headers: jsonHeaders }
    )
  }

  const endpoint =
    process.env.CHAT_API_URL || 'https://api.groq.com/openai/v1/chat/completions'
  let endpointUrl: URL
  try {
    endpointUrl = new URL(endpoint)
  } catch {
    console.error('CHAT_API_URL must be a valid URL.')
    return NextResponse.json(
      { error: 'Le service de réponse est mal configuré.' },
      { status: 500, headers: jsonHeaders }
    )
  }
  if (endpointUrl.protocol !== 'https:' && endpointUrl.hostname !== 'localhost') {
    console.error('CHAT_API_URL must use HTTPS outside localhost.')
    return NextResponse.json(
      { error: 'Le service de réponse est mal configuré.' },
      { status: 500, headers: jsonHeaders }
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)
  try {
    const upstream = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.CHAT_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Tu es le conseiller de la boutique L&M. Réponds dans la langue utilisée par le client, avec un ton chaleureux, concis et honnête. Ne prétends jamais qu’un article, une matière, une marque, une livraison, un délai, un retour ou une garantie est disponible ou confirmé si cela n’est pas indiqué dans la conversation. N’invente pas de prix ni de caractéristiques. Oriente le client vers le catalogue ou la fiche produit pour les informations exactes. Ne demande jamais de données personnelles ou de paiement.',
          },
          ...messages,
        ],
        temperature: 0.5,
        max_tokens: 350,
      }),
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!upstream.ok) {
      console.error(`Chat provider returned HTTP ${upstream.status}.`)
      return NextResponse.json(
        { error: 'Le conseiller ne peut pas répondre pour le moment. Réessayez plus tard.' },
        { status: 502, headers: jsonHeaders }
      )
    }

    const result: unknown = await upstream.json()
    const message = (
      result as { choices?: Array<{ message?: { content?: unknown } }> }
    )?.choices?.[0]?.message?.content
    if (typeof message !== 'string' || !message.trim()) {
      console.error('Chat provider returned an empty or invalid response.')
      return NextResponse.json(
        { error: 'Le conseiller a retourné une réponse invalide.' },
        { status: 502, headers: jsonHeaders }
      )
    }

    return NextResponse.json({ message: message.trim() }, { headers: jsonHeaders })
  } catch (error) {
    console.error(
      error instanceof Error && error.name === 'AbortError'
        ? 'Chat provider request timed out.'
        : 'Unable to reach chat provider.'
    )
    return NextResponse.json(
      { error: 'Le conseiller ne peut pas répondre pour le moment. Réessayez plus tard.' },
      { status: 502, headers: jsonHeaders }
    )
  } finally {
    clearTimeout(timeout)
  }
}
