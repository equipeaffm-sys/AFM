'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Truck, Printer, RefreshCw, ShieldCheck, Search, FileText, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface ShippingOrder {
  id: string
  fullName: string
  street: string
  city: string
  country: string
  carrier: string
  tracking_number: string
  status: string
  items: { id: string; title: string; unit_price_cents: number; quantity: number }[]
  total_cents: number
  created_at: string
  shipping_address: {
    fullName?: string
    street?: string
    city?: string
    country?: string
    carrier?: string
    tracking_number?: string
    [key: string]: unknown
  }
}

interface ShippingZone {
  id: string
  zone_name: string
  carrier_name: string
  fee_cents: number
  free_threshold_cents: number
  is_active: boolean
}

export default function ShippingPage() {
  const [orders, setOrders] = useState<ShippingOrder[]>([])

  const [zones] = useState<ShippingZone[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrderForSlip, setSelectedOrderForSlip] = useState<ShippingOrder | null>(null)
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false)

  const loadOrders = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
      if (error) throw error
      const formatted = (data || []).map((o) => ({
          id: o.id,
          fullName: o.shipping_address?.fullName || '',
          street: o.shipping_address?.street || '',
          city: o.shipping_address?.city || '',
          country: o.shipping_address?.country || '',
          carrier: o.shipping_address?.carrier || '',
          tracking_number: o.shipping_address?.tracking_number || '',
          status: o.status,
          items: Array.isArray(o.items) ? o.items : [],
          total_cents: o.total_cents,
          created_at: o.created_at,
          shipping_address: o.shipping_address || {},
        }))
      setOrders(formatted)
    } catch {
      setOrders([])
      toast.error('Impossible de charger les commandes.')
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  // Assign Carrier & Tracking Number
  const handleAssignTracking = async (orderId: string, carrier: string, trackingNumber: string) => {
    try {
      const supabase = createClient()
      const order = orders.find((o) => o.id === orderId)
      const { error } = await supabase.from('orders').update({
        status: trackingNumber ? 'shipped' : order?.status,
        shipping_address: {
          ...order?.shipping_address,
          carrier,
          tracking_number: trackingNumber,
        },
      }).eq('id', orderId)
      if (error) throw error

      // Trigger automatic revalidation
      await fetch('/api/revalidate', { method: 'POST' }).catch(() => null)

      setOrders((prev) => prev.map((o) => o.id === orderId
        ? { ...o, carrier, tracking_number: trackingNumber, status: trackingNumber ? 'shipped' : o.status }
        : o))
      toast.success(`N° de suivi ${trackingNumber} enregistré.`)
    } catch {
      toast.error('Impossible d’enregistrer le numéro de suivi.')
    }
  }

  // Print Delivery Note / Packing Slip
  const handlePrintSlip = (order: ShippingOrder) => {
    setSelectedOrderForSlip(order)
    setIsSlipModalOpen(true)
  }

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.tracking_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="bg-[#FEFDF5] text-zinc-900 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
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
            Logistics &amp; Tracking Hub
          </span>
        </div>

        {/* Title Box */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#C5A059]">
              <Truck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Hub Logistique &amp; Suivi</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-zinc-950">
              Centre de Gestion des Expéditions
            </h1>
            <p className="text-zinc-600 text-xs font-light">
              Assignez un transporteur et un numéro de suivi aux commandes disponibles. Aucune zone de frais de port n’est configurée.
            </p>
          </div>

          <button
            onClick={loadOrders}
            className="p-3 bg-[#FAF8F5] border border-zinc-200 text-zinc-700 hover:text-[#C5A059] rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Shipping Zones Config Box */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-serif text-base font-bold text-zinc-950 flex items-center gap-2 border-b border-zinc-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
            1. Zones d&apos;Expédition &amp; Frais de Port Paramétrables
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {zones.length === 0 ? (
              <p className="text-zinc-500">Aucune zone d’expédition configurée.</p>
            ) : zones.map((z) => (
              <div key={z.id} className="p-4 bg-[#FAF8F5] border border-zinc-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-950 block">{z.zone_name}</span>
                  <button
                    type="button"
                    disabled
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase cursor-pointer ${
                      z.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-500'
                    }`}
                  >
                    {z.is_active ? 'Actif' : 'Inactif'}
                  </button>
                </div>
                <p className="text-zinc-500 text-[11px] font-light">Transporteur : {z.carrier_name}</p>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-200 text-[11px] font-mono">
                  <span>Frais : {(z.fee_cents / 100).toFixed(2)} €</span>
                  <span className="text-[#C5A059] font-bold">Gratuit dès {(z.free_threshold_cents / 100).toFixed(2)} €</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Tracking Assignment Table */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="font-serif text-base font-bold text-zinc-950 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#C5A059]" />
              2. Attributions des Numéros de Suivi &amp; Impression Bordereaux
            </h2>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher commande, client ou N° suivi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-zinc-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-zinc-200 text-zinc-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">N° Commande</th>
                  <th className="py-3.5 px-4">Destinataire &amp; Adresse</th>
                  <th className="py-3.5 px-4">Transporteur</th>
                  <th className="py-3.5 px-4">Numéro de Suivi (Tracking)</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions Logistique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-light">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-zinc-500">Aucune commande disponible.</td>
                  </tr>
                ) : filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-[#C5A059]">
                      #{o.id.substring(0, 8)}
                    </td>

                    <td className="py-4 px-4 space-y-0.5">
                      <span className="font-bold text-zinc-950 block">{o.fullName}</span>
                      <span className="text-[11px] text-zinc-500 block truncate max-w-xs">
                        {o.street}, {o.city}, {o.country}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <input
                        type="text"
                        value={o.carrier}
                        placeholder="Transporteur"
                        onChange={(e) => handleAssignTracking(o.id, e.target.value, o.tracking_number)}
                        className="bg-[#FAF8F5] border border-zinc-200 rounded-lg text-xs py-1.5 px-2 font-medium text-zinc-900 focus:outline-none focus:border-[#C5A059]"
                      />
                    </td>

                    <td className="py-4 px-4">
                      <input
                        type="text"
                        placeholder="Numéro de suivi"
                        value={o.tracking_number}
                        onChange={(e) => handleAssignTracking(o.id, o.carrier, e.target.value)}
                        className="px-3 py-1.5 bg-[#FAF8F5] border border-zinc-200 rounded-lg font-mono text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#C5A059] w-40"
                      />
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          o.status === 'shipped'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : o.status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handlePrintSlip(o)}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-900 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#C5A059]" />
                        Bordereau PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Printable Delivery Note / Packing Slip Modal */}
      {isSlipModalOpen && selectedOrderForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border-2 border-[#0D0D0D] rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6 text-zinc-900">
            <div className="flex justify-between items-center border-b-2 border-[#0D0D0D] pb-4">
              <div>
                <h2 className="font-serif text-2xl font-bold tracking-widest text-[#0D0D0D] uppercase">
                  MAISON L&amp;M
                </h2>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
                  Coordonnées de l’expéditeur à renseigner
                </span>
              </div>
              <button
                onClick={() => setIsSlipModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 text-xs bg-[#FAF8F5] p-4 rounded-xl border border-zinc-200">
              <div className="space-y-1">
                <span className="font-bold uppercase text-[10px] text-zinc-500 block">Commande N°</span>
                <span className="font-mono font-bold text-sm text-[#C5A059]">
                  #{selectedOrderForSlip.id.substring(0, 8)}
                </span>
                <span className="text-[11px] text-zinc-600 block">
                  Date : {new Date(selectedOrderForSlip.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>

              <div className="space-y-1">
                <span className="font-bold uppercase text-[10px] text-zinc-500 block">Adresse de Livraison</span>
                <span className="font-bold text-zinc-950 block">{selectedOrderForSlip.fullName}</span>
                <span className="text-zinc-600 block">{selectedOrderForSlip.street}</span>
                <span className="text-zinc-600 block">{selectedOrderForSlip.city}, {selectedOrderForSlip.country}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-bold uppercase text-[10px] text-zinc-500 block">
                Détail des Pièces d&apos;Exception Préparées
              </span>
              <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-2">
              {selectedOrderForSlip.items.length ? selectedOrderForSlip.items.map((item) => (
                <div key={item.id} className="flex justify-between font-serif text-zinc-950 border-b border-zinc-100 pb-2">
                  <span>{item.title} × {item.quantity}</span>
                  <span>{((item.unit_price_cents * item.quantity) / 100).toFixed(2)} €</span>
                </div>
              )) : <p className="text-zinc-500">Aucun détail de produit enregistré pour cette commande.</p>}
              <div className="flex justify-between font-serif font-bold text-zinc-950 border-t border-zinc-100 pt-2">
                <span>Total</span>
                <span>{(selectedOrderForSlip.total_cents / 100).toFixed(2)} €</span>
              </div>
                <div className="text-[11px] text-zinc-500 flex justify-between pt-1">
                  <span>Transporteur : {selectedOrderForSlip.carrier}</span>
                  <span className="font-mono font-bold text-[#C5A059]">
                    N° Suivi : {selectedOrderForSlip.tracking_number || 'EN COURS'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 flex justify-between items-center">
              <span className="text-[10px] font-mono text-zinc-400">
                Informations complémentaires à renseigner
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsSlipModalOpen(false)}
                  className="px-4 py-2 border border-zinc-300 text-zinc-700 text-xs font-semibold uppercase rounded-lg hover:bg-zinc-100 cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print()
                    setIsSlipModalOpen(false)
                  }}
                  className="px-6 py-2 bg-[#0D0D0D] text-[#C5A059] font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[#C5A059] hover:text-[#0D0D0D] transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer le Bordereau
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
