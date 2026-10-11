'use client'

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  FileText,
  FolderTree,
  LayoutDashboard,
  MessageSquare,
  Package,
  Palette,
  Percent,
  Settings,
  ShoppingBag,
  Truck,
} from 'lucide-react'
import AdminSessionGuard from '@/components/AdminSessionGuard'

const navItems = [
  { label: 'Vue d’ensemble', href: '/admin', icon: LayoutDashboard },
  { label: 'Produits', href: '/admin/products', icon: Package },
  { label: 'Catégories', href: '/admin/categories', icon: FolderTree },
  { label: 'Commandes', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Stock', href: '/admin/inventory', icon: BarChart3 },
  { label: 'Livraison', href: '/admin/shipping', icon: Truck },
  { label: 'Promotions', href: '/admin/promotions', icon: Percent },
  { label: 'Avis clients', href: '/admin/reviews', icon: MessageSquare },
  { label: 'Factures', href: '/admin/invoices', icon: FileText },
  { label: 'Journal d’audit', href: '/admin/audit-logs', icon: ClipboardList },
  { label: 'Apparence', href: '/admin/appearance', icon: Palette },
  { label: 'Paramètres', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AdminSessionGuard timeoutMinutes={15}>
    <div className="min-h-screen bg-[#f5f3ee] font-sans text-zinc-900 md:flex">
      <aside className="border-b border-[#e4ded3] bg-[#fbfaf7] md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-4 px-5 py-4 md:block md:px-5 md:py-6">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs text-zinc-500 transition-colors hover:text-[#806238]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Retour à la boutique
            </Link>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#66563d] font-serif text-sm text-white">
                L&amp;M
              </span>
              <div>
                <p className="font-serif text-lg font-semibold leading-tight text-zinc-900">Administration</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Espace boutique</p>
              </div>
            </div>
          </div>
        </div>

        <nav aria-label="Navigation d’administration" className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-1 md:overflow-visible md:px-3 md:pb-5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.href === '/admin'
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`motion-link flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium md:w-full ${
                  isActive
                    ? 'bg-[#eee7db] text-[#5d4c34]'
                    : 'text-zinc-600 hover:bg-white hover:text-zinc-950'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-9">
        <div className="mx-auto w-full max-w-[1500px]">{children}</div>
      </main>
    </div>
    </AdminSessionGuard>
  )
}
