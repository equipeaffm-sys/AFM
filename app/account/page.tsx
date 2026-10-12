'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { User as UserIcon, Edit2, ShieldCheck, LockKeyhole, ArrowRight, CheckCircle2, PawPrint } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCurrency } from '@/components/CurrencyContext'
import { useSavedProducts } from '@/context/SavedProductsContext'
import Image from 'next/image'
import {
  CATEGORY_LABELS,
  formatDogPrice,
  type Dog,
} from '@/lib/dogs'
import { BLUR_DATA_URL } from '@/lib/constants'

interface UserProfile {
  id: string
  full_name?: string
  role?: string
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [fullNameInput, setFullNameInput] = useState('')
  const [updateLoading, setUpdateLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [recentDogs, setRecentDogs] = useState<Dog[]>([])

  const router = useRouter()
  const { formatPrice } = useCurrency()
  const { favoriteIds, recentlyViewedIds, isHydrated: savedProductsHydrated } = useSavedProducts()

  const loadAccountData = useCallback(async () => {
    try {
      const supabase = createClient()
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) throw userError

      if (!currentUser) {
        router.replace('/login?redirect=%2Faccount')
        return
      }

      setUser(currentUser)
      const [{ data: userProfile, error: profileError }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, role').eq('id', currentUser.id).maybeSingle(),
      ])

      if (profileError) throw profileError
      setProfile(userProfile)
      setFullNameInput(userProfile?.full_name || '')
    } catch (error) {
      console.error('Unable to load customer account:', error)
      toast.error(error instanceof Error ? error.message : 'Impossible de charger les informations du compte.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadAccountData()
  }, [loadAccountData])

  useEffect(() => {
    if (!savedProductsHydrated) return
    let cancelled = false

    const loadRecentlyViewed = async () => {
      if (recentlyViewedIds.length === 0) {
        setRecentDogs([])
        return
      }
      try {
        const { data, error } = await createClient()
          .from('dogs')
          .select('*')
          .in('id', recentlyViewedIds)
          .eq('is_published', true)

        if (error) throw error
        if (!cancelled) {
          const dogsById = new Map((data || []).map((dog) => [dog.id, dog as Dog]))
          setRecentDogs(recentlyViewedIds.map((id) => dogsById.get(id)).filter((dog): dog is Dog => !!dog))
        }
      } catch (error) {
        console.error('Unable to load recently viewed dogs:', error)
        if (!cancelled) toast.error('Impossible de charger les fiches récemment consultées.')
      }
    }

    void loadRecentlyViewed()
    return () => {
      cancelled = true
    }
  }, [recentlyViewedIds, savedProductsHydrated])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!fullNameInput.trim()) {
      toast.error('Le nom complet ne peut pas être vide.')
      return
    }

    setUpdateLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: fullNameInput.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('id')
        .maybeSingle()

      if (error) {
        throw error
      }
      if (!data) throw new Error('Profil introuvable : aucune modification n’a été enregistrée.')

