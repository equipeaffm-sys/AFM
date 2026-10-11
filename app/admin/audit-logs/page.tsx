'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Filter,
  ArrowLeft,
  Activity,
  RefreshCw,
} from 'lucide-react'

export interface AuditLogEntry {
  id: string
  timestamp: string
  authorName: string
  authorEmail: string
  authorRole: string
  ipAddress: string
  actionCategory: 'PRODUCT_EDIT' | 'PRICE_CHANGE' | 'STOCK_UPDATE' | 'REFUND' | 'ROLE_CHANGE' | 'SYSTEM'
  actionTitle: string
  details: string
  severity: 'info' | 'warning' | 'critical'
}

export default function AdminAuditLogsPage() {
  const [logs] = useState<AuditLogEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.authorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery)

    const matchesCategory =
      categoryFilter === 'ALL' || log.actionCategory === categoryFilter

    return matchesSearch && matchesCategory
  })

  return (
    <div className="bg-[#FAF8F5] min-h-screen text-zinc-900 p-6 lg:p-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div className="space-y-1">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-[#C5A059] transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour Dashboard Admin
          </Link>
          <div className="flex items-center gap-3">
            <Activity className="w-7 h-7 text-[#C5A059]" />
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-950">
              Journal d&apos;Audit &amp; Traçabilité des Actions Sensis
            </h1>
          </div>
          <p className="text-xs text-zinc-600 font-light">
            Historique complet des modifications de produits, prix, stocks, remboursements et rôles par l&apos;équipe.
          </p>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Rechercher par membre, e-mail, IP ou action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-[#C5A059] shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Toutes les catégories</option>
            <option value="PRICE_CHANGE">Changements de Prix</option>
            <option value="STOCK_UPDATE">Modifications de Stock</option>
            <option value="REFUND">Remboursements</option>
            <option value="ROLE_CHANGE">Gestion des Rôles</option>
            <option value="PRODUCT_EDIT">Édition Produits</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery('')
              setCategoryFilter('ALL')
            }}
            className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
            title="Réinitialiser filtres"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Audit Logs List Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="overflow-x-auto border border-zinc-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-zinc-200 text-zinc-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Date &amp; Heure</th>
                <th className="py-3.5 px-4">Auteur (Membre)</th>
                <th className="py-3.5 px-4">Adresse IP</th>
                <th className="py-3.5 px-4">Catégorie</th>
                <th className="py-3.5 px-4">Description de l&apos;Opération</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-light">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-zinc-500">Aucune entrée d’audit disponible.</td>
                </tr>
              ) : filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="py-4 px-4 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>

                  <td className="py-4 px-4 space-y-0.5 whitespace-nowrap">
                    <span className="font-serif font-bold text-sm text-zinc-950 block">{log.authorName}</span>
                    <span className="font-mono text-zinc-500 block text-[10px]">{log.authorRole} • {log.authorEmail}</span>
                  </td>

                  <td className="py-4 px-4 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                    {log.ipAddress}
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        log.severity === 'critical'
                          ? 'bg-red-100 text-red-900 border border-red-200'
                          : log.severity === 'warning'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-blue-100 text-blue-900 border border-blue-200'
                      }`}
                    >
                      {log.actionCategory}
                    </span>
                  </td>

                  <td className="py-4 px-4 space-y-1">
                    <span className="font-bold text-zinc-900 block">{log.actionTitle}</span>
                    <span className="text-[11px] text-zinc-500 block font-light">{log.details}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
