'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedRedirect = searchParams.get('redirect') || '/account'
  const redirectPath =
    requestedRedirect.startsWith('/') &&
    !requestedRedirect.startsWith('//') &&
    !requestedRedirect.includes('\\')
      ? requestedRedirect
      : '/account'

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const supabase = createClient()
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })

        if (signUpError) {
          throw signUpError
        }

        if (data.session) {
          router.push(redirectPath)
          router.refresh()
        } else {
          setMessage('Inscription réussie ! Vérifiez votre email pour confirmer votre compte.')
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          throw signInError
        }

        router.push(redirectPath)
        router.refresh()
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        const message = err.message.toLowerCase()
        setError(
          message.includes('failed to fetch') || message.includes('networkerror')
            ? 'Connexion à Supabase impossible. Vérifiez sur Vercel NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY, puis redéployez. En local, vérifiez .env.local et redémarrez le serveur.'
            : err.message
        )
      } else {
        setError('Une erreur est survenue lors de l\'authentification.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full space-y-8 bg-zinc-900/60 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm shadow-2xl">
      <div className="text-center">
        <Link href="/" className="font-serif text-3xl font-bold tracking-widest text-amber-500 hover:text-amber-400 transition-colors">
          L&M
        </Link>
        <h2 className="mt-4 text-2xl font-serif text-zinc-100">
          {isSignUp ? 'Créer un compte' : 'Espace Personnel'}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          {isSignUp
            ? 'Rejoignez la Maison L&M pour accéder à nos services exclusifs'
            : 'Connectez-vous pour accéder à vos commandes et privilèges'}
        </p>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-800 text-red-300 text-sm p-4 rounded-lg">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-amber-950/50 border border-amber-800 text-amber-300 text-sm p-4 rounded-lg">
          {message}
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleAuth}>
        <div className="space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="full-name" className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1">
                Nom complet
              </label>
              <input
                id="full-name"
                name="fullName"
                type="text"
                required={isSignUp}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm transition-colors"
                placeholder="Jean Dupont"
              />
            </div>
          )}

          <div>
            <label htmlFor="email-address" className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1">
              Adresse email
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm transition-colors"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-sm transition-colors"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 border border-amber-500 text-amber-400 bg-amber-500/10 hover:bg-amber-500 hover:text-zinc-950 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all duration-300 disabled:opacity-50"
          >
            {loading
              ? 'Traitement en cours...'
              : isSignUp
              ? 'S\'inscrire'
              : 'Se connecter'}
          </button>
        </div>
      </form>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError(null)
            setMessage(null)
          }}
          className="text-xs text-zinc-400 hover:text-amber-400 transition-colors underline underline-offset-4"
        >
          {isSignUp
            ? 'Déjà un compte ? Se connecter'
            : 'Nouveau client ? Créer un compte'}
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-950">
      <Suspense fallback={<div className="text-zinc-400 text-sm">Chargement...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
