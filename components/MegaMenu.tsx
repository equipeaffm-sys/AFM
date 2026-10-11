'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, ChevronRight, Grid, FolderTree } from 'lucide-react'

export interface CategoryItem {
  id: string
  name: string
  slug: string
  icon?: string
  parent_id?: string | null
  is_active: boolean
  children?: CategoryItem[]
}

function buildCategoryTree(categories: CategoryItem[]) {
  const nodes = new Map(
    categories.map((category) => [category.id, { ...category, children: [] as CategoryItem[] }])
  )
  const roots: CategoryItem[] = []

  categories.forEach((category) => {
    const node = nodes.get(category.id)
    if (!node) return

    const parent = category.parent_id ? nodes.get(category.parent_id) : undefined
    if (category.parent_id && parent) {
      parent.children.push(node)
    } else if (!category.parent_id) {
      roots.push(node)
    }
  })

  return roots
}

export default function MegaMenu() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('name')

        if (error) throw error
        setCategories(buildCategoryTree(data || []))
      } catch (error) {
        console.error('Unable to load categories:', error)
        setCategories([])
      }
    }

    fetchCategories()
  }, [])

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-[#d0cdc5] transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        <Grid className="w-3.5 h-3.5 text-[#b6a17d]" />
        Catégories
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[min(640px,90vw)] rounded-2xl border border-white/10 bg-[#242523] p-5 text-xs normal-case tracking-normal text-[#e6e3dc] shadow-2xl sm:p-6">
          <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="font-serif text-base font-semibold text-[#eeeae2]">
              Explorer les catégories
            </span>
            <Link
              href="/products"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-zinc-400 underline decoration-zinc-600 underline-offset-4 hover:text-white"
            >
              Tout le catalogue
            </Link>
          </div>

          {categories.length === 0 ? (
            <p className="py-5 text-sm text-zinc-400">
              Aucune catégorie active pour le moment.
            </p>
          ) : (
            <div className="grid max-h-[min(60vh,420px)] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {categories.map((category) => (
                <CategoryLinks key={category.id} category={category} onNavigate={() => setOpen(false)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CategoryLinks({
  category,
  onNavigate,
  depth = 0,
}: {
  category: CategoryItem
  onNavigate: () => void
  depth?: number
}) {
  return (
    <div className={depth ? 'ml-4 border-l border-white/10 pl-3' : 'py-1'}>
      <Link
        href={`/category/${category.slug}`}
        onClick={onNavigate}
        className={`flex items-center gap-2 rounded-lg py-2 text-sm transition-colors hover:bg-white/[0.06] hover:text-[#d6c8aa] ${
          depth ? 'text-zinc-400' : 'font-medium text-[#e6e3dc]'
        }`}
      >
        {depth ? (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
        ) : (
          <FolderTree className="h-4 w-4 shrink-0 text-[#b6a17d]" />
        )}
        {category.name}
      </Link>
      {category.children?.map((child) => (
        <CategoryLinks
          key={child.id}
          category={child}
          onNavigate={onNavigate}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}
