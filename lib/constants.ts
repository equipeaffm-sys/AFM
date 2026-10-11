export interface Product {
  id: string
  title: string
  description: string
  price_cents: number
  sale_price_cents?: number | null
  sale_ends_at?: string | null
  cost_price_cents?: number | null
  stock: number
  low_stock_threshold?: number
  images: string[]
  category: string
  category_id?: string | null
  is_active?: boolean
  created_at?: string
}

export const FALLBACK_PRODUCTS: Product[] = []

export const BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMDREMEREIi8+PC9zdmc+'
