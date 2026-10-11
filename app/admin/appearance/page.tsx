'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Palette,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Save,
  RefreshCw,
  Eye,
  Megaphone,
  LayoutTemplate,
  Globe,
  CheckCircle2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { DEFAULT_SITE_SETTINGS, SiteSettings, HomepageSection, sanitizeSiteSettings } from '@/lib/settings'

export default function AdminAppearancePage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [previewLanguage, setPreviewLanguage] = useState<'FR' | 'EN' | 'ES' | 'DE'>('FR')

  // Fetch Settings from Supabase
  const loadSettings = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'main_config')
        .single()

      if (!error && data?.value) {
        setSettings(sanitizeSiteSettings(data.value))
      } else {
        setSettings(DEFAULT_SITE_SETTINGS)
      }
    } catch {
      setSettings(DEFAULT_SITE_SETTINGS)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  // Handle Hero Image Upload to Supabase Storage
  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `hero_${Date.now()}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (!uploadError) {
        const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)
        if (data?.publicUrl) {
          setSettings((prev: SiteSettings) => ({ ...prev, hero_image_url: data.publicUrl }))
          toast.success('Image téléversée. Enregistrez les paramètres pour la publier.')
        }
      } else {
        toast.error('Impossible de téléverser l’image.')
      }
    } catch {
      toast.error('Impossible de téléverser l’image.')
    }
  }

  // Reorder Homepage Sections
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...settings.homepage_sections]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newSections.length) return
    const temp = newSections[index]
    newSections[index] = newSections[targetIndex]
    newSections[targetIndex] = temp
    setSettings((prev: SiteSettings) => ({ ...prev, homepage_sections: newSections }))
  }

  // Toggle Section Activation
  const handleToggleSection = (sectionId: string) => {
    setSettings((prev: SiteSettings) => ({
      ...prev,
      homepage_sections: prev.homepage_sections.map((s: HomepageSection) =>
        s.id === sectionId ? { ...s, is_active: !s.is_active } : s
      ),
    }))
  }

  // Save settings and refresh the public layout.
  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('site_settings').upsert({
        key: 'main_config',
        value: settings,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error

      const response = await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/', type: 'layout' }),
      })

      if (response.ok) {
        toast.success('Paramètres d’apparence enregistrés.')
      } else {
        toast.error('Paramètres enregistrés, mais le cache n’a pas pu être actualisé.')
      }
    } catch {
      toast.error('Impossible d’enregistrer les paramètres d’apparence.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-[#FAFAFA] text-[#0D0D0D] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600 hover:text-[#C5A059] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au Dashboard Admin
          </Link>
          <span className="text-xs uppercase tracking-widest text-[#C5A059] font-bold">
            Apparence du site
          </span>
        </div>

        {/* Title & Save Bar */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#C5A059]">
              <Palette className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Paramètres visuels et contenus</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-zinc-950">
              Paramètres d’apparence du site
            </h1>
            <p className="text-zinc-600 text-xs font-light">
              Modifiez les textes de présentation, l’image principale et l’ordre des sections de la page d’accueil.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadSettings}
              className="p-3 bg-[#FAFAFA] border border-zinc-200 text-zinc-700 hover:text-[#C5A059] rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-8 py-3.5 bg-[#0D0D0D] text-[#C5A059] hover:bg-[#C5A059] hover:text-[#0D0D0D] text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Revalidation Cache...' : 'Enregistrer & Synchroniser'}
            </button>
          </div>
        </div>

        {/* Studio Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls Column */}
          <div className="space-y-8">
            {/* Multi-Language Announcement Marquee Settings (FR/EN/ES/DE) */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h2 className="font-serif text-base font-bold text-zinc-950 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#C5A059]" />
                  2. Bandeau Défilant (Multilingue FR / EN / ES / DE)
                </h2>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">
                    {settings.announcement_active ? 'Actif' : 'Masqué'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((prev: SiteSettings) => ({
                        ...prev,
                        announcement_active: !prev.announcement_active,
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.announcement_active ? 'bg-emerald-600' : 'bg-zinc-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        settings.announcement_active ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                    Annonce Français (FR) *
                  </label>
                  <input
                    type="text"
                    value={settings.announcement_texts.FR}
                    onChange={(e) =>
                      setSettings((prev: SiteSettings) => ({
                        ...prev,
                        announcement_text: e.target.value,
                        announcement_texts: { ...prev.announcement_texts, FR: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-2 bg-[#FAFAFA] border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                    Annonce Anglais (EN) *
                  </label>
                  <input
                    type="text"
                    value={settings.announcement_texts.EN}
                    onChange={(e) =>
                      setSettings((prev: SiteSettings) => ({
                        ...prev,
                        announcement_texts: { ...prev.announcement_texts, EN: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-2 bg-[#FAFAFA] border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                    Annonce Espagnol (ES) *
                  </label>
                  <input
                    type="text"
                    value={settings.announcement_texts.ES}
                    onChange={(e) =>
                      setSettings((prev: SiteSettings) => ({
                        ...prev,
                        announcement_texts: { ...prev.announcement_texts, ES: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-2 bg-[#FAFAFA] border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                    Annonce Allemand (DE) *
                  </label>
                  <input
                    type="text"
                    value={settings.announcement_texts.DE}
                    onChange={(e) =>
                      setSettings((prev: SiteSettings) => ({
                        ...prev,
                        announcement_texts: { ...prev.announcement_texts, DE: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-2 bg-[#FAFAFA] border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>
            </div>

            {/* Hero Section Banner Settings */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="font-serif text-base font-bold text-zinc-950 flex items-center gap-2 border-b border-zinc-100 pb-3">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                3. Section Hero (Bannière Principale)
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                    Titre Principal
                  </label>
                  <input
                    type="text"
                    value={settings.hero_title}
                    onChange={(e) =>
                      setSettings((prev: SiteSettings) => ({ ...prev, hero_title: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 bg-[#FAFAFA] border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                    Sous-Titre Descriptif
                  </label>
                  <textarea
                    rows={3}
                    value={settings.hero_subtitle}
                    onChange={(e) =>
                      setSettings((prev: SiteSettings) => ({ ...prev, hero_subtitle: e.target.value }))
                    }
                    className="w-full p-3 bg-[#FAFAFA] border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                      Bouton CTA Intitulé
                    </label>
                    <input
                      type="text"
                      value={settings.hero_cta_text}
                      onChange={(e) =>
                        setSettings((prev: SiteSettings) => ({ ...prev, hero_cta_text: e.target.value }))
                      }
                      className="w-full px-4 py-2 bg-[#FAFAFA] border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                      Lien CTA URL
                    </label>
                    <input
                      type="text"
                      value={settings.hero_cta_link}
                      onChange={(e) =>
                        setSettings((prev: SiteSettings) => ({ ...prev, hero_cta_link: e.target.value }))
                      }
                      className="w-full px-4 py-2 bg-[#FAFAFA] border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                    Image de Fond Hero (Fichier Local ou URL)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeroImageUpload}
                    className="block w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#0D0D0D] file:text-[#C5A059] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Layout Reordering */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="font-serif text-base font-bold text-zinc-950 flex items-center gap-2 border-b border-zinc-100 pb-3">
                <LayoutTemplate className="w-4 h-4 text-[#C5A059]" />
                4. Constructeur de Page d&apos;Accueil (Layout Reordering)
              </h2>

              <div className="space-y-3">
                {settings.homepage_sections.map((section: HomepageSection, idx: number) => (
                  <div
                    key={section.id}
                    className="p-4 bg-[#FAFAFA] border border-zinc-200 rounded-xl flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#0D0D0D] text-[#C5A059] font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-serif font-bold text-xs text-zinc-950">
                        {section.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSection(section.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          section.is_active
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-zinc-200 text-zinc-500'
                        }`}
                      >
                        {section.is_active ? 'Actif' : 'Masqué'}
                      </button>

                      <div className="flex items-center gap-1 border-l border-zinc-200 pl-2">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSection(idx, 'up')}
                          className="p-1 bg-white border border-zinc-200 rounded hover:bg-[#C5A059] hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === settings.homepage_sections.length - 1}
                          onClick={() => handleMoveSection(idx, 'down')}
                          className="p-1 bg-white border border-zinc-200 rounded hover:bg-[#C5A059] hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="space-y-4 lg:sticky lg:top-24 h-fit">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-700 font-serif font-bold text-sm">
                <Eye className="w-4 h-4 text-[#C5A059]" />
                Prévisualisation en Direct (Live Preview)
              </div>

              {/* Language Switcher for Preview */}
              <div className="flex items-center gap-1 text-xs bg-white border border-zinc-200 rounded-lg p-1">
                <Globe className="w-3.5 h-3.5 text-[#C5A059]" />
                {(['FR', 'EN', 'ES', 'DE'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setPreviewLanguage(lang)}
                    className={`px-2 py-0.5 font-bold rounded text-[10px] cursor-pointer ${
                      previewLanguage === lang ? 'bg-[#0D0D0D] text-[#C5A059]' : 'text-zinc-500'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#FAFAFA] border-4 border-[#0D0D0D] rounded-3xl overflow-hidden shadow-2xl space-y-0 text-zinc-900">
              {/* Marquee Preview */}
              {settings.announcement_active && (
                <div className="bg-[#0D0D0D] text-[#C5A059] text-[9px] uppercase font-semibold tracking-widest py-1 px-3 whitespace-nowrap overflow-hidden text-center">
                  {settings.announcement_texts[previewLanguage] || settings.announcement_texts.FR}
                </div>
              )}

              {/* Hero Banner Preview */}
              <div className="relative h-72 flex items-center justify-center p-6 text-center border-b border-zinc-200 overflow-hidden">
                {settings.hero_image_url && (
                  <Image
                    src={settings.hero_image_url}
                    alt="Aperçu de la bannière"
                    fill
                    className="object-cover opacity-25"
                  />
                )}
                <div className="relative z-10 space-y-3 max-w-sm">
                  <h3 className="font-serif text-xl font-bold leading-tight text-zinc-950">
                    {settings.hero_title} <span className="text-[#C5A059]">Maison L&amp;M</span>
                  </h3>
                  <p className="text-[11px] text-zinc-700 line-clamp-2 font-light">
                    {settings.hero_subtitle}
                  </p>
                  <button className="px-4 py-2 bg-[#0D0D0D] text-[#C5A059] font-bold text-[10px] uppercase rounded-md">
                    {settings.hero_cta_text}
                  </button>
                </div>
              </div>

              {/* Active Layout Cards Preview */}
              <div className="p-4 space-y-3 bg-[#FAFAFA]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                  Ordre des Blocs de la Page d&apos;Accueil :
                </span>
                {settings.homepage_sections
                  .filter((s: HomepageSection) => s.is_active)
                  .map((s: HomepageSection) => (
                    <div
                      key={s.id}
                      className="p-3 bg-white border border-zinc-200 rounded-xl text-xs font-serif font-bold text-zinc-800 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {s.title}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
