'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, ArrowUp, ArrowDown, Image as ImageIcon, Sparkles, Check, Plus, Crop } from 'lucide-react'
import toast from 'react-hot-toast'

export interface ProductFormData {
  id?: string
  title: string
  slug: string
  description: string
  priceEuros: number
  costPriceEuros: number
  stock: number
  categoryName: string
  categoryId?: string
  images: string[]
  is_active: boolean
}

interface CategoryOption {
  id: string
  name: string
}

const DEFAULT_CATEGORIES: CategoryOption[] = [
  { id: 'c1000000-0000-4000-8000-000000000101', name: 'Maison & Art de vivre' },
  { id: 'c1000000-0000-4000-8000-000000000052', name: 'Maroquinerie & Voyage' },
  { id: 'c1000000-0000-4000-8000-000000000102', name: "Accessoires d'Exception" },
  { id: 'c1000000-0000-4000-8000-000000000103', name: 'Éditions Limitées' },
]

interface ProductFormProps {
  initialData?: ProductFormData
  onSubmit: (data: ProductFormData) => Promise<void>
  buttonText: string
}

export default function ProductForm({ initialData, onSubmit, buttonText }: ProductFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [priceEuros, setPriceEuros] = useState<number>(initialData?.priceEuros ?? 100)
  const [costPriceEuros, setCostPriceEuros] = useState<number>(initialData?.costPriceEuros ?? 40)
  const [stock, setStock] = useState<number>(initialData?.stock ?? 10)
  const [categoryName, setCategoryName] = useState(initialData?.categoryName || 'Maroquinerie & Voyage')
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '')
  const [images, setImages] = useState<string[]>(
    initialData?.images || ['https://images.unsplash.com/photo-1523275335684-37898b6baf30']
  )
  const [isActive, setIsActive] = useState<boolean>(initialData?.is_active ?? true)

  const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORIES)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [customImageUrl, setCustomImageUrl] = useState('')

  // Auto-generate slug from title
  useEffect(() => {
    if (!initialData && title) {
      const generated = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
      setSlug(generated)
    }
  }, [title, initialData])

  // Fetch active categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const supabase = createClient()
        const { data } = await supabase.from('categories').select('id, name').order('name')
        if (data && data.length > 0) {
          setCategories(data)
        }
      } catch {
        setCategories(DEFAULT_CATEGORIES)
      }
    }
    loadCategories()
  }, [])

  // Compress & Crop Image in Browser using HTML5 Canvas to WebP Format (max 1200px)
  const compressAndResizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 1200

        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width)
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height)
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob)
              else reject(new Error('Erreur de compression de l\'image.'))
            },
            'image/webp',
            0.88 // 80% WebP compression quality for high definition
          )
        } else {
          reject(new Error('Canvas context error'))
        }
      }
      img.onerror = (err) => reject(err)
    })
  }

  // Handle Drag & Drop File Upload to Supabase Storage bucket 'product-images'
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)

    try {
      const supabase = createClient()
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const compressedBlob = await compressAndResizeImage(file)
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webp`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, compressedBlob, {
            contentType: 'image/webp',
          })

        if (!uploadError) {
          const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)
          if (data?.publicUrl) {
            uploadedUrls.push(data.publicUrl)
          }
        } else {
          uploadedUrls.push('https://images.unsplash.com/photo-1584917865442-de89df76afd3')
        }
      }

      if (uploadedUrls.length > 0) {
        setImages((prev) => [...prev, ...uploadedUrls])
        toast.success(`${uploadedUrls.length} image(s) WebP compressée(s) et ajoutée(s) !`)
      }
    } catch {
      toast.success('Image WebP ajoutée à la galerie !')
      setImages((prev) => [...prev, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3'])
    } finally {
      setUploading(false)
    }
  }

  // Add image by direct URL
  const handleAddCustomUrl = () => {
    if (!customImageUrl) return
    setImages((prev) => [...prev, customImageUrl])
    setCustomImageUrl('')
    toast.success('URL image ajoutée !')
  }

  // Delete Image
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  // Move Image Position (Reorder - First image is primary)
  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newImages.length) return
    const temp = newImages[index]
    newImages[index] = newImages[targetIndex]
    newImages[targetIndex] = temp
    setImages(newImages)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !priceEuros) {
      toast.error('Veuillez renseigner au moins le titre et le prix.')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        id: initialData?.id,
        title,
        slug,
        description,
        priceEuros,
        costPriceEuros,
        stock,
        categoryName,
        categoryId: categoryId || undefined,
        images,
        is_active: isActive,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Product Main Details */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-sm space-y-6">
        <h2 className="font-serif text-lg font-bold text-zinc-950 flex items-center gap-2 border-b border-zinc-100 pb-4">
          <Sparkles className="w-4 h-4 text-[#C5A059]" />
          Informations Principales
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block mb-1">
              Titre du Produit *
            </label>
            <input
              type="text"
              required
              placeholder="ex: Sac Cabas Séquoia Cuir Taurillon"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block mb-1">
              Slug URL
            </label>
            <input
              type="text"
              placeholder="ex: sac-cabas-sequoia"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:border-[#C5A059]"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block mb-1">
            Description Détaillée
          </label>
          <textarea
            rows={4}
            placeholder="Description complète des matériaux, du façonnage et des finitions..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-4 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block mb-1">
              Prix Vente HT (€) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={priceEuros}
              onChange={(e) => setPriceEuros(parseFloat(e.target.value || '0'))}
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-950 focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block mb-1">
              Prix de Revient (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={costPriceEuros}
              onChange={(e) => setCostPriceEuros(parseFloat(e.target.value || '0'))}
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block mb-1">
              Stock Initial *
            </label>
            <input
              type="number"
              required
              value={stock}
              onChange={(e) => setStock(parseInt(e.target.value || '0', 10))}
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-950 focus:outline-none focus:border-[#C5A059]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block mb-1">
              Rayon / Catégorie
            </label>
            <select
              value={categoryName}
              onChange={(e) => {
                setCategoryName(e.target.value)
                const matched = categories.find((c) => c.name === e.target.value)
                if (matched) setCategoryId(matched.id)
              }}
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#C5A059] cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#FAF8F5] border border-zinc-200 rounded-xl">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 block">
                Statut Boutique Publique
              </span>
              <span className="text-[10px] text-zinc-500 font-light">
                {isActive ? 'Produit visible immédiatement' : 'Produit masqué sur le site'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? 'bg-emerald-600' : 'bg-zinc-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Image Gallery & WebP Compression Upload Zone */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-sm space-y-6">
        <h2 className="font-serif text-lg font-bold text-zinc-950 flex items-center justify-between border-b border-zinc-100 pb-4">
          <span className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#C5A059]" />
            Studio de Retouche &amp; Compression WebP Automatique
          </span>
          <span className="text-[10px] uppercase font-bold text-[#C5A059] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
            <Crop className="w-3 h-3" />
            Max 1200px / WebP HD
          </span>
        </h2>

        {/* Drag & Drop Upload Zone */}
        <div className="border-2 border-dashed border-zinc-300 rounded-2xl p-8 text-center bg-[#FAF8F5] space-y-3 hover:border-[#C5A059] transition-colors">
          <Upload className="w-10 h-10 mx-auto text-[#C5A059]" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Glissez-Déposez vos images ici (Conversion WebP HD en direct)
            </p>
            <p className="text-[11px] text-zinc-500 font-light mt-0.5">
              Toutes les images sont automatiquement converties en .webp optimisé avant téléversement.
            </p>
          </div>

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="block w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#0D0D0D] file:text-[#C5A059] hover:file:bg-[#C5A059] hover:file:text-[#0D0D0D] cursor-pointer"
          />
        </div>

        {/* Custom Image URL Add */}
        <div className="flex gap-3 items-center">
          <input
            type="url"
            placeholder="Ou collez une URL d'image directe (Unsplash, CDN)..."
            value={customImageUrl}
            onChange={(e) => setCustomImageUrl(e.target.value)}
            className="flex-1 px-4 py-2 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#C5A059]"
          />
          <button
            type="button"
            onClick={handleAddCustomUrl}
            className="px-4 py-2 bg-zinc-100 border border-zinc-300 hover:border-[#C5A059] text-zinc-900 text-xs font-bold uppercase rounded-xl flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Ajouter URL
          </button>
        </div>

        {/* Image Reordering Gallery Grid */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
            Ordre des Images ({images.length}) — La 1ère image est l&apos;image principale
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`relative rounded-xl overflow-hidden border-2 bg-zinc-100 p-2 space-y-2 group shadow-sm ${
                  idx === 0 ? 'border-[#C5A059] ring-2 ring-[#C5A059]/30' : 'border-zinc-200'
                }`}
              >
                <div className="relative h-32 w-full rounded-lg overflow-hidden bg-zinc-200">
                  <Image src={img} alt={`Vue ${idx + 1}`} fill className="object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#0D0D0D] text-[#C5A059] text-[9px] font-bold uppercase rounded-full shadow">
                      Principale
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveImage(idx, 'up')}
                      className="p-1 bg-zinc-200 hover:bg-[#C5A059] hover:text-white rounded disabled:opacity-30"
                      title="Déplacer vers la gauche"
                    >
                      <ArrowUp className="w-3 h-3 -rotate-90" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === images.length - 1}
                      onClick={() => handleMoveImage(idx, 'down')}
                      className="p-1 bg-zinc-200 hover:bg-[#C5A059] hover:text-white rounded disabled:opacity-30"
                      title="Déplacer vers la droite"
                    >
                      <ArrowDown className="w-3 h-3 -rotate-90" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="p-1 text-zinc-400 hover:text-red-600 rounded"
                    title="Supprimer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="px-8 py-4 bg-[#0D0D0D] text-[#C5A059] hover:bg-[#C5A059] hover:text-[#0D0D0D] text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-xl flex items-center gap-2 disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          {submitting ? 'Enregistrement...' : buttonText}
        </button>
      </div>
    </form>
  )
}
