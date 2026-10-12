import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DogDetailClient from './DogDetailClient'

interface Props {
  params: { slug: string }
}

async function getDog(slug: string) {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('dogs')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()
    return data ?? null
  } catch (error) {
    console.error('Unable to load dog:', error)
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dog = await getDog(params.slug)
  const name = dog?.name || 'Compagnon'
  const description = dog?.description || dog?.breed || ''
  const mainImage = Array.isArray(dog?.images) ? dog?.images?.[0] : undefined

  return {
    title: `${name} | Nos chiens`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      ...(mainImage ? { images: [{ url: mainImage, width: 1200, height: 630, alt: name }] } : {}),
    },
  }
}

export default async function DogDetailPage({ params }: Props) {
  const dog = await getDog(params.slug)
  if (!dog) notFound()
  return <DogDetailClient dog={dog} />
}
