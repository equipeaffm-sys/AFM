'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Search,
  Plus,
  Filter,
  Save,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit3,
  AlertTriangle,
  Camera,
  X,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Product } from '@/lib/constants'

type StatusFilterType = 'all' | 'active' | 'inactive' | 'out_of_stock'
type CategoryOption = { id: string; name: string }

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all')

  // Product Delete Confirmation Modal State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Express Fast-Add Modal State
  const [fastAddOpen, setIsFastAddOpen] = useState(false)
  const [fastTitle, setFastTitle] = useState('')
  const [fastPriceEuros, setFastPriceEuros] = useState<number>(0)
  const [fastCategoryId, setFastCategoryId] = useState('')
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [fastImageFile, setFastImageFile] = useState<File | null>(null)
  const [fastAdding, setFastAdding] = useState(false)

  // Hidden File Input for 1-Click Image Replacement
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [replacingProductId, setReplacingProductId] = useState<string | null>(null)

  const loadProducts = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Unable to load admin products:', error)
      setProducts([])
      toast.error(error instanceof Error ? error.message : 'Impossible de charger les produits.')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      setCategories(data || [])
      setCategoriesError(null)
    } catch (error) {
      console.error('Unable to load categories for quick add:', error)
      setCategories([])
      setCategoriesError(error instanceof Error ? error.message : 'Impossible de charger les catégories.')
    } finally {
      setCategoriesLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  // Inline Stock Adjustment (+ / -)
  const handleInlineStockChange = (id: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p))
    )
  }

  const handleStockDirectInput = (id: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: Math.max(0, newStock) } : p))
    )
  }

  // Inline Price & Cost Price Adjustment
  const handleInlinePriceChange = (id: string, newPriceCents: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, price_cents: Math.max(0, newPriceCents) } : p))
    )
  }

  // Toggle Activation (Visibility ON/OFF < 100ms)
  const handleToggleActivation = async (id: string, currentActive?: boolean) => {
    const nextState = !currentActive
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: nextState } : p))
    )

    try {
      const supabase = createClient()
      const { error } = await supabase.from('products').update({ is_active: nextState }).eq('id', id)
      if (error) throw error
      toast.success(nextState ? 'Produit activé sur le catalogue public.' : 'Produit masqué.')
    } catch {
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, is_active: currentActive } : p))
      toast.error('Impossible de modifier le statut du produit.')
    }
  }

  // 1-Click Fast Image Replacement Handler
  const triggerImageReplacement = (productId: string) => {
    setReplacingProductId(productId)
    fileInputRef.current?.click()
  }

  const handle1ClickImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !replacingProductId) return

    toast.loading('Téléversement et remplacement de l\'image...', { id: 'img-replace' })

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_replace_${Math.random().toString(36).substring(2, 6)}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)
      if (!data?.publicUrl) throw new Error('Image URL unavailable')
      const newPublicUrl = data.publicUrl

      // Update product image array with new main image
      const targetProduct = products.find((p) => p.id === replacingProductId)
      const existingImages = targetProduct?.images || []
      const updatedImages = [newPublicUrl, ...existingImages.slice(1)]

      // Update Supabase Database
      const { error } = await supabase.from('products').update({ images: updatedImages }).eq('id', replacingProductId)
      if (error) throw error

      // Update Local State without page reload
      setProducts((prev) =>
        prev.map((p) => (p.id === replacingProductId ? { ...p, images: updatedImages } : p))
      )

      toast.success('Image principale remplacée en 1-clic !', { id: 'img-replace' })
    } catch (error) {
      console.error('Unable to replace product image:', error)
      toast.error('Impossible de remplacer l’image.', { id: 'img-replace' })
    } finally {
      setReplacingProductId(null)
      if (e.target) e.target.value = ''
    }
  }

  // Express Fast-Add Creation Handler
  const handleFastAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const selectedCategory = categories.find((category) => category.id === fastCategoryId)
    if (!fastTitle.trim() || !selectedCategory || !Number.isFinite(fastPriceEuros) || fastPriceEuros < 0) {
      toast.error('Renseignez un titre, une catégorie active et un prix valide (zéro est autorisé).')
      return
    }
    if (fastImageFile && (!fastImageFile.type.startsWith('image/') || fastImageFile.size > 10 * 1024 * 1024)) {
      toast.error('Choisissez une image de 10 Mo maximum.')
      return
    }

    setFastAdding(true)
    try {
      const supabase = createClient()
      let imageUrl = ''

      if (fastImageFile) {
        const fileExt = fastImageFile.name.split('.').pop()
        const fileName = `${Date.now()}_fast_${Math.random().toString(36).substring(2, 6)}.${fileExt}`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, fastImageFile)

        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)
        if (!data?.publicUrl) throw new Error('Image URL unavailable')
        imageUrl = data.publicUrl
      }

      const slug = fastTitle.trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
      const newProductRecord = {
        title: fastTitle.trim(),
        slug,
        description: '',
        price_cents: Math.round(fastPriceEuros * 100),
        cost_price_cents: null,
        stock: 0,
        low_stock_threshold: 3,
        category: selectedCategory.name,
        category_id: selectedCategory.id,
        images: imageUrl ? [imageUrl] : [],
        is_active: false,
        is_featured: false,
      }

      const { data, error } = await supabase.from('products').insert(newProductRecord).select().single()

      if (error || !data) throw error || new Error('Product not created')
      setProducts((prev) => [data, ...prev])
      toast.success(`"${fastTitle.trim()}" enregistré comme brouillon. Complétez sa fiche avant publication.`)

      setFastTitle('')
      setFastPriceEuros(0)
      setFastCategoryId('')
      setFastImageFile(null)
      setIsFastAddOpen(false)
    } catch (error) {
      console.error('Unable to create product from quick add:', error)
      toast.error(error instanceof Error ? error.message : 'Impossible de créer le produit.')
    } finally {
      setFastAdding(false)
    }
  }

  const handleSaveRow = async (product: Product) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('products')
        .update({
          stock: product.stock,
          price_cents: product.price_cents,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)

      if (error) throw error
      toast.success(`Modifications enregistrées pour "${product.title}".`)
    } catch (error) {
      console.error(`Unable to save product row ${product.id}:`, error)
      toast.error(error instanceof Error ? error.message : 'Impossible d’enregistrer les modifications.')
    }
  }

  // Confirm Product Deletion & Cleanup Storage Images
  const handleConfirmDelete = async () => {
    if (!productToDelete) return
    setDeleting(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.from('products').delete().eq('id', productToDelete.id)

      if (error) throw error

      const storagePrefix = '/storage/v1/object/public/product-images/'
      const storagePaths = (productToDelete.images || [])
        .map((imageUrl) => {
          try {
            const path = new URL(imageUrl).pathname
            const prefixIndex = path.indexOf(storagePrefix)
            return prefixIndex === -1
              ? null
              : decodeURIComponent(path.slice(prefixIndex + storagePrefix.length))
          } catch {
            return null
          }
        })
        .filter((path): path is string => Boolean(path))
      let storageCleanupFailed = false
      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage.from('product-images').remove(storagePaths)
        storageCleanupFailed = Boolean(storageError)
        if (storageError) console.error('Unable to remove deleted product images:', storageError)
      }

      toast.success(
        storageCleanupFailed
          ? 'Produit supprimé, mais certaines images n’ont pas pu être supprimées du stockage.'
          : `Produit "${productToDelete.title}" supprimé.`
      )
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id))
      setProductToDelete(null)
    } catch (error) {
      console.error('Unable to delete product:', error)
      toast.error(error instanceof Error ? error.message : 'Impossible de supprimer le produit.')
    } finally {
      setDeleting(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())

    if (statusFilter === 'active') return matchesSearch && product.is_active
    if (statusFilter === 'inactive') return matchesSearch && !product.is_active
    if (statusFilter === 'out_of_stock') return matchesSearch && product.stock === 0
    return matchesSearch
  })

  return (
    <div className="bg-[#FEFDF5] text-zinc-900 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      {/* Hidden File Input for 1-Click Image Replacement */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handle1ClickImageUpload}
        className="hidden"
      />

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600 hover:text-[#C5A059] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au Dashboard Admin
          </Link>
          <span className="text-xs uppercase tracking-widest text-[#C5A059] font-bold">
            Catalog DataGrid &amp; Express Add
          </span>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#C5A059]">
              <Zap className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Dynamic DataGrid &amp; Flash Stock</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-zinc-950">
              Gestionnaire Général &amp; Marge Brute
            </h1>
            <p className="text-zinc-600 text-xs font-light">
              Calculez la marge brute en direct, remplacez les visuels en 1-clic et ajustez le stock instantanément.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFastAddOpen(true)}
              disabled={categoriesLoading || categories.length === 0}
              title={categoriesError || (categories.length === 0 ? 'Créez d’abord une catégorie active.' : undefined)}
              className="px-5 py-3 bg-[#C5A059] text-[#0D0D0D] hover:bg-[#0D0D0D] hover:text-[#C5A059] text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              Ajout Express (Fast-Add)
            </button>
            <Link
              href="/admin/products/new"
              className="px-5 py-3 bg-[#0D0D0D] text-[#C5A059] hover:bg-[#C5A059] hover:text-[#0D0D0D] text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" />
              Formulaire Complet
            </Link>
            <button
              onClick={loadProducts}
              className="p-3 bg-[#FAF8F5] border border-zinc-200 text-zinc-700 hover:text-[#C5A059] rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Express Fast-Add Modal */}
        {fastAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0D0D]/70 backdrop-blur-sm animate-fadeIn">
            <form
              onSubmit={handleFastAddSubmit}
              className="bg-white border-2 border-[#C5A059] rounded-2xl max-w-lg w-full p-8 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-2 text-[#C5A059]">
                  <Zap className="w-5 h-5" />
                  <h2 className="font-serif text-lg font-bold text-zinc-950">
                    Ajout Express en 4 Champs
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFastAddOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                    1. Titre du Produit *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Ceinture Cuir Séquoia Boucle Or"
                    value={fastTitle}
                    onChange={(e) => setFastTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl font-medium focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                      2. Prix de vente (€) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={fastPriceEuros}
                      onChange={(e) => setFastPriceEuros(parseFloat(e.target.value || '0'))}
                      className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl font-mono font-bold text-zinc-950 focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                      3. Rayon / Catégorie *
                    </label>
                    <select
                      required
                      value={fastCategoryId}
                      onChange={(e) => setFastCategoryId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl font-medium focus:outline-none focus:border-[#C5A059]"
                    >
                      <option value="">Choisir une catégorie…</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                    {categoriesError && <p role="status" className="mt-1 text-[10px] text-amber-700">{categoriesError}</p>}
                  </div>
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                    4. Image Principale (Fichier Local)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFastImageFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#0D0D0D] file:text-[#C5A059] cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFastAddOpen(false)}
                  className="px-4 py-2 border border-zinc-300 text-zinc-700 hover:bg-zinc-100 text-xs font-semibold uppercase rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={fastAdding}
                  className="px-6 py-2 bg-[#0D0D0D] text-[#C5A059] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#C5A059] hover:text-[#0D0D0D] transition-all disabled:opacity-50"
                >
                  {fastAdding ? 'Création...' : 'Publier Immédiatement'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher une création par titre ou rayon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#C5A059]" />
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Filtre:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
              className="px-3 py-2 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Tous les produits ({products.length})</option>
              <option value="active">Actifs seulement</option>
              <option value="inactive">Inactifs (Masqués)</option>
              <option value="out_of_stock">Rupture de Stock</option>
            </select>
          </div>
        </div>

        {/* Products DataGrid Table */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-zinc-500 font-serif text-sm">
              Chargement des articles du catalogue...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">
              Aucun produit ne correspond à vos critères.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-zinc-200 text-zinc-600 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-4 px-6">Produit &amp; 1-Click Photo</th>
                    <th className="py-4 px-6">Rayon</th>
                    <th className="py-4 px-6">Prix de vente</th>
                    <th className="py-4 px-6">Flash Stock (+/-)</th>
                    <th className="py-4 px-6">Statut Boutique</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredProducts.map((p) => {
                    return (
                      <tr key={p.id} className="hover:bg-zinc-50/80 transition-colors">
                        {/* Product Image with 1-Click Replace Overlay */}
                        <td className="py-4 px-6 flex items-center gap-3">
                          <div
                            onClick={() => triggerImageReplacement(p.id)}
                            className="relative w-14 h-14 bg-zinc-100 rounded-xl overflow-hidden shrink-0 border border-zinc-200 cursor-pointer group shadow-sm"
                            title="Cliquez pour remplacer l'image en 1-clic"
                          >
                            {p.images[0] && (
                              <Image
                                src={p.images[0]}
                                alt={p.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            )}
                            <div className="absolute inset-0 bg-[#0D0D0D]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold">
                              <Camera className="w-4 h-4 text-[#C5A059] mb-0.5" />
                              Remplacer
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <span className="font-serif font-bold text-zinc-950 block">{p.title}</span>
                            <span className="text-[10px] font-mono text-zinc-400">ID: {p.id.substring(0, 8)}</span>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 bg-zinc-100 border border-zinc-200 text-zinc-800 rounded-full font-semibold text-[10px] uppercase tracking-wider">
                            {p.category}
                          </span>
                        </td>

                        {/* Inline Price Editing & Real-Time Margin Calculator */}
                        <td className="py-4 px-6 space-y-1">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="1"
                              value={p.price_cents / 100}
                              onChange={(e) =>
                                handleInlinePriceChange(p.id, Math.round(parseFloat(e.target.value || '0') * 100))
                              }
                              className="w-24 px-2.5 py-1.5 bg-[#FAF8F5] border border-zinc-200 rounded-lg font-mono font-bold text-zinc-950 focus:outline-none focus:border-[#C5A059]"
                            />
                            <span className="font-serif font-bold text-zinc-700">€</span>
                          </div>
                        </td>

                        {/* Flash Stock Increment / Decrement (+ / -) */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 bg-[#FAF8F5] p-1 border border-zinc-200 rounded-xl w-fit">
                            <button
                              type="button"
                              onClick={() => handleInlineStockChange(p.id, -1)}
                              className="w-7 h-7 bg-white border border-zinc-200 rounded-lg font-bold text-zinc-700 hover:text-red-600 hover:border-red-300 transition-colors flex items-center justify-center shadow-xs"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={p.stock}
                              onChange={(e) => handleStockDirectInput(p.id, parseInt(e.target.value || '0', 10))}
                              className="w-12 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleInlineStockChange(p.id, 1)}
                              className="w-7 h-7 bg-white border border-zinc-200 rounded-lg font-bold text-zinc-700 hover:text-emerald-600 hover:border-emerald-300 transition-colors flex items-center justify-center shadow-xs"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Visibility Toggle Switch (< 100ms) */}
                        <td className="py-4 px-6">
                          <button
                            type="button"
                            onClick={() => handleToggleActivation(p.id, p.is_active)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider transition-colors ${
                              p.is_active
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-zinc-100 text-zinc-500 border border-zinc-300'
                            }`}
                          >
                            {p.is_active ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-zinc-400" />
                            )}
                            {p.is_active ? 'Visible' : 'Masqué'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right space-x-2">
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="px-3 py-1.5 bg-zinc-100 border border-zinc-300 hover:border-[#C5A059] text-zinc-900 text-[11px] font-bold uppercase rounded-lg transition-all inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Éditer
                          </Link>
                          <button
                            onClick={() => handleSaveRow(p)}
                            className="px-3.5 py-1.5 bg-[#0D0D0D] text-[#C5A059] hover:bg-[#C5A059] hover:text-[#0D0D0D] text-[11px] font-bold uppercase rounded-lg transition-all inline-flex items-center gap-1 shadow-sm"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Sauver
                          </button>
                          <button
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg transition-colors"
                            title="Supprimer la création"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0D0D]/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-zinc-950">Confirmer la Suppression</h3>
                <p className="text-xs text-zinc-500 font-light">
                  Supprime la création en BDD et nettoie physiquement le bucket Storage.
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-zinc-200 text-xs space-y-1">
              <span className="font-bold text-zinc-950 block">{productToDelete.title}</span>
              <span className="text-zinc-500 block font-mono text-[10px]">ID: {productToDelete.id}</span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 border border-zinc-300 text-zinc-700 hover:bg-zinc-100 text-xs font-semibold uppercase rounded-lg"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-6 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-red-700 transition-colors shadow-md disabled:opacity-50"
              >
                {deleting ? 'Suppression...' : 'Supprimer Définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
