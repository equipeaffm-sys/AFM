'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, RefreshCw, PackageCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { Product } from '@/lib/constants'

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const lowStockProducts = products.filter(
    (product) => product.stock <= (product.low_stock_threshold ?? 3)
  )

  const loadProducts = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('products').select('*').order('stock', { ascending: true })
      if (error) throw error
      setProducts(data || [])
    } catch {
      setProducts([])
      toast.error('Impossible de charger les stocks.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // 1-Click Stock Replenishment (+10 Items)
  const handleReplenish = async (productId: string, currentStock: number, addQuantity: number = 10) => {
    const newStock = currentStock + addQuantity
    try {
      const supabase = createClient()
      const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', productId)
      if (error) throw error
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p)))
      toast.success(`+${addQuantity} pièce(s) réapprovisionnée(s) ! Stock total : ${newStock}`)
    } catch {
      toast.error('Impossible de mettre à jour le stock.')
    }
  }

  return (
    <div className="bg-[#FEFDF5] text-zinc-900 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600 hover:text-[#C5A059] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au Dashboard Admin
          </Link>
          <span className="text-xs uppercase tracking-widest text-[#C5A059] font-bold">
            Inventory &amp; Low-Stock Monitor
          </span>
        </div>

        {/* Title Box */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-600">
              <PackageCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Inventaire</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-zinc-950">
              Inventaire du catalogue
            </h1>
            <p className="text-zinc-600 text-xs font-light">
              Les alertes sont calculées depuis le seuil configuré sur chaque fiche produit.
            </p>
          </div>

          <div className={`flex items-center justify-between gap-4 rounded-2xl border p-5 ${
            lowStockProducts.length > 0
              ? 'border-amber-300 bg-amber-50 text-amber-950'
              : 'border-emerald-200 bg-emerald-50 text-emerald-950'
          }`}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Alerte de réapprovisionnement</p>
              <p className="mt-1 text-sm">
                {lowStockProducts.length > 0
                  ? `${lowStockProducts.length} produit(s) au seuil ou en dessous`
                  : 'Aucun produit sous son seuil d’alerte.'}
              </p>
            </div>
            <span className="font-serif text-3xl font-semibold">{lowStockProducts.length}</span>
          </div>

          <button
            onClick={loadProducts}
            className="p-3 bg-[#FAF8F5] border border-zinc-200 text-zinc-700 hover:text-[#C5A059] rounded-xl transition-colors self-start md:self-auto"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Healthy Inventory Table */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-100 font-serif font-bold text-base text-zinc-950 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-600" />
              Inventaire Global du Catalogue ({products.length} articles)
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-zinc-500 font-serif text-sm">
              Chargement des stocks...
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">Aucun produit disponible.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-zinc-200 text-zinc-600 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-4 px-6">Produit</th>
                    <th className="py-4 px-6">Rayon</th>
                    <th className="py-4 px-6">Stock / Seuil</th>
                    <th className="py-4 px-6 text-right">Réapprovisionnement Rapide</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <div className="relative w-10 h-10 bg-zinc-100 rounded-lg overflow-hidden shrink-0 border border-zinc-200">
                          {p.images[0] && <Image src={p.images[0]} alt={p.title} fill className="object-cover" />}
                        </div>
                        <span className="font-serif font-bold text-zinc-950 block">{p.title}</span>
                      </td>

                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-zinc-100 border border-zinc-200 text-zinc-800 rounded-full font-semibold text-[10px] uppercase">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span className={`font-mono font-bold text-sm ${
                          p.stock <= (p.low_stock_threshold ?? 3) ? 'text-amber-700' : 'text-zinc-950'
                        }`}>
                          {p.stock} pièce(s)
                        </span>
                        <span className="mt-1 block text-[10px] text-zinc-500">
                          Seuil : {p.low_stock_threshold ?? 3}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleReplenish(p.id, p.stock, 5)}
                          className="px-3 py-1.5 bg-zinc-100 border border-zinc-300 hover:border-[#C5A059] text-zinc-900 text-[11px] font-bold uppercase rounded-lg transition-all"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleReplenish(p.id, p.stock, 20)}
                          className="px-3.5 py-1.5 bg-[#0D0D0D] text-[#C5A059] hover:bg-[#C5A059] hover:text-[#0D0D0D] text-[11px] font-bold uppercase rounded-lg transition-all shadow-sm"
                        >
                          +20
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
