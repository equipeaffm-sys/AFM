'use client'

import React, { useState } from 'react'
import { PawPrint } from 'lucide-react'
import toast from 'react-hot-toast'

const HOUSING_OPTIONS = [
  'Maison avec jardin',
  'Maison sans jardin',
  'Appartement',
  'Ferme / propriété',
]

export default function ReservationForm({ dogId, dogName }: { dogId: string; dogName: string }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [housingType, setHousingType] = useState('')
  const [hasGarden, setHasGarden] = useState<boolean | null>(null)
  const [hasChildren, setHasChildren] = useState<boolean | null>(null)
  const [otherPets, setOtherPets] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dog_id: dogId,
          dog_name: dogName,
          full_name: fullName,
          email,
          phone: phone || null,
          message: message || null,
          housing_type: housingType || null,
          has_garden: hasGarden,
          has_children: hasChildren,
          other_pets: otherPets || null,
        }),
      })
      const result: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        const message =
          result && typeof result === 'object' && 'error' in result && typeof (result as { error?: unknown }).error === 'string'
            ? (result as { error: string }).error
            : 'Votre demande n’a pas pu être envoyée. Merci de réessayer.'
        toast.error(message)
        return
      }
      setDone(true)
      toast.success('Votre demande a bien été envoyée. Nous vous répondrons rapidement.')
    } catch {
      toast.error('Une erreur est survenue. Merci de réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-8 text-center space-y-3">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/40 text-emerald-300">
          <PawPrint className="h-5 w-5" />
        </span>
        <h2 className="font-serif text-xl text-[#e8e5de]">Demande envoyée</h2>
        <p className="text-sm font-light leading-relaxed text-zinc-300">
          Merci pour votre intérêt pour {dogName}. Nous revenons vers vous très vite pour échanger sur
          votre projet et convenir d’un entretien.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#242523]/70 p-6">
      <div>
        <h2 className="font-serif text-xl text-[#e8e5de]">Demander l’adoption de {dogName}</h2>
        <p className="mt-1 text-xs font-light text-zinc-400">
          Remplissez ce formulaire : nous vous recontactons pour un échange avant toute validation.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nom complet *">
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-xl border border-white/[0.1] bg-[#191a19] px-4 py-2.5 text-sm text-zinc-200 focus:border-[#8f8065] focus:outline-none"
          />
        </Field>
        <Field label="E-mail *">
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-white/[0.1] bg-[#191a19] px-4 py-2.5 text-sm text-zinc-200 focus:border-[#8f8065] focus:outline-none"
          />
        </Field>
        <Field label="Téléphone">
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded-xl border border-white/[0.1] bg-[#191a19] px-4 py-2.5 text-sm text-zinc-200 focus:border-[#8f8065] focus:outline-none"
          />
        </Field>
        <Field label="Type de logement">
          <select
            value={housingType}
            onChange={(event) => setHousingType(event.target.value)}
            className="w-full rounded-xl border border-white/[0.1] bg-[#191a19] px-4 py-2.5 text-sm text-zinc-200 focus:border-[#8f8065] focus:outline-none"
          >
            <option value="">Sélectionner…</option>
            {HOUSING_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <YesNo label="Jardin extérieur" value={hasGarden} onChange={setHasGarden} />
        <YesNo label="Enfants à la maison" value={hasChildren} onChange={setHasChildren} />
      </div>

      <Field label="Autres animaux à la maison">
        <input
          value={otherPets}
          onChange={(event) => setOtherPets(event.target.value)}
          placeholder="Ex. un chat, aucun…"
          className="w-full rounded-xl border border-white/[0.1] bg-[#191a19] px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-[#8f8065] focus:outline-none"
        />
      </Field>

      <Field label="Votre message">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          placeholder="Parlez-nous de votre foyer, de votre expérience et de vos attentes…"
          className="w-full resize-none rounded-xl border border-white/[0.1] bg-[#191a19] px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-[#8f8065] focus:outline-none"
        />
      </Field>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#665d4d] px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-[#eeeae2] transition-colors hover:bg-[#77705f] disabled:opacity-50"
      >
        <PawPrint className="h-4 w-4" />
        {submitting ? 'Envoi en cours…' : 'Envoyer ma demande'}
      </button>
      <p className="text-center text-[11px] font-light text-zinc-500">
        Votre demande n’engage à rien : nous vous recontactons pour un premier échange.
      </p>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{label}</span>
      {children}
    </label>
  )
}

function YesNo({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean | null
  onChange: (value: boolean | null) => void
}) {
  const options: { label: string; next: boolean | null }[] = [
    { label: 'Oui', next: true },
    { label: 'Non', next: false },
  ]
  return (
    <div className="space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{label}</span>
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onChange(value === option.next ? null : option.next)}
            aria-pressed={value === option.next}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
              value === option.next
                ? 'border-[#8f8065]/70 bg-[#66563d]/40 text-[#e5d9bf]'
                : 'border-white/[0.1] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
