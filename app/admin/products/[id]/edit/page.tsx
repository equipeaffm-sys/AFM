'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Edit3 } from 'lucide-react'
import ProductForm, { ProductFormData } from '@/components/ProductForm'
import toast from 'react-hot-toast'

export default function EditProductPage() {
  const params = useParams()
  const productId = params?.id as string
  const router = useRouter()

  const [initialData, setInitialData] = useState<ProductFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()

        if (error) throw error
        if (data) {
          setInitialData({
            id: data.id,
            title: data.title,
            slug: data.slug || data.title.toLowerCase().replace(/\s+/g, '-'),
            description: data.description || '',
            priceEuros: data.price_cents / 100,
            costPriceEuros: data.cost_price_cents ? data.cost_price_cents / 100 : 0,
            stock: data.stock,
            categoryName: data.category,
            categoryId: data.category_id || '',
            images: data.images || [],
            is_active: data.is_active ?? true,
          })
        }
      } catch {
        setInitialData(null)
        setLoadError(true)
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const handleUpdateProduct = async (formData: ProductFormData) => {
    try {
      const supabase = createClient()

      const updatedRecord = {
        title: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        price_cents: Math.round(formData.priceEuros * 100),
        cost_price_cents: Math.round(formData.costPriceEuros * 100),
        stock: formData.stock,
        category: formData.categoryName,
        category_id: formData.categoryId || null,
        images: formData.images,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('products')
        .update(updatedRecord)
        .eq('id', productId)

      if (error) {
        toast.error('Impossible de mettre à jour le produit.')
        return
      }

      toast.success(`Produit "${formData.title}" mis à jour.`)
      router.push('/admin/products')
      router.refresh()
    } catch {
      toast.error('Impossible de mettre à jour le produit.')
      return
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#FEFDF5] text-zinc-500 font-serif text-sm">
        Chargement de la fiche d&apos;édition...
      </div>
    )
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
            Edit Creation
          </span>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-[#C5A059]">
            <Edit3 className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Édition &amp; Galerie Visuelle</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-zinc-950">
            Éditer la Création : {initialData?.title}
          </h1>
          <p className="text-zinc-600 text-xs font-light">
            Modifiez la galerie visuelle, réordonnez les images et mettez à jour le prix ou le stock en direct.
          </p>
        </div>

        {loadError ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
            Produit introuvable ou impossible à charger.
          </div>
        ) : initialData && (
          <ProductForm
            initialData={initialData}
            onSubmit={handleUpdateProduct}
            buttonText="Enregistrer les Modifications"
          />
        )}
      </div>
    </div>
  )
}