      setProfile((prev) => (prev ? { ...prev, full_name: fullNameInput.trim() } : null))
      setFullNameInput(fullNameInput.trim())
      setIsEditing(false)
      toast.success('Profil mis à jour avec succès.')
    } catch (error) {
      console.error('Unable to update customer profile:', error)
      toast.error(error instanceof Error ? error.message : 'Impossible d’enregistrer les modifications.')
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email) return
    if (newPassword.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('La confirmation ne correspond pas au nouveau mot de passe.')
      return
    }

    setPasswordLoading(true)
    try {
      const supabase = createClient()
      const { error: reauthenticationError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (reauthenticationError) throw reauthenticationError

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Votre mot de passe a été modifié.')
    } catch (error) {
      console.error('Unable to update customer password:', error)
      toast.error(error instanceof Error ? error.message : 'Impossible de modifier le mot de passe.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Unable to sign out customer:', error)
      toast.error(error instanceof Error ? error.message : 'Impossible de vous déconnecter.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-zinc-950 text-zinc-400">
        Chargement de votre compte...
      </div>
    )
  }

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || 'cher visiteur'

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16 text-zinc-100 space-y-8">
      <header className="overflow-hidden rounded-3xl border border-zinc-800 bg-[radial-gradient(ellipse_at_top,rgba(180,140,65,0.14),transparent_55%),rgba(24,24,27,0.72)] px-6 py-10 text-center shadow-2xl backdrop-blur-md sm:px-10">
        <Link href="/" className="inline-flex flex-col items-center text-[#eeeae2] transition-colors hover:text-amber-300">
          <span className="font-serif text-3xl font-light uppercase tracking-[0.28em]">
            L<span className="font-normal text-amber-500">&amp;</span>M
          </span>
          <span className="mt-1 text-[8px] font-light uppercase tracking-[0.48em] text-zinc-500">
            Élevage
          </span>
        </Link>
        <div className="mt-7 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Session active
        </div>
        <h1 className="mt-3 font-serif text-3xl font-medium text-zinc-100 sm:text-4xl">
          Bonjour, {firstName}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
          Retrouvez vos informations, vos compagnons favoris et le suivi de vos demandes au même endroit.
        </p>
        <nav aria-label="Navigation du compte" className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a href="#profil" className="rounded-full border border-zinc-700 px-4 py-2 text-xs text-zinc-300 transition-colors hover:border-amber-500/60 hover:text-amber-300">
            Mon profil
          </a>
          <a href="#commandes" className="rounded-full border border-zinc-700 px-4 py-2 text-xs text-zinc-300 transition-colors hover:border-amber-500/60 hover:text-amber-300">
            Mes demandes
          </a>
          <Link href="/wishlist" className="rounded-full border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-xs text-amber-200 transition-colors hover:bg-amber-500/20">
            Mes favoris
          </Link>
        </nav>
        <div className="mt-7 flex justify-center">
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-zinc-700 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-300 shadow-sm transition-colors hover:border-red-500 hover:text-red-400"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <section aria-label="Résumé de votre espace" className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Compte connecté</p>
          <p className="mt-2 truncate text-sm text-zinc-100">{profile?.full_name || user?.email}</p>
          <p className="mt-1 truncate text-xs text-zinc-500">{user?.email}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Compagnons à découvrir</p>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
            Parcourez nos compagnons disponibles et lancez une demande de réservation quand un profil vous correspond.
          </p>
          <Link href="/nos-chiens" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-amber-300 hover:text-amber-200">
            Voir nos chiens <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Mes favoris</p>
          <p className="mt-2 font-serif text-2xl text-zinc-100">
            {savedProductsHydrated ? `${favoriteIds.length} compagnon${favoriteIds.length > 1 ? 's' : ''}` : 'Chargement…'}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
            Retrouvez les chiens que vous avez gardés de côté sur cet appareil.
          </p>
          <Link href="/wishlist" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-amber-300 hover:text-amber-200">
            Voir mes favoris <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {recentDogs.length > 0 && (
        <section id="recemment-vus" className="scroll-mt-28 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl text-zinc-100">Récemment consultés</h2>
              <p className="mt-1 text-xs text-zinc-500">Vos dernières fiches vues sur cet appareil.</p>
            </div>
            <Link href="/nos-chiens" className="text-xs text-amber-300 hover:text-amber-200">Voir tous nos chiens</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {recentDogs.slice(0, 4).map((dog) => (
              <Link key={dog.id} href={`/nos-chiens/${dog.slug}`} className="group overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-950/50">
                <div className="relative aspect-[4/5] bg-zinc-800">
                  {dog.images?.[0] ? (
                    <Image
                      src={dog.images[0]}
                      alt={dog.name}
                      fill
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl text-zinc-600">🐾</div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-[#191a19]/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#c2b18f] backdrop-blur-md">
                    {CATEGORY_LABELS[dog.category]}
                  </span>
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 font-serif text-sm text-zinc-200 group-hover:text-amber-200">{dog.name}</p>
                  <p className="mt-1 text-xs text-[#c2b18f]">{formatDogPrice(dog.price_cents, dog.price_on_request, formatPrice)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card & Saved Measurements */}
        <div id="profil" className="space-y-6 scroll-mt-28">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2.5 text-amber-500 font-serif text-lg font-bold">
                <UserIcon className="w-5 h-5" />
                Profil
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-zinc-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Modifier
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1">
                    Nom Complet
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="flex-1 py-2 bg-amber-500 text-zinc-950 hover:bg-amber-400 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {updateLoading ? 'Enregistrement...' : 'Sauvegarder'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-2 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg text-xs transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-sm font-light">
                <div>
                  <span className="text-zinc-500 block text-[11px] uppercase tracking-wider">Adresse email</span>
                  <span className="text-zinc-200 font-mono text-xs">{user?.email}</span>
                </div>

                <div>
                  <span className="text-zinc-500 block text-[11px] uppercase tracking-wider">Nom complet</span>
                  <span className="text-zinc-100 font-medium">{profile?.full_name || '—'}</span>
                </div>

              </div>
            )}
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-5">
            <div className="flex items-center gap-2.5 border-b border-zinc-800/80 pb-4 font-serif text-lg font-bold text-amber-500">
              <ShieldCheck className="h-5 w-5" />
              Sécurité du compte
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">
              Confirmez votre mot de passe actuel avant d’en choisir un nouveau.
            </p>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <label className="block text-[11px] uppercase tracking-wider text-zinc-400">
                Mot de passe actuel
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                />
              </label>
              <label className="block text-[11px] uppercase tracking-wider text-zinc-400">
                Nouveau mot de passe
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                />
              </label>
              <label className="block text-[11px] uppercase tracking-wider text-zinc-400">
                Confirmer le nouveau mot de passe
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                />
              </label>
              <button
                type="submit"
                disabled={passwordLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/60 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-amber-300 transition-colors hover:bg-amber-500 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LockKeyhole className="h-3.5 w-3.5" />
                {passwordLoading ? 'Mise à jour…' : 'Modifier le mot de passe'}
              </button>
            </form>
          </div>
        </div>

        {/* Saved dogs & reservation info */}
        <div id="commandes" className="lg:col-span-2 space-y-6 scroll-mt-28">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-6">
            <div className="flex items-center gap-2.5 text-amber-500 font-serif text-lg font-bold border-b border-zinc-800/80 pb-4">
              <PawPrint className="w-5 h-5" />
              Mes favoris
            </div>

            {favoriteIds.length === 0 ? (
              <div className="py-12 text-center space-y-4 bg-zinc-950/40 rounded-xl border border-zinc-800/60 p-6">
                <PawPrint className="w-10 h-10 text-zinc-700 mx-auto" />
                <p className="text-zinc-400 font-serif text-sm">
                  Vous n&apos;avez encore enregistré aucun compagnon sur cet appareil.
                </p>
                <Link
                  href="/nos-chiens"
                  className="inline-block px-5 py-2.5 bg-amber-500 text-zinc-950 font-semibold text-xs uppercase tracking-wider rounded-lg hover:bg-amber-400 transition-colors shadow-md"
                >
                  Découvrir nos chiens
                </Link>
              </div>
            ) : (
              <div className="space-y-3 text-sm font-light text-zinc-300">
                <p>
                  Vous avez enregistré <span className="font-semibold text-amber-300">{favoriteIds.length}</span> compagnon
                  {favoriteIds.length > 1 ? 's' : ''} sur cet appareil. Retrouvez-les, puis lancez une demande de réservation
                  depuis la fiche qui vous intéresse.
                </p>
                <Link
                  href="/wishlist"
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-500/60 bg-amber-500/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-amber-300 transition-colors hover:bg-amber-500/20"
                >
                  Ouvrir mes favoris <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-500 font-serif text-lg font-bold border-b border-zinc-800/80 pb-4">
              <ShieldCheck className="w-5 h-5" />
              Vos demandes de réservation
            </div>
            <p className="text-sm font-light leading-relaxed text-zinc-400">
              Chaque demande de réservation est étudiée personnellement par notre élevage. Par respect pour la
              confidentialité de nos familles, le suivi de vos échanges se fait directement par email ou par téléphone :
              vous recevrez une réponse à l&apos;adresse indiquée lors de votre demande.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-white/[0.12] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-300 transition-colors hover:border-[#8f8065] hover:text-white"
              >
                Nous contacter
              </Link>
              <Link
                href="/faq"
                className="inline-flex items-center gap-2 rounded-lg border border-white/[0.12] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-300 transition-colors hover:border-[#8f8065] hover:text-white"
              >
                Consulter la FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
