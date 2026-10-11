import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { BLUR_DATA_URL, Product } from '@/lib/constants'

type Props = {
  params: { slug: string }
}

export default async function CategoryPage({ params }: Props) {
  const slug = params.slug

  let category: { id: string; name: string; is_active: boolean } | null = null
  let products: Product[] = []
  let shouldRedirect = false

  try {
    const supabase = createClient()
    const { data: catData } = await supabase
      .from('categories')
      .select('id, name, is_active')
      .eq('slug', slug)
      .single()

    if (catData) {
      if (!catData.is_active) {
        shouldRedirect = true
      } else {
        category = catData

        const { data: prodData } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', catData.id)
          .eq('is_active', true)
          .gt('stock', 0)

        if (prodData) {
          products = prodData
        }
      }
    }
  } catch {
    // The category is unavailable when it cannot be loaded from the database.
  }

  if (shouldRedirect) {
    redirect('/')
  }

  if (!category) {
    redirect('/products')
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#252623_0%,_#1b1c1b_48%,_#191a19_100%)] px-4 py-10 text-[#e6e3dc] sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-[1440px] space-y-8">
        <div className="space-y-3 border-b border-white/[0.09] pb-7">
          <Link
            href="/products"
            className="text-xs font-medium text-zinc-400 underline decoration-zinc-600 underline-offset-4 transition-colors hover:text-white"
          >
            Catalogue
          </Link>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-[#eeeae2] sm:text-4xl lg:text-5xl">
            {category.name}
          </h1>
          <p className="text-sm text-zinc-400">
            {products.length} {products.length === 1 ? 'produit disponible' : 'produits disponibles'}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="flex min-h-[30vh] flex-col items-center justify-center space-y-4 rounded-2xl border border-white/[0.09] bg-[#222321] p-8 text-center">
            <p className="font-serif text-lg text-zinc-200">Aucun produit disponible dans cette catégorie.</p>
            <p className="text-sm text-zinc-400">Les produits publiés par la boutique apparaîtront ici.</p>
            <Link
              href="/products"
              className="rounded-lg border border-white/[0.12] px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-[#8f8065] hover:bg-white/[0.04]"
            >
              Voir tout le catalogue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="motion-card group flex flex-col overflow-hidden rounded-xl border border-white/[0.09] bg-[#242523] hover:border-[#8f8065]/60"
                style={{ animationDelay: `${Math.min(index, 7) * 65}ms` }}
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#2d2e2b]">
                  {product.images[0] && (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                      className="object-cover"
                    />
                  )}
                  {product.stock <= 0 && (
                    <span className="absolute bottom-3 left-3 rounded-md bg-[#242523]/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-200 shadow-sm">
                      Épuisé
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between space-y-3 p-3.5 sm:p-5">
                  <div>
                    <h2 className="line-clamp-2 font-serif text-sm font-semibold leading-snug text-zinc-200 transition-colors group-hover:text-[#c2b18f] sm:text-lg">
                      {product.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                      {product.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-white/[0.08] pt-3">
                    <span className="font-serif text-sm font-semibold text-zinc-200 sm:text-lg">
                      {(product.price_cents / 100).toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold text-zinc-400 transition-colors group-hover:text-[#c2b18f] sm:text-xs">
                      Voir le produit <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
