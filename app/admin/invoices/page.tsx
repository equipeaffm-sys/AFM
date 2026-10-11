'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Receipt,
  Printer,
  ArrowLeft,
  X,
  FileText,
  Search,
} from 'lucide-react'

export interface Invoice {
  id: string
  orderId: string
  invoiceNumber: string
  date: string
  customerName: string
  customerEmail: string
  street: string
  city: string
  country: string
  siret: string
  vatNumber: string
  items: { description: string; qty: number; unitPriceHt: number }[]
  vatRatePercent: number
}

export default function AdminInvoicesPage() {
  const [invoices] = useState<Invoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const handleOpenModal = (inv: Invoice) => {
    setSelectedInvoice(inv)
    setIsInvoiceModalOpen(true)
  }

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.orderId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const calculateTotals = (inv: Invoice) => {
    const subtotalHt = inv.items.reduce((acc, item) => acc + item.unitPriceHt * item.qty, 0)
    const vatAmount = subtotalHt * (inv.vatRatePercent / 100)
    const totalTtc = subtotalHt + vatAmount
    return { subtotalHt, vatAmount, totalTtc }
  }

  return (
    <div className="bg-[#FAF8F5] min-h-screen text-zinc-900 p-6 lg:p-12 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div className="space-y-1">
          <Link
            href="/admin/finance"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-[#C5A059] transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la Finance
          </Link>
          <div className="flex items-center gap-3">
            <Receipt className="w-7 h-7 text-[#C5A059]" />
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-950">
              Factures
            </h1>
          </div>
          <p className="text-xs text-zinc-600 font-light">
            Aucune facture n’est disponible. Connectez une source de facturation pour afficher les documents émis.
          </p>
        </div>
      </div>

      {/* Invoices List Panel */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-zinc-100 pb-4">
          <h2 className="font-serif font-bold text-lg text-zinc-950 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#C5A059]" />
            Factures Émises &amp; Mentions Légales Conformité
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher facture, client ou N°..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#C5A059]"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-zinc-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-zinc-200 text-zinc-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">N° Facture</th>
                <th className="py-3.5 px-4">N° Commande</th>
                <th className="py-3.5 px-4">Client &amp; Adresse</th>
                <th className="py-3.5 px-4">Montant HT</th>
                <th className="py-3.5 px-4">TVA</th>
                <th className="py-3.5 px-4">Montant TTC</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-light">
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-zinc-500">Aucune facture disponible.</td>
                </tr>
              )}
              {filteredInvoices.map((inv) => {
                const { subtotalHt, vatAmount, totalTtc } = calculateTotals(inv)
                return (
                  <tr key={inv.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-[#C5A059]">
                      {inv.invoiceNumber}
                    </td>

                    <td className="py-4 px-4 font-mono text-zinc-500">
                      #{inv.orderId.substring(0, 8)}
                    </td>

                    <td className="py-4 px-4 space-y-0.5">
                      <span className="font-serif font-bold text-zinc-950 block">{inv.customerName}</span>
                      <span className="text-[11px] text-zinc-500 block truncate max-w-xs">{inv.street}, {inv.city}</span>
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-zinc-800">
                      {subtotalHt.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </td>

                    <td className="py-4 px-4 font-mono text-zinc-500">
                      {vatAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </td>

                    <td className="py-4 px-4 font-serif font-bold text-emerald-800">
                      {totalTtc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </td>

                    <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenModal(inv)}
                        className="px-3 py-1.5 bg-[#0D0D0D] text-[#C5A059] hover:bg-[#C5A059] hover:text-[#0D0D0D] text-xs font-bold uppercase rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Aperçu PDF
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Invoice PDF Modal */}
      {isInvoiceModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border-2 border-[#0D0D0D] rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 text-zinc-900 max-h-[90vh] overflow-y-auto">
            {/* Header & Logo */}
            <div className="flex justify-between items-start border-b-2 border-[#0D0D0D] pb-6">
              <div className="space-y-1">
                <h2 className="font-serif text-3xl font-bold tracking-widest text-[#0D0D0D] uppercase">
                  MAISON L&amp;M PARIS
                </h2>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
                  Coordonnées du vendeur à renseigner
                </p>
                <p className="text-[10px] font-mono text-zinc-500">
                  SIRET : {selectedInvoice.siret} • TVA Intracommunautaire : {selectedInvoice.vatNumber}
                </p>
              </div>

              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-900 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Invoice Meta Grid */}
            <div className="grid grid-cols-2 gap-6 text-xs bg-[#FAF8F5] p-5 rounded-2xl border border-zinc-200">
              <div className="space-y-1">
                <span className="font-bold uppercase text-[10px] text-zinc-400 block">Facture Officielle N°</span>
                <span className="font-mono font-bold text-base text-[#C5A059] block">
                  {selectedInvoice.invoiceNumber}
                </span>
                <span className="text-[11px] text-zinc-500 block font-mono">
                  Commande : #{selectedInvoice.orderId.substring(0, 8)}
                </span>
                <span className="text-[11px] text-zinc-500 block">Date d&apos;Émission : {selectedInvoice.date}</span>
              </div>

              <div className="space-y-1">
                <span className="font-bold uppercase text-[10px] text-zinc-400 block">Facturé à</span>
                <span className="font-bold text-zinc-950 block text-sm">{selectedInvoice.customerName}</span>
                <span className="text-zinc-600 block">{selectedInvoice.street}</span>
                <span className="text-zinc-600 block">{selectedInvoice.city}, {selectedInvoice.country}</span>
              </div>
            </div>

            {/* Invoice Line Items */}
            <div className="space-y-2 text-xs">
              <span className="font-bold uppercase text-[10px] text-zinc-400 block">Détail des Prestations &amp; Créations</span>
              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#FAF8F5] border-b border-zinc-200 text-[10px] uppercase font-mono text-zinc-500">
                    <tr>
                      <th className="p-3">Désignation</th>
                      <th className="p-3 text-center">Qté</th>
                      <th className="p-3 text-right">Prix Unitaire HT</th>
                      <th className="p-3 text-right">Total HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-mono text-xs">
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-serif font-bold text-zinc-950">{item.description}</td>
                        <td className="p-3 text-center font-bold">{item.qty}</td>
                        <td className="p-3 text-right">
                          {item.unitPriceHt.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </td>
                        <td className="p-3 text-right font-bold">
                          {(item.unitPriceHt * item.qty).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Breakdown */}
            {(() => {
              const { subtotalHt, vatAmount, totalTtc } = calculateTotals(selectedInvoice)
              return (
                <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-zinc-200 space-y-2 text-xs font-mono ml-auto max-w-xs">
                  <div className="flex justify-between text-zinc-600">
                    <span>Total HT :</span>
                    <span className="font-bold">{subtotalHt.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>TVA ({selectedInvoice.vatRatePercent}%) :</span>
                    <span className="font-bold">{vatAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                  <div className="flex justify-between text-base font-serif font-bold text-[#C5A059] pt-2 border-t border-zinc-200">
                    <span>Total TTC :</span>
                    <span>{totalTtc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                </div>
              )
            })()}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-zinc-200 flex justify-between items-center">
              <span className="text-[10px] font-mono text-zinc-400">
                Conditions de paiement à renseigner
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 border border-zinc-300 text-zinc-700 text-xs font-semibold uppercase rounded-xl hover:bg-zinc-100 cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-6 py-2 bg-[#0D0D0D] text-[#C5A059] font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#C5A059] hover:text-[#0D0D0D] transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer Facture PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
