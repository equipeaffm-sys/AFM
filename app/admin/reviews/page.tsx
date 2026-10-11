'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Star,
  CheckCircle2,
  XCircle,
  Mail,
  Send,
  Sparkles,
  ArrowLeft,
  Calendar,
  Gift,
  Search
} from 'lucide-react'
import toast from 'react-hot-toast'

interface AdminReview {
  id: string
  productId: string
  productTitle: string
  author: string
  rating: number
  title: string
  comment: string
  date: string
  status: 'pending' | 'approved' | 'rejected'
  officialReply?: string
}

export default function AdminReviewsPage() {
  const [reviews] = useState<AdminReview[]>([])
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')

  // Post-purchase automated review reminder settings
  const [reminderDays, setReminderDays] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [discountPercent, setDiscountPercent] = useState('')
  const [reminderEnabled, setReminderEnabled] = useState(false)

  const handleStatusChange = (id: string, newStatus: 'approved' | 'rejected') => {
    void id
    void newStatus
    toast.error('La modération des avis n’est pas connectée à une source persistante.')
  }

  const handleAddOfficialReply = (id: string) => {
    const reply = replyInputMap[id]
    if (!reply || !reply.trim()) return
    void id
    toast.error('Les réponses aux avis ne sont pas connectées à une source persistante.')
  }

  const filteredReviews = reviews.filter((r) => {
    const matchesTab = activeTab === 'all' || r.status === activeTab
    const matchesQuery =
      !searchQuery ||
      r.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesQuery
  })

  return (
    <div className="bg-[#FEFDF5] text-zinc-900 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600 hover:text-[#C5A059] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au Cockpit Admin
          </Link>
          <span className="text-xs uppercase tracking-widest text-[#C5A059] font-bold">
            Modération
          </span>
        </div>

        {/* Header Title Banner */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-[#C5A059]">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Gestion &amp; Modération des Avis Clients
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-zinc-950">
            Cockpit de Preuve Sociale &amp; Avis Certifiés
          </h1>
          <p className="text-zinc-600 text-xs font-light">
            Aucun avis client n’est configuré. Les avis ne seront affichés ici qu’après connexion d’une source persistante.
          </p>
        </div>

        {/* Automated Post-Purchase Reminder Scheduler Panel */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#C5A059]" />
              <h2 className="font-serif text-base font-bold text-zinc-950">
                Relance Post-Achat
              </h2>
            </div>
            <button
              onClick={() => setReminderEnabled(!reminderEnabled)}
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                reminderEnabled
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-zinc-200 text-zinc-600'
              }`}
            >
              {reminderEnabled ? 'Séquence Active' : 'Séquence En Pause'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                Délai d&apos;envoi après livraison (Jours)
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C5A059]" />
                <input
                  type="number"
                  value={reminderDays}
                  onChange={(e) => setReminderDays(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                Code Promo Offert en Remerciement
              </label>
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#C5A059]" />
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                Remise Accordée (%)
              </label>
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>
        </div>

        {/* Reviews List & Control Filters */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Tab Controls */}
            <div className="flex items-center gap-2">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === tab
                      ? 'bg-[#0D0D0D] text-[#C5A059]'
                      : 'bg-[#FAF8F5] text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {tab === 'pending'
                    ? 'En Attente'
                    : tab === 'approved'
                    ? 'Approuvés'
                    : tab === 'rejected'
                    ? 'Rejetés'
                    : 'Tous'}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher un avis ou client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>

          {/* Moderation Review Items Grid */}
          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <p className="text-center py-12 text-zinc-500 text-xs font-light">
                Aucun avis dans cet onglet.
              </p>
            ) : (
              filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-6 bg-[#FAF8F5] border border-zinc-200/80 rounded-2xl space-y-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/80 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider block">
                        Article: {rev.productTitle}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-serif font-bold text-sm text-zinc-950">
                          {rev.author}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400 font-mono">{rev.date}</span>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          rev.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rev.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rev.status === 'approved'
                          ? 'Publié'
                          : rev.status === 'rejected'
                          ? 'Rejeté'
                          : 'En attente'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#C5A059]">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#C5A059]" />
                      ))}
                      <h4 className="font-bold text-xs text-zinc-900 ml-1">{rev.title}</h4>
                    </div>

                    <p className="text-xs text-zinc-700 leading-relaxed font-light">
                      &ldquo;{rev.comment}&rdquo;
                    </p>

                    {/* Official Maison L&M Reply */}
                    {rev.officialReply && (
                      <div className="p-3 bg-white border border-[#C5A059]/30 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold uppercase text-[#C5A059] flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Réponse Officielle Maison L&amp;M:
                        </span>
                        <p className="text-xs text-zinc-800 italic">{rev.officialReply}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions & Official Reply Input */}
                  <div className="pt-2 border-t border-zinc-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {rev.status !== 'approved' && (
                        <button
                          onClick={() => handleStatusChange(rev.id, 'approved')}
                          className="px-4 py-2 bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold uppercase rounded-xl flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approuver
                        </button>
                      )}

                      {rev.status !== 'rejected' && (
                        <button
                          onClick={() => handleStatusChange(rev.id, 'rejected')}
                          className="px-4 py-2 bg-red-800 text-white hover:bg-red-900 text-xs font-bold uppercase rounded-xl flex items-center gap-1.5 shadow-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Rejeter
                        </button>
                      )}
                    </div>

                    {/* Add Official Public Reply */}
                    <div className="flex items-center gap-2 flex-1 sm:max-w-md">
                      <input
                        type="text"
                        placeholder="Répondre publiquement en tant que Maison L&M..."
                        value={replyInputMap[rev.id] || ''}
                        onChange={(e) =>
                          setReplyInputMap((prev) => ({ ...prev, [rev.id]: e.target.value }))
                        }
                        className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#C5A059]"
                      />
                      <button
                        onClick={() => handleAddOfficialReply(rev.id)}
                        className="px-3 py-1.5 bg-[#0D0D0D] text-[#C5A059] hover:bg-[#C5A059] hover:text-[#0D0D0D] text-xs font-bold uppercase rounded-xl flex items-center gap-1 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Répondre
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
