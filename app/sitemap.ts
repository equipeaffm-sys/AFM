import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lm-maison.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let products: Array<{ id: string; updated_at?: string }> = []

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('products')
      .select('id, updated_at')
      .eq('is_active', true)
      .gt('stock', 0)
    if (!error && data) {
      products = data
    }
  } catch {
    products = []
  }

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/mentions-legales`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cgv`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/politique-de-confidentialite`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  products.forEach((product) => {
    routes.push({
      url: `${baseUrl}/products/${product.id}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  })

  return routes
}
