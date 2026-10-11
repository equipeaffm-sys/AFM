'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { User as UserIcon, ShoppingBag, Edit2, Package, Clock, ShieldCheck, LockKeyhole } from 'lucide-react'
import toast from 'react-hot-toast'

interface UserProfile {
  id: string
  full_name?: string
  role?: string
}

interface Order {
  id: string
  status: string
  total_cents: number
  created_at: string
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [fullNameInput, setFullNameInput] = useState('')
  const [updateLoading, setUpdateLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const router = useRouter()

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
      const [{ data: userProfile, error: profileError }, { data: userOrders, error: ordersError }] =
        await Promise.all([
          supabase.from('profiles').select('id, full_name, role').eq('id', currentUser.id).maybeSingle(),
          supabase
            .from('orders')
            .select('id, status, total_cents, created_at')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false }),
        ])

      if (profileError) throw profileError
      if (ordersError) throw ordersError
      setProfile(userProfile)
      setFullNameInput(userProfile?.full_name || '')
      setOrders(userOrders || [])
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-zinc-100 space-y-8">
      {/* Header */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 backdrop-blur-md shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-amber-500 font-medium">Maison L&M</span>
          <h1 className="text-3xl font-serif font-bold text-zinc-100 mt-1">Mon compte</h1>
          <p className="text-zinc-400 text-sm font-light mt-1">
            Consultez votre profil et l’historique de vos commandes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSignOut}
            className="px-5 py-2.5 border border-zinc-700 hover:border-red-500 text-zinc-300 hover:text-red-400 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors shadow-sm"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card & Saved Measurements */}
        <div className="space-y-6">
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

        {/* Order History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-6">
            <div className="flex items-center gap-2.5 text-amber-500 font-serif text-lg font-bold border-b border-zinc-800/80 pb-4">
              <ShoppingBag className="w-5 h-5" />
              Historique des commandes
            </div>

            {orders.length === 0 ? (
              <div className="py-12 text-center space-y-4 bg-zinc-950/40 rounded-xl border border-zinc-800/60 p-6">
                <Package className="w-10 h-10 text-zinc-700 mx-auto" />
                <p className="text-zinc-400 font-serif text-sm">
                  Vous n&apos;avez aucune commande enregistrée pour le moment.
                </p>
                <Link
                  href="/products"
                  className="inline-block px-5 py-2.5 bg-amber-500 text-zinc-950 font-semibold text-xs uppercase tracking-wider rounded-lg hover:bg-amber-400 transition-colors shadow-md"
                >
                  Découvrir la collection
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-zinc-950/60 p-5 rounded-xl border border-zinc-800/80 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-zinc-200">
                            Commande #{order.id.substring(0, 8)}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                              order.status === 'paid'
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                                : 'bg-amber-950/60 text-amber-400 border-amber-800'
                            }`}
                          >
                            {order.status === 'paid' ? 'Payée' : order.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-zinc-500 text-xs font-light">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(order.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-4 justify-between sm:justify-end border-t sm:border-t-0 border-zinc-800/80 pt-3 sm:pt-0">
                        <div>
                          <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Montant Total</span>
                          <span className="text-base font-serif font-bold text-amber-500">
                            {(order.total_cents / 100).toLocaleString('fr-FR', {
                              style: 'currency',
                              currency: 'EUR',
                            })}
                          </span>
                        </div>

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
