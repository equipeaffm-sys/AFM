'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ShieldCheck, Truck, Clock, Sparkles, Tag } from 'lucide-react'
import { BLUR_DATA_URL, Product } from '@/lib/constants'
import { useCurrency } from '@/components/CurrencyContext'
import { useLanguage } from '@/components/LanguageContext'
import { DEFAULT_SITE_SETTINGS, SiteSettings, HomepageSection, sanitizeSiteSettings } from '@/lib/settings'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const { formatPrice } = useCurrency()
  const { t } = useLanguage()

  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS)
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [activeCategories, setActiveCategories] = useState<Array<{ id: string; name: string; slug: string; parent_id: string | null }>>([])

  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = createClient()
        const [{ data: settingsData }, productsResult, categoriesResult] = await Promise.all([
          supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'main_config')
            .single(),
          supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .gt('stock', 0)
            .order('created_at', { ascending: false })
            .limit(6),
          supabase
            .from('categories')
            .select('id, name, slug, parent_id')
            .eq('is_active', true),
        ])

        if (productsResult.error) throw productsResult.error
        if (categoriesResult.error) throw categoriesResult.error

        if (settingsData?.value) {
          setSiteSettings(sanitizeSiteSettings(settingsData.value))
        }
        const activeCategoryIds = new Set((categoriesResult.data || []).map((category) => category.id))
        setActiveCategories(categoriesResult.data || [])
        setFeaturedProducts(
          (productsResult.data || []).filter(
            (product) => !product.category_id || activeCategoryIds.has(product.category_id)
          )
        )
      } catch (error) {
        console.error('Unable to load homepage content:', error)
        setSiteSettings(DEFAULT_SITE_SETTINGS)
        setFeaturedProducts([])
        setActiveCategories([])
      }
    }
    loadSettings()
  }, [])

  // Render individual sections dynamically based on siteSettings.homepage_sections
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'hero':
        return (
          <section
            key="hero"
            className="relative isolate flex min-h-[460px] h-[68svh] max-h-[680px] items-center overflow-hidden bg-[#292720]"
          >
            <div className="absolute inset-0 -z-10">
              <Image
                src={siteSettings.hero_image_url}
                alt=""
                fill
                priority
                sizes="100vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="hero-image-drift object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#292720]/75 via-[#292720]/35 to-[#292720]/5" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#292720]/25 via-transparent to-[#292720]/10" />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-16 sm:px-10 lg:px-12">
              <div className="max-w-3xl space-y-6 sm:space-y-8">
                <div className="motion-rise inline-flex items-center gap-2.5 border border-white/30 bg-black/20 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-white backdrop-blur-sm sm:text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-[#c2b18f]" />
                  {t.heroBadge}
                </div>
                <h1 className="fluid-heading letterspace-hover motion-rise font-serif font-medium leading-[1.08] tracking-tight text-white" style={{ animationDelay: '100ms' }}>
                  {siteSettings.hero_title}
                  <span className="mt-2 block font-normal italic text-[#c2b18f]">
                    Maison L&amp;M
                  </span>
                </h1>
                <p className="motion-rise max-w-xl text-sm leading-7 text-white/85 sm:text-base sm:leading-8 md:text-lg" style={{ animationDelay: '180ms' }}>
                  {siteSettings.hero_subtitle}
                </p>
                <div className="motion-rise flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center" style={{ animationDelay: '260ms' }}>
                <Link
                  href={siteSettings.hero_cta_link}
                  className="motion-link button-sheen group inline-flex min-h-12 items-center justify-center gap-3 bg-[#ddd7ca] px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-900 transition-colors duration-300 hover:bg-[#c8bea9] sm:min-w-56"
                >
                  <span className="button-label">
                    <span>{siteSettings.hero_cta_text}</span>
                    <span aria-hidden="true">{siteSettings.hero_cta_text}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="motion-link button-sheen inline-flex min-h-12 items-center justify-center border border-white/30 bg-black/10 px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-100 hover:border-white/60 hover:bg-white/[0.08] sm:min-w-48"
                >
                  <span className="button-label">
                    <span>{t.accountSpace}</span>
                    <span aria-hidden="true">{t.accountSpace}</span>
                  </span>
                </Link>
                </div>
              </div>
            </div>
          </section>
        )

      case 'featured':
        if (featuredProducts.length === 0) return null
        return (
          <section key="featured" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="mx-auto mb-10 max-w-2xl space-y-3 text-center sm:mb-14">
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#b6a17d] sm:text-xs">{t.featuredTag}</span>
              <h2 className="font-serif text-3xl font-medium text-[#e8e5de] sm:text-4xl md:text-5xl">{t.featuredTitle}</h2>
              <p className="text-sm font-light leading-6 text-zinc-400 sm:text-base">
                {t.featuredSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} formatPrice={formatPrice} tView={t.viewPiece} />
              ))}
            </div>

            <div className="mt-10 text-center sm:mt-14">
              <Link
                href="/products"
                className="inline-flex min-h-12 items-center justify-center gap-3 border border-white/20 px-7 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-200 transition-colors duration-300 hover:border-white/40 hover:bg-white/[0.06] hover:text-white"
              >
                {t.exploreAll}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )

      case 'categories': {
        if (activeCategories.length === 0) return null
        const topLevelCategories = activeCategories.filter((category) => !category.parent_id)
        const visibleCategories = (topLevelCategories.length > 0 ? topLevelCategories : activeCategories).slice(0, 8)
        return (
          <section key="categories" className="border-y border-white/[0.07] bg-[#20211f] py-14 sm:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#b6a17d]">Explorer</span>
                  <h2 className="mt-2 font-serif text-2xl font-medium text-[#e8e5de] sm:text-3xl">Les univers de la boutique</h2>
                </div>
                <Link href="/products" className="motion-link inline-flex items-center gap-2 text-xs font-medium text-[#c9c0af] hover:text-white">
                  Tous les articles <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {visibleCategories.map((category, index) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="motion-card group flex min-h-28 flex-col justify-between rounded-xl border border-white/[0.08] bg-[#262724] p-4 hover:border-[#8f8065]/60 hover:bg-[#2b2c29] sm:min-h-32 sm:p-5"
                    style={{ animationDelay: `${Math.min(index, 7) * 55}ms` }}
                  >
                    <span className="font-mono text-[10px] tracking-[0.18em] text-[#a99876]">0{index + 1}</span>
                    <span className="flex items-end justify-between gap-2 font-serif text-sm text-[#e5e1d8] transition-colors group-hover:text-white sm:text-base">
                      <span className="line-clamp-2">{category.name}</span>
                      <ArrowRight className="mb-0.5 h-4 w-4 shrink-0 text-[#a99876] transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )
      }

      case 'reassurance':
        return (
          <section key="reassurance" className="border-t border-white/[0.07] bg-[#20211f] py-14 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                <div className="space-y-4 p-8 rounded-2xl bg-[#262724] border border-white/[0.08] shadow-sm">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#b6a17d]/10 border border-[#b6a17d]/25 flex items-center justify-center text-[#b6a17d]">
                    <Truck className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-lg font-medium text-[#e8e5de]">{t.secureDelivery}</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed font-light">
                    {t.secureDeliveryDesc}
                  </p>
                </div>

                <div className="space-y-4 p-8 rounded-2xl bg-[#262724] border border-white/[0.08] shadow-sm">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#b6a17d]/10 border border-[#b6a17d]/25 flex items-center justify-center text-[#b6a17d]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-lg font-medium text-[#e8e5de]">{t.certificate}</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed font-light">
                    {t.certificateDesc}
                  </p>
                </div>

                <div className="space-y-4 p-8 rounded-2xl bg-[#262724] border border-white/[0.08] shadow-sm">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#b6a17d]/10 border border-[#b6a17d]/25 flex items-center justify-center text-[#b6a17d]">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-lg font-medium text-[#e8e5de]">{t.concierge}</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed font-light">
                    {t.conciergeDesc}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#191a19] text-[#e6e3dc]">
      {siteSettings.homepage_sections
        .filter((s: HomepageSection) => s.is_active)
        .flatMap((s: HomepageSection) =>
          s.id === 'featured'
            ? [renderSection('categories'), renderSection(s.id)]
            : s.id === 'hero' && !siteSettings.homepage_sections.some((section) => section.id === 'featured' && section.is_active)
              ? [renderSection(s.id), renderSection('categories')]
            : [renderSection(s.id)]
        )}

    </div>
  )
}

function ProductCard({
  product,
  formatPrice,
  tView,
}: {
  product: Product
  formatPrice: (p: number) => string
  tView: string
}) {
  const [hovered, setHovered] = useState(false)
  const primaryImg = product.images[0]
  const secondaryImg = product.images[1] || primaryImg

  const hasSale = !!product.sale_price_cents

  return (
    <Link
      href={`/products/${product.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="motion-card group flex flex-col overflow-hidden border border-white/[0.09] bg-[#242523] hover:border-[#8f8065]/60"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#2d2e2b]">
        {primaryImg && (
          <>
            <Image
              src={primaryImg}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className={`object-cover transition-[opacity,transform] duration-700 ${hovered && secondaryImg !== primaryImg ? 'opacity-0' : 'opacity-100'}`}
            />
            {secondaryImg !== primaryImg && (
              <Image
                src={secondaryImg}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                aria-hidden="true"
                className={`object-cover transition-[opacity,transform] duration-700 ${hovered ? 'opacity-100' : 'opacity-0'}`}
              />
            )}
          </>
        )}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5 sm:left-4 sm:top-4">
          <span className="px-3 py-1 bg-[#191a19]/90 backdrop-blur-md text-[#c2b18f] text-[10px] uppercase tracking-[0.2em] rounded-full font-semibold">
            {product.category}
          </span>
          {hasSale && (
            <span className="flex items-center gap-1 rounded-full bg-[#b6a17d] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#191a19] shadow-sm">
              <Tag className="w-3 h-3" />
              Prix réduit
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between space-y-4 p-4 sm:p-5">
        <div>
          <h3 className="font-serif text-lg font-medium text-[#e8e5de] transition-colors group-hover:text-[#c2b18f] sm:text-xl">
            {product.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-xs font-light leading-relaxed text-zinc-400">
            {product.description}
          </p>
        </div>
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
          <div>
            {hasSale ? (
              <div className="space-x-2">
                <span className="text-xs text-zinc-400 line-through font-mono">
                  {formatPrice(product.price_cents)}
                </span>
                <span className="font-serif text-lg font-semibold text-[#e8e5de]">
                  {formatPrice(product.sale_price_cents!)}
                </span>
              </div>
            ) : (
              <span className="font-serif text-lg font-semibold text-[#e8e5de]">
                {formatPrice(product.price_cents)}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 transition-colors group-hover:text-[#e8e5de] sm:text-xs">
            {tView} &rarr;
          </span>
        </div>
      </div>
    </Link>
  )
}
