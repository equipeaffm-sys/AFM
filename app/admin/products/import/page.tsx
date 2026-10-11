'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Upload, Download, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MassImportExportPage() {
  const [csvContent, setCsvContent] = useState('')
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importStatus, setImportStatus] = useState<string | null>(null)

  // Handle Drag & Drop / File Selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      setCsvContent(text)
      toast.success('Fichier CSV chargé. Cliquez sur Lancer l\'UPSERT.')
    }
    reader.readAsText(file)
  }

  // Parse CSV into Objects
  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim())

    return lines.slice(1).map((line) => {
      // Basic CSV regex row split respecting quoted strings
      const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || []
      const obj: Record<string, string> = {}
      headers.forEach((header, index) => {
        let val = values[index] || ''
        val = val.replace(/^"|"$/g, '').trim()
        obj[header] = val
      })
      return obj
    })
  }

  // Mass UPSERT Import
  const handleImport = async () => {
    if (!csvContent) {
      toast.error('Veuillez d\'abord charger un fichier CSV.')
      return
    }

    setImporting(true)
    setImportStatus(null)

    try {
      const records = parseCSV(csvContent)
      if (records.length === 0) {
        toast.error('Format CSV invalide ou données vides.')
        setImporting(false)
        return
      }

      if (records.some((record) => !record.title || !record.price_cents || !record.stock || !record.category)) {
        throw new Error('Chaque ligne doit contenir title, price_cents, stock et category.')
      }

      const productsToUpsert = records.map((r) => ({
        title: r.title,
        description: r.description || '',
        price_cents: parseInt(r.price_cents, 10),
        stock: parseInt(r.stock, 10),
        category: r.category,
        images: r.images ? [r.images] : [],
        is_active: true,
      }))

      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .upsert(productsToUpsert)
        .select('id')

      if (error) {
        toast.error(`Erreur d'importation : ${error.message}`)
        setImportStatus(`Erreur : ${error.message}`)
      } else {
        const count = data?.length || productsToUpsert.length
        toast.success(`Succès ! ${count} produit(s) importé(s) ou mis à jour.`)
        setImportStatus(`Succès ! ${count} création(s) ajoutée(s) ou mise(s) à jour en base Supabase.`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inattendue.'
      toast.error(`Importation impossible : ${message}`)
      setImportStatus(`Erreur : ${message}`)
    } finally {
      setImporting(false)
    }
  }

  // Export CSV
  const handleExport = async () => {
    setExporting(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('products').select('*')

      if (error) throw error
      const itemsToExport = data || []

      const headers = ['title', 'description', 'price_cents', 'stock', 'category', 'images']
      const rows = itemsToExport.map((p) => [
        `"${p.title.replace(/"/g, '""')}"`,
        `"${(p.description || '').replace(/"/g, '""')}"`,
        p.price_cents,
        p.stock,
        `"${p.category}"`,
        `"${p.images?.[0] || ''}"`,
      ])

      const csvData = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `lm_catalog_export_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Export du catalogue téléchargé !')
    } catch {
      toast.error('Erreur lors de l\'exportation.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="bg-[#FEFDF5] text-zinc-900 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Back Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600 hover:text-[#C5A059] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au Dashboard Admin
          </Link>
          <span className="text-xs uppercase tracking-widest text-[#C5A059] font-bold">
            Catalog Mass Management
          </span>
        </div>

        {/* Title Box */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#C5A059]">
              <FileText className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">UPSERT Mass Module</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-zinc-950">
              Import &amp; Export Massif CSV / JSON
            </h1>
            <p className="text-zinc-600 text-xs font-light">
              Importez ou mettez à jour votre catalogue de créations en masse via fichier CSV structuré.
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-6 py-3.5 bg-[#FAF8F5] border border-zinc-300 hover:border-[#C5A059] text-zinc-900 hover:text-[#C5A059] text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Génération...' : 'Exporter le Catalogue (CSV)'}
          </button>
        </div>

        {/* Import Module Box */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="font-serif text-lg font-bold text-zinc-950 flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#C5A059]" />
            Glisser-Déposer ou Sélectionner un Fichier CSV
          </h2>

          <div className="border-2 border-dashed border-zinc-300 rounded-2xl p-8 text-center bg-[#FAF8F5] space-y-4 hover:border-[#C5A059] transition-colors">
            <FileText className="w-12 h-12 mx-auto text-[#C5A059]" />
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                Déposez votre fichier CSV ici ou parcourez vos dossiers
              </p>
              <p className="text-xs text-zinc-500 font-light mt-1">
                Colonnes requises : <code className="bg-zinc-200 px-1 rounded">title</code>, <code className="bg-zinc-200 px-1 rounded">price_cents</code>, <code className="bg-zinc-200 px-1 rounded">stock</code>, <code className="bg-zinc-200 px-1 rounded">category</code>
              </p>
            </div>

            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="block w-full text-xs text-zinc-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#0D0D0D] file:text-[#C5A059] hover:file:bg-[#C5A059] hover:file:text-[#0D0D0D] file:cursor-pointer file:transition-all cursor-pointer"
            />
          </div>

          {/* CSV file input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                Aperçu / Édition du Contenu CSV
              </label>
            </div>
            <textarea
              rows={8}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Collez vos données CSV ici..."
              className="w-full p-4 bg-[#FAF8F5] border border-zinc-200 rounded-xl font-mono text-xs text-zinc-900 focus:outline-none focus:border-[#C5A059]"
            />
          </div>

          {importStatus && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {importStatus}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleImport}
              disabled={importing || !csvContent}
              className="px-8 py-4 bg-[#0D0D0D] text-[#C5A059] hover:bg-[#C5A059] hover:text-[#0D0D0D] text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-xl disabled:opacity-50"
            >
              {importing ? (
                'Importation UPSERT en cours...'
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Lancer l&apos;UPSERT en Base de Données
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
