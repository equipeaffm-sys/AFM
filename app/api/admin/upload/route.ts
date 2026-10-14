import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { filename, contentType, base64 } = body as { filename?: string; contentType?: string; base64?: string }
    if (!filename || !base64) return NextResponse.json({ error: 'Invalid upload' }, { status: 400 })

    const buffer = Buffer.from(base64, 'base64')
    const key = `documents/${Date.now()}-${filename}`
    const { data, error } = await supabaseAdmin.storage.from('documents').upload(key, buffer, { contentType: contentType || 'application/octet-stream' })
    if (error) {
      console.error('Upload error', error)
      return NextResponse.json({ error: error.message || 'Upload error' }, { status: 500 })
    }
    const signed = await supabaseAdmin.storage.from('documents').createSignedUrl(key, 60 * 60 * 24 * 7)
    return NextResponse.json({ url: signed.data?.signedUrl || null })
  } catch (err: any) {
    console.error('Upload route error', err)
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 })
  }
}
