import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Product, FALLBACK_PRODUCTS } from './constants'

export { BLUR_DATA_URL, FALLBACK_PRODUCTS } from './constants'
export type { Product } from './constants'

export const getCachedProducts = unstable_cache(
  async (): Promise<Product[]> => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .gt('stock', 0)
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        return data
      }
      return FALLBACK_PRODUCTS.filter((p) => p.is_active && p.stock > 0)
    } catch {
      return FALLBACK_PRODUCTS.filter((p) => p.is_active && p.stock > 0)
    }
  },
  ['products-list-active'],
  {
    revalidate: 3600,
    tags: ['products'],
  }
)
