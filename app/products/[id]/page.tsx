import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ProductDetailClient from './ProductDetailClient'

type Props = {
  params: { id: string }
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const id = params.id
  let product: { title: string; description: string; images?: string[] } | null = null

  try {
    const supabase = createClient()
    const { data } = await supabase.from('products').select('title, description, images').eq('id', id).single()
    if (data) {
      product = data
    }
  } catch (error) {
    console.error('Unable to load product metadata:', error)
  }

  const title = product?.title || 'Produit'
  const description = product?.description || ''
  const mainImage = product?.images?.[0]

  return {
    title: title,
    description: description,
    openGraph: {
      title: `${title} | L&M Maison de Luxe`,
      description: description,
      type: 'article',
      ...(mainImage && {
        images: [{ url: mainImage, width: 1200, height: 630, alt: title }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | L&M Maison de Luxe`,
      description: description,
      ...(mainImage && { images: [mainImage] }),
    },
  }
}

export default function Page({ params }: Props) {
  return <ProductDetailClient productId={params.id} />
}
