import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json(
      { error: 'Veuillez vous connecter pour valider votre commande.' },
      { status: 401 }
    )
  }

  return NextResponse.json(
    {
      error:
        'Les conditions de livraison ne sont pas encore configurées. La validation des commandes est temporairement indisponible.',
    },
    { status: 503 }
  )
}
