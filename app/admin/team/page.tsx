'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Users,
  UserPlus,
  ShieldCheck,
  KeyRound,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Clock,
  X,
} from 'lucide-react'

export type RoleType = 'super_admin' | 'catalogue_manager' | 'fulfillment_agent' | 'support_agent'

export interface TeamMember {
  id: string
  fullName: string
  email: string
  role: RoleType
  status: 'active' | 'invited'
  lastLogin: string
  addedAt: string
}

const ROLE_LABELS: Record<RoleType, { title: string; color: string; desc: string }> = {
  super_admin: {
    title: 'Super Admin',
    color: 'bg-amber-100 text-amber-900 border-amber-300',
    desc: 'Accès total sans restriction (Finances, Paramètres, Suppressions, Rôles).',
  },
  catalogue_manager: {
    title: 'Gestionnaire de Catalogue',
    color: 'bg-purple-100 text-purple-900 border-purple-300',
    desc: 'Modification des produits, catégories, visuels, prix et offres promotionnelles.',
  },
  fulfillment_agent: {
    title: 'Préparateur de Commande',
    color: 'bg-blue-100 text-blue-900 border-blue-300',
    desc: 'Vue restreinte au hub logistique /admin/shipping, étiquettes et bordereaux.',
  },
  support_agent: {
    title: 'Agent Support / SAV',
    color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    desc: 'Module de retours, suivi de livraison, avis et messages clients.',
  },
}

export default function AdminTeamPage() {
  const [team] = useState<TeamMember[]>([])
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<RoleType>('catalogue_manager')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault()
    showToast('L’envoi des invitations n’est pas configuré.')
  }

  const handleRemoveMember = (id: string, name: string) => {
    void id
    void name
    showToast('La gestion des membres n’est pas connectée à une source persistante.')
  }

  const handleChangeRole = (id: string, newRole: RoleType) => {
    void id
    void newRole
    showToast('La gestion des rôles d’équipe n’est pas configurée.')
  }

  return (
    <div className="bg-[#FAF8F5] min-h-screen text-zinc-900 p-6 lg:p-12 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0D0D0D] text-[#C5A059] px-6 py-4 rounded-xl shadow-2xl border border-[#C5A059] flex items-center gap-3 text-xs font-mono animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
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
            <Users className="w-7 h-7 text-[#C5A059]" />
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-zinc-950">
              Gestion de l&apos;Équipe &amp; Permissions Back-Office
            </h1>
          </div>
          <p className="text-xs text-zinc-600 font-light">
            Invitez vos collaborateurs, attribuez les privilèges sur mesure et suivez les accès administrateurs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/roles"
            className="px-4 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-800 hover:bg-zinc-50 flex items-center gap-2 transition-all shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
            Matrice des Rôles
          </Link>

          <button
            onClick={() => setInviteModalOpen(true)}
            className="px-5 py-2.5 bg-[#0D0D0D] text-[#C5A059] hover:bg-[#C5A059] hover:text-[#0D0D0D] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Inviter un Collaborateur
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Total Membres</span>
          <div className="text-2xl font-serif font-bold text-zinc-950">{team.length}</div>
        </div>
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Super Admin</span>
          <div className="text-2xl font-serif font-bold text-[#C5A059]">
            {team.filter((m) => m.role === 'super_admin').length}
          </div>
        </div>
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Actifs</span>
          <div className="text-2xl font-serif font-bold text-emerald-700">
            {team.filter((m) => m.status === 'active').length}
          </div>
        </div>
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Invitations en cours</span>
          <div className="text-2xl font-serif font-bold text-amber-700">
            {team.filter((m) => m.status === 'invited').length}
          </div>
        </div>
      </div>

      {/* Team Members DataGrid */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
          <h2 className="font-serif font-bold text-lg text-zinc-950 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#C5A059]" />
            Membres de l&apos;Équipe &amp; Rôles Assignés
          </h2>

          <Link href="/admin/audit-logs" className="text-xs font-bold text-[#C5A059] hover:underline flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Consulter le Journal d&apos;Audit &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto border border-zinc-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-zinc-200 text-zinc-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Membre / E-mail</th>
                <th className="py-3.5 px-4">Rôle &amp; Niveaux de Droits</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4">Dernière Inactivité</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-light">
              {team.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-zinc-500">Aucun membre d’équipe configuré.</td>
                </tr>
              ) : team.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="py-4 px-4 space-y-0.5">
                    <span className="font-serif font-bold text-sm text-zinc-950 block">{m.fullName}</span>
                    <span className="font-mono text-zinc-500 block text-[11px]">{m.email}</span>
                  </td>

                  <td className="py-4 px-4">
                    <select
                      value={m.role}
                      onChange={(e) => handleChangeRole(m.id, e.target.value as RoleType)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none cursor-pointer ${ROLE_LABELS[m.role].color}`}
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="catalogue_manager">Gestionnaire de Catalogue</option>
                      <option value="fulfillment_agent">Préparateur de Commande</option>
                      <option value="support_agent">Agent Support / SAV</option>
                    </select>
                  </td>

                  <td className="py-4 px-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        m.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {m.status === 'active' ? 'Actif' : 'Invitation Envoyée'}
                    </span>
                  </td>

                  <td className="py-4 px-4 font-mono text-[11px] text-zinc-500">
                    {m.lastLogin}
                  </td>

                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => handleRemoveMember(m.id, m.fullName)}
                      className="p-2 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Révoquer l'accès"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invitation Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSendInvite}
            className="bg-white max-w-lg w-full rounded-3xl p-8 shadow-2xl space-y-6 animate-fadeIn"
          >
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-serif font-bold text-lg text-zinc-950">
                  Inviter un Collaborateur L&amp;M
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                  Nom Complet du Collaborateur
                </label>
                <input
                  type="text"
                  placeholder="ex: Alexandre de Saint-Germain"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-zinc-200 rounded-xl font-medium text-zinc-900 focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                  Adresse E-mail Professionnelle *
                </label>
                <input
                  type="email"
                  placeholder="nom@domaine.fr"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-zinc-200 rounded-xl font-medium text-zinc-900 focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="font-bold uppercase tracking-wider text-zinc-700 block mb-1">
                  Rôle &amp; Profil d&apos;Accès
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as RoleType)}
                  className="w-full px-4 py-3 bg-[#FAF8F5] border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-[#C5A059] cursor-pointer"
                >
                  <option value="super_admin">Super Admin (Accès Total)</option>
                  <option value="catalogue_manager">Gestionnaire de Catalogue (Produits &amp; Prix)</option>
                  <option value="fulfillment_agent">Préparateur de Commande (Bordereaux /admin/shipping)</option>
                  <option value="support_agent">Agent Support / SAV (Retours &amp; Suivi)</option>
                </select>
                <p className="mt-2 text-[11px] text-zinc-500 font-light">
                  {ROLE_LABELS[inviteRole].desc}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex gap-3">
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="w-1/2 py-3 border border-zinc-300 text-zinc-700 font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-zinc-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="w-1/2 py-3 bg-[#0D0D0D] text-[#C5A059] font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-[#C5A059] hover:text-[#0D0D0D] transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Envoyer l&apos;Invitation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
