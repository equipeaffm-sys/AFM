import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'legal_info').maybeSingle()
    if (error) throw error
    return NextResponse.json(data ?? { value: null })
  } catch (err: any) {
    console.error('Unable to read legal info:', err)
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Expecting an object with keys: siret, rna, acaced, icad, certificate_url, acaced_url
    const supabase = createClient()
    const value = body || {}
    const payload = { key: 'legal_info', value }

    const { data, error } = await supabase.from('site_settings').upsert(payload, { returning: 'minimal' })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Unable to save legal info:', err)
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 })
  }
}
