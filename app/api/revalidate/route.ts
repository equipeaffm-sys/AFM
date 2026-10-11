import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const path = body.path || '/'
    const type = body.type || 'layout'

    if (type === 'layout') {
      revalidatePath(path, 'layout')
    } else {
      revalidatePath(path, 'page')
    }

    revalidatePath('/products')
    revalidatePath('/category/[slug]', 'page')

    return NextResponse.json({ revalidated: true, path, type, now: Date.now() })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ revalidated: false, error: error.message }, { status: 500 })
  }
}
