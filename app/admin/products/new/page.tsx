'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Sparkles } from 'lucide-react'
import ProductForm, { ProductFormData } from '@/components/ProductForm'
import toast from 'react-hot-toast'

export default function NewProductPage() {
  const router = useRouter()

  const handleCreateProduct = async (formData: ProductFormData) => {
    try {
      const supabase = createClient()

      const newProduct = {
        title: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        price_cents: Math.round(formData.priceEuros * 100),
        cost_price_cents: Math.round(formData.costPriceEuros * 100),
        sale_price_cents:
          formData.salePriceEuros === null ? null : Math.round(formData.salePriceEuros * 100),
        sale_ends_at: formData.salePriceEuros === null || !formData.saleEndsAt
          ? null
          : `${formData.saleEndsAt}T23:59:59.999Z`,
        stock: formData.stock,
        low_stock_threshold: formData.lowStockThreshold,
        category: formData.categoryName,
        category_id: formData.categoryId || null,
        images: formData.images,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
      }

      const { error } = await supabase.from('products').insert(newProduct)

      if (error) throw error

      toast.success('Nouvelle création ajoutée au catalogue.')
      router.push('/admin/products')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de créer le produit.')
    }
  }

  return (
    <div className="bg-[#FEFDF5] text-zinc-900 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600 hover:text-[#C5A059] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au Catalogue Admin
          </Link>
          <span className="text-xs uppercase tracking-widest text-[#C5A059] font-bold">
            New Creation
          </span>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-[#C5A059]">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Atelier de Création</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-zinc-950">
            Ajouter une Nouvelle Création
          </h1>
          <p className="text-zinc-600 text-xs font-light">
            Complétez la fiche, ajoutez vos visuels, définissez les prix et le stock, puis choisissez de publier maintenant ou d’enregistrer en brouillon.
          </p>
        </div>

        <ProductForm onSubmit={handleCreateProduct} buttonText="Créer le Produit" />
      </div>
    </div>
  )
}
