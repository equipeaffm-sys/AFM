'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FolderTree, Search, Plus, ArrowLeft, Sparkles, RefreshCw, ChevronRight, ChevronDown, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface CategoryNode {
  id: string
  name: string
  slug: string
  icon?: string
  parent_id?: string | null
  is_active: boolean
  is_visible?: boolean
  children?: CategoryNode[]
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})
  const [newCatName, setNewCatName] = useState('')
  const [newCatSlug, setNewCatSlug] = useState('')
  const [selectedParentId, setSelectedParentId] = useState<string>('')
  const [isAdding, setIsAdding] = useState(false)

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }))
  }

  // Build 3-level tree from flat data array
  const buildTree = useCallback((flatList: CategoryNode[]): CategoryNode[] => {
    const map = new Map<string, CategoryNode>()
    flatList.forEach((cat) => map.set(cat.id, { ...cat, children: [] }))

    const tree: CategoryNode[] = []
    flatList.forEach((cat) => {
      const node = map.get(cat.id)
      if (!node) return
      if (cat.parent_id && map.has(cat.parent_id)) {
        map.get(cat.parent_id)?.children?.push(node)
      } else {
        tree.push(node)
      }
    })
    return tree
  }, [])

  // Fetch Categories from Supabase
  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(buildTree(data || []))
    } catch {
      setCategories([])
      toast.error('Impossible de charger les catégories.')
    } finally {
      setLoading(false)
    }
  }, [buildTree])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // Helper to recursively update toggle status in local state tree
  const updateTreeState = (nodes: CategoryNode[], targetId: string, nextState: boolean): CategoryNode[] => {
    return nodes.map((node) => {
      if (node.id === targetId) {
        const updateChildren = (children?: CategoryNode[]): CategoryNode[] | undefined => {
          if (!children) return undefined
          return children.map((c) => ({
            ...c,
            is_active: nextState,
            is_visible: nextState,
            children: updateChildren(c.children),
          }))
        }
        return {
          ...node,
          is_active: nextState,
          is_visible: nextState,
          children: updateChildren(node.children),
        }
      }
      if (node.children && node.children.length > 0) {
        return { ...node, children: updateTreeState(node.children, targetId, nextState) }
      }
      return node
    })
  }

  // Toggle Category Visibility / Active Status
  const handleToggle = async (catId: string, currentActive: boolean) => {
    const nextState = !currentActive
    const findNode = (nodes: CategoryNode[]): CategoryNode | undefined => {
      for (const node of nodes) {
        if (node.id === catId) return node
        const nested = findNode(node.children || [])
        if (nested) return nested
      }
      return undefined
    }
    const collectIds = (node: CategoryNode): string[] => [
      node.id,
      ...(node.children || []).flatMap(collectIds),
    ]
    const target = findNode(categories)
    if (!target) return
    const idsToUpdate = collectIds(target)
    setCategories((prev) => updateTreeState(prev, catId, nextState))

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('categories')
        .update({ is_active: nextState, is_visible: nextState })
        .in('id', idsToUpdate)

      if (error) {
        await loadCategories()
        toast.error('Impossible de mettre à jour le statut de la catégorie.')
      } else {
        toast.success(
          nextState ? 'Catégorie activée.' : 'Catégorie masquée.'
        )
      }
    } catch {
      await loadCategories()
      toast.error('Impossible de mettre à jour le statut de la catégorie.')
    }
  }

  // Bulk Activation/Deactivation for a parent section
  const handleBulkToggle = async (parentCat: CategoryNode, activate: boolean) => {
    const collectIds = (node: CategoryNode): string[] => {
      let ids = [node.id]
      if (node.children) {
        node.children.forEach((c) => {
          ids = ids.concat(collectIds(c))
        })
      }
      return ids
    }

    const idsToUpdate = collectIds(parentCat)
    setCategories((prev) => updateTreeState(prev, parentCat.id, activate))

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('categories')
        .update({ is_active: activate, is_visible: activate })
        .in('id', idsToUpdate)

      if (error) throw error
      toast.success(activate ? `Section "${parentCat.name}" entièrement activée !` : `Section "${parentCat.name}" masquée.`)
    } catch {
      await loadCategories()
      toast.error('Impossible de mettre à jour cette section.')
    }
  }

  // Create Category or Subcategory
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName || !newCatSlug) {
      toast.error('Veuillez spécifier le nom et le slug.')
      return
    }

    try {
      const supabase = createClient()
      const newRecord = {
        name: newCatName,
        slug: newCatSlug.toLowerCase().replace(/\s+/g, '-'),
        parent_id: selectedParentId || null,
        is_active: true,
        is_visible: true,
      }

      const { error } = await supabase.from('categories').insert(newRecord)

      if (error) {
        toast.error('Erreur lors de la création de la catégorie.')
      } else {
        toast.success('Nouvelle catégorie ajoutée avec succès !')
        setNewCatName('')
        setNewCatSlug('')
        setIsAdding(false)
        loadCategories()
      }
    } catch {
      toast.error('Impossible de créer la catégorie.')
    }
  }

  // Helper to flat list categories for parent selection in form
  const getFlatCategories = (nodes: CategoryNode[], depth = 0): { id: string; name: string }[] => {
    let res: { id: string; name: string }[] = []
    nodes.forEach((n) => {
      const prefix = '— '.repeat(depth)
      res.push({ id: n.id, name: prefix + n.name })
      if (n.children && n.children.length > 0) {
        res = res.concat(getFlatCategories(n.children, depth + 1))
      }
    })
    return res
  }

  return (
    <div className="bg-[#FAFAFA] text-[#0D0D0D] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Back Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600 hover:text-[#C5A059] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au Dashboard Admin
          </Link>
          <span className="text-xs uppercase tracking-widest text-[#C5A059] font-bold">
            Temu-Style Category Hierarchy Manager
          </span>
        </div>

        {/* Title & Actions */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#C5A059]">
              <FolderTree className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">
                3-Level Accordion Control Panel
              </span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-zinc-950">
              Gestionnaire des Rayons &amp; Catégories
            </h1>
            <p className="text-zinc-600 text-xs font-light">
              Gérez des centaines de catégories et sous-catégories à 3 niveaux. Activez ou masquez les rayons du site public en 1 clic.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-5 py-3 bg-[#0D0D0D] text-[#C5A059] hover:bg-[#C5A059] hover:text-[#0D0D0D] text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Ajouter une Catégorie
            </button>
            <button
              onClick={loadCategories}
              title="Rafraîchir"
              className="p-3 bg-[#FAFAFA] border border-zinc-200 text-zinc-700 hover:text-[#C5A059] rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Modal / Slide-Down */}
        {isAdding && (
          <form
            onSubmit={handleAddCategory}
            className="bg-[#FAFAFA] border-2 border-[#C5A059]/40 rounded-2xl p-6 space-y-4 shadow-lg animate-fadeIn"
          >
            <h2 className="font-serif text-lg font-bold text-zinc-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              Créer une Nouvelle Catégorie ou Sous-Catégorie
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block mb-1">
                  Nom de la catégorie
                </label>
                <input
                  type="text"
                  placeholder="ex: Sacs de Voyage"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block mb-1">
                  Slug URL
                </label>
                <input
                  type="text"
                  placeholder="ex: sacs-voyage"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 block mb-1">
                  Catégorie Parente (Optionnel pour Niv. 2 ou 3)
                </label>
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-[#C5A059] cursor-pointer"
                >
                  <option value="">Aucune (Niveau 1 - Rayon Principal)</option>
                  {getFlatCategories(categories).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-zinc-300 text-zinc-700 hover:bg-zinc-200 text-xs font-semibold uppercase rounded-lg cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#0D0D0D] text-[#C5A059] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#C5A059] hover:text-[#0D0D0D] transition-all cursor-pointer"
              >
                Enregistrer
              </button>
            </div>
          </form>
        )}

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Rechercher une catégorie ou sous-catégorie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        {/* 3-Level Accordion Tree View */}
        {loading ? (
          <div className="p-12 text-center text-zinc-500 font-serif text-sm">
            Chargement de l&apos;arborescence Temu-Style...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center bg-white border border-zinc-200 rounded-2xl text-zinc-600 text-xs">
            Aucune catégorie disponible.
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((l1) => {
              const isL1Expanded = expandedNodes[l1.id] ?? true

              return (
                <div
                  key={l1.id}
                  className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-sm space-y-4"
                >
                  {/* Level 1 Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleExpand(l1.id)}
                        className="p-1 hover:bg-zinc-100 rounded text-zinc-500 transition-colors cursor-pointer"
                      >
                        {isL1Expanded ? (
                          <ChevronDown className="w-5 h-5 text-[#C5A059]" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>

                      <span
                        className={`w-3 h-3 rounded-full ${
                          l1.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'
                        }`}
                      />

                      <div>
                        <h3 className="font-serif text-lg font-bold text-zinc-950 flex items-center gap-2">
                          {l1.name}
                          <span className="text-[10px] font-mono font-normal text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
                            /{l1.slug}
                          </span>
                        </h3>
                        <p className="text-[11px] text-zinc-500 font-light">
                          Niveau 1 — {l1.children?.length || 0} sous-catégorie(s)
                        </p>
                      </div>
                    </div>

                    {/* Level 1 Actions */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 border-r border-zinc-200 pr-4">
                        <button
                          type="button"
                          onClick={() => handleBulkToggle(l1, true)}
                          className="text-[10px] uppercase font-bold text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Tout Activer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBulkToggle(l1, false)}
                          className="text-[10px] uppercase font-bold text-zinc-600 hover:bg-zinc-100 px-2 py-1 rounded border border-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" />
                          Tout Masquer
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold uppercase tracking-wider ${
                            l1.is_active ? 'text-emerald-700' : 'text-zinc-400'
                          }`}
                        >
                          {l1.is_active ? 'Visible' : 'Masqué'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggle(l1.id, l1.is_active)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            l1.is_active ? 'bg-emerald-600' : 'bg-zinc-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              l1.is_active ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Level 2 Sub-categories */}
                  {isL1Expanded && l1.children && l1.children.length > 0 && (
                    <div className="pl-6 space-y-3 pt-2 border-l-2 border-[#C5A059]/20 ml-3">
                      {l1.children.map((l2) => {
                        const isL2Expanded = expandedNodes[l2.id] ?? true

                        return (
                          <div
                            key={l2.id}
                            className="bg-[#FAFAFA] border border-zinc-200 rounded-xl p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {l2.children && l2.children.length > 0 && (
                                  <button
                                    onClick={() => toggleExpand(l2.id)}
                                    className="p-1 hover:bg-zinc-200 rounded text-zinc-500 cursor-pointer"
                                  >
                                    {isL2Expanded ? (
                                      <ChevronDown className="w-4 h-4 text-[#C5A059]" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                                <span className="font-semibold text-xs text-zinc-900">
                                  {l2.name}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400">
                                  /{l2.slug}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-semibold uppercase ${
                                    l2.is_active ? 'text-emerald-700' : 'text-zinc-400'
                                  }`}
                                >
                                  {l2.is_active ? 'ON' : 'OFF'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggle(l2.id, l2.is_active)}
                                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    l2.is_active ? 'bg-emerald-600' : 'bg-zinc-300'
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                      l2.is_active ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>

                            {/* Level 3 Micro-categories */}
                            {isL2Expanded && l2.children && l2.children.length > 0 && (
                              <div className="pl-6 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-l border-zinc-200 ml-2">
                                {l2.children.map((l3) => (
                                  <div
                                    key={l3.id}
                                    className={`p-2.5 rounded-lg border flex items-center justify-between text-[11px] ${
                                      l3.is_active
                                        ? 'bg-white border-[#C5A059]/30 text-zinc-900'
                                        : 'bg-zinc-100 border-zinc-200 text-zinc-400'
                                    }`}
                                  >
                                    <div>
                                      <span className="font-medium block">{l3.name}</span>
                                      <span className="text-[9px] font-mono text-zinc-400 block">
                                        /{l3.slug}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleToggle(l3.id, l3.is_active)}
                                      className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        l3.is_active ? 'bg-emerald-600' : 'bg-zinc-300'
                                      }`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                          l3.is_active ? 'translate-x-3' : 'translate-x-0'
                                        }`}
                                      />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
