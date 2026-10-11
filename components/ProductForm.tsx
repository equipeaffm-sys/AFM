'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, ArrowUp, ArrowDown, Image as ImageIcon, Sparkles, Check, Plus, Crop, FolderTree, Star } from 'lucide-react'
import toast from 'react-hot-toast'

export interface ProductFormData {
  id?: string
  title: string
  slug: string
  description: string
  priceEuros: number
  costPriceEuros: number
  salePriceEuros: number | null
  saleEndsAt: string
  stock: number
  lowStockThreshold: number
  categoryName: string
  categoryId?: string
  images: string[]
  is_active: boolean
  is_featured: boolean
}

interface CategoryOption {
  id: string
  name: string
}

interface ProductFormProps {
  initialData?: ProductFormData
  onSubmit: (data: ProductFormData) => Promise<void>
  buttonText: string
}

export default function ProductForm({ initialData, onSubmit, buttonText }: ProductFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [priceEuros, setPriceEuros] = useState<number>(initialData?.priceEuros ?? 0)
  const [costPriceEuros, setCostPriceEuros] = useState<number>(initialData?.costPriceEuros ?? 0)
  const [salePriceEuros, setSalePriceEuros] = useState<number | null>(initialData?.salePriceEuros ?? null)
  const [saleEndsAt, setSaleEndsAt] = useState(initialData?.saleEndsAt || '')
  const [stock, setStock] = useState<number>(initialData?.stock ?? 0)
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(initialData?.lowStockThreshold ?? 3)
  const [categoryName, setCategoryName] = useState(initialData?.categoryName || '')
  const [categoryId, setCategoryId] = useState(
    initialData?.categoryId || (initialData?.categoryName ? '__current__' : '')
  )
  const [images, setImages] = useState<string[]>(initialData?.images || [])
  const [isActive, setIsActive] = useState<boolean>(initialData?.is_active ?? true)
  const [isFeatured, setIsFeatured] = useState<boolean>(initialData?.is_featured ?? false)

  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [customImageUrl, setCustomImageUrl] = useState('')
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)

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
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .eq('is_active', true)
          .order('name')
        if (error) throw error
        setCategories(data || [])
      } catch (error) {
        console.error('Unable to load product categories:', error)
        setCategoriesError('Impossible de charger les catégories.')
      } finally {
        setCategoriesLoading(false)
      }
    }
    loadCategories()
  }, [])

  // Compress & Crop Image in Browser using HTML5 Canvas to WebP Format (max 1200px)
  const compressAndResizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      const objectUrl = URL.createObjectURL(file)
      img.src = objectUrl
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
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
            0.88
          )
        } else {
          reject(new Error('Canvas context error'))
        }
      }
      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl)
        reject(err)
      }
    })
  }

  // Handle Drag & Drop File Upload to Supabase Storage bucket 'product-images'
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const selectedFiles = Array.from(files)
    const invalidFile = selectedFiles.find(
      (file) => !file.type.startsWith('image/') || file.size > 10 * 1024 * 1024
    )
    if (invalidFile) {
      toast.error(
        invalidFile.size > 10 * 1024 * 1024
          ? `${invalidFile.name} dépasse la limite de 10 Mo.`
          : `${invalidFile.name} n’est pas un fichier image.`
      )
      return
    }
    setUploading(true)

    try {
      const supabase = createClient()
      const uploadedUrls: string[] = []
      const failures: string[] = []

      for (const file of selectedFiles) {
        let compressedBlob: Blob
        try {
          compressedBlob = await compressAndResizeImage(file)
        } catch (error) {
          console.error(`Unable to process product image ${file.name}:`, error)
          failures.push(file.name)
          continue
        }
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webp`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, compressedBlob, {
            contentType: 'image/webp',
          })

        if (uploadError) {
          console.error(`Unable to upload product image ${file.name}:`, uploadError)
          failures.push(file.name)
          continue
        }
        const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)
        if (data?.publicUrl) uploadedUrls.push(data.publicUrl)
      }

      if (uploadedUrls.length > 0) {
        setImages((prev) => [...prev, ...uploadedUrls])
      }
      if (uploadedUrls.length > 0) toast.success(`${uploadedUrls.length} image(s) ajoutée(s).`)
      if (failures.length > 0) {
        toast.error(`${failures.length} image(s) n’ont pas pu être téléversées.`)
      }
    } catch {
      toast.error('Échec du téléversement. Vérifiez la configuration Supabase Storage.')
    } finally {
      setUploading(false)
    }
  }

  // Add image by direct URL
  const handleAddCustomUrl = () => {
    try {
      const url = new URL(customImageUrl)
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol')
      setImages((prev) => [...prev, url.toString()])
    } catch {
      toast.error('Saisissez une URL d’image valide (http ou https).')
      return
    }
    setCustomImageUrl('')
    toast.success('URL ajoutée à la galerie.')
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
    if (!title.trim()) {
      toast.error('Le nom du produit est obligatoire.')
      return
    }
    if (!Number.isFinite(priceEuros) || priceEuros < 0) {
      toast.error('Saisissez un prix de vente valide.')
      return
    }
    if (
      salePriceEuros !== null &&
      (!Number.isFinite(salePriceEuros) || salePriceEuros < 0 || salePriceEuros >= priceEuros)
    ) {
      toast.error('Le prix promotionnel doit être inférieur au prix normal.')
      return
    }
    if (salePriceEuros === null && saleEndsAt) setSaleEndsAt('')
    if (
      !Number.isInteger(stock) ||
      stock < 0 ||
      !Number.isInteger(lowStockThreshold) ||
      lowStockThreshold < 0 ||
      !Number.isFinite(costPriceEuros) ||
      costPriceEuros < 0
    ) {
      toast.error('Le stock et le seuil d’alerte doivent être des nombres entiers positifs.')
      return
    }
    if (!categoryName.trim()) {
      toast.error('Choisissez ou créez une catégorie avant d’enregistrer.')
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
        salePriceEuros,
        saleEndsAt,
        stock,
        lowStockThreshold,
        categoryName,
        categoryId: categoryId || undefined,
        images,
        is_active: isActive,
        is_featured: isFeatured,
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block mb-1">
              Prix de vente (€) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={priceEuros}
              onChange={(e) => setPriceEuros(e.target.value === '' ? Number.NaN : Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-950 focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block mb-1">
              Prix promotionnel (€)
            </label>
            <input
              type="number"
              min="0"
              max={priceEuros}
              step="0.01"
              value={salePriceEuros ?? ''}
              onChange={(e) => setSalePriceEuros(e.target.value === '' ? null : Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:border-[#C5A059]"
            />
            <p className="mt-1 text-[10px] text-zinc-500">Laisser vide s’il n’y a pas de promotion.</p>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block mb-1">
              Fin de promotion
            </label>
            <input
              type="date"
              value={saleEndsAt}
              disabled={salePriceEuros === null}
              onChange={(e) => setSaleEndsAt(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#C5A059] disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="mt-1 text-[10px] text-zinc-500">Optionnel ; la promotion reste active sans date.</p>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block mb-1">
              Prix de Revient (€)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={costPriceEuros}
              onChange={(e) => setCostPriceEuros(e.target.value === '' ? 0 : Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block mb-1">
              Stock actuel *
            </label>
            <input
              type="number"
              min="0"
              step="1"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value === '' ? Number.NaN : Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-950 focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block mb-1">
              Alerte stock bas
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value === '' ? Number.NaN : Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:border-[#C5A059]"
            />
            <p className="mt-1 text-[10px] text-zinc-500">Seuil utilisé dans les alertes de stock.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block mb-1">
              Catégorie *
            </label>
            {categoriesLoading ? (
              <div role="status" className="rounded-xl border border-zinc-200 bg-[#FAF8F5] px-4 py-3 text-xs text-zinc-500">
                Chargement des catégories…
              </div>
            ) : categories.length > 0 ? (
              <select
                required
                value={categoryId}
                onChange={(e) => {
                  if (e.target.value === '__current__') {
                    setCategoryId('')
                    setCategoryName(initialData?.categoryName || '')
                    return
                  }
                  const selected = categories.find((item) => item.id === e.target.value)
                  setCategoryId(selected?.id || '')
                  setCategoryName(selected?.name || '')
                }}
                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#C5A059] cursor-pointer"
              >
                <option value="">Choisir une catégorie…</option>
                {initialData?.categoryName &&
                  (!initialData.categoryId || !categories.some((item) => item.id === initialData.categoryId)) && (
                    <option value={initialData.categoryId || '__current__'}>
                      {initialData.categoryName} (actuelle)
                    </option>
                  )}
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
                <p>{categoriesError || 'Aucune catégorie active. Créez une catégorie avant d’ajouter un produit.'}</p>
                {initialData?.categoryName && (
                  <p className="mt-1">La catégorie actuelle « {initialData.categoryName} » sera conservée.</p>
                )}
              </div>
            )}
            <div className="mt-2 flex items-center justify-between gap-2">
              {categoriesError && <span role="status" className="text-[10px] text-amber-700">{categoriesError}</span>}
              <Link
                href="/admin/categories"
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#806238] hover:underline"
              >
                <FolderTree className="h-3 w-3" aria-hidden="true" />
                Gérer les catégories
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 p-4 bg-[#FAF8F5] border border-zinc-200 rounded-xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 block">
                  Publication
                </span>
                <span className="text-[10px] text-zinc-500 font-light">
                  {isActive ? 'Visible dans le catalogue public' : 'Enregistré comme brouillon masqué'}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                aria-label="Publier le produit"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#C5A059] ${
                  isActive ? 'bg-emerald-600' : 'bg-zinc-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                    isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-[#FAF8F5] p-4">
              <span>
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-900">
                  <Star className="h-3.5 w-3.5 text-[#C5A059]" aria-hidden="true" />
                  Produit à la une
                </span>
                <span className="mt-1 block text-[10px] text-zinc-500">Mise en avant sur la boutique si l’accueil le permet.</span>
              </span>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 accent-[#806238]"
              />
            </label>
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
        <div
          onDragOver={(event) => {
            event.preventDefault()
            setIsDraggingFiles(true)
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setIsDraggingFiles(false)
            }
          }}
          onDrop={(event) => {
            event.preventDefault()
            setIsDraggingFiles(false)
            void handleFileUpload(event.dataTransfer.files)
          }}
          className={`border-2 border-dashed rounded-2xl p-8 text-center bg-[#FAF8F5] space-y-3 transition-colors ${
            isDraggingFiles ? 'border-[#C5A059] bg-amber-50' : 'border-zinc-300 hover:border-[#C5A059]'
          }`}
        >
          <Upload className="w-10 h-10 mx-auto text-[#C5A059]" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Déposez vos images ici ou sélectionnez des fichiers
            </p>
            <p className="text-[11px] text-zinc-500 font-light mt-0.5">
              Images converties en WebP, jusqu’à 1200 px. Maximum 10 Mo par image.
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
          disabled={submitting || uploading || categoriesLoading || (!initialData && categories.length === 0)}
          className="px-8 py-4 bg-[#0D0D0D] text-[#C5A059] hover:bg-[#C5A059] hover:text-[#0D0D0D] text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-xl flex items-center gap-2 disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          {uploading
            ? 'Téléversement des images...'
            : submitting
              ? 'Enregistrement...'
              : buttonText}
        </button>
      </div>
    </form>
  )
}
