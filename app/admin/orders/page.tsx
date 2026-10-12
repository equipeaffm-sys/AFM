'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckSquare2, PackageCheck, RefreshCw, Search, Square } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useCurrency } from '@/components/CurrencyContext'

type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
type StatusFilter = 'all' | OrderStatus

interface CustomerProfile {
  id: string
  email: string
  full_name: string | null
}

interface AdminOrder {
  id: string
  user_id: string
  status: OrderStatus
  total_cents: number
  created_at: string
  shipping_address: {
    fullName?: string
    city?: string
    country?: string
  } | null
  customer: CustomerProfile | null
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente',
  paid: 'Payée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'paid', label: 'Payées' },
  { value: 'shipped', label: 'Expédiées' },
  { value: 'delivered', label: 'Livrées' },
  { value: 'cancelled', label: 'Annulées' },
]

export default function AdminOrdersPage() {
  const { formatPrice } = useCurrency()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState<'shipped' | 'delivered'>('shipped')
  const [updating, setUpdating] = useState(false)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    try {
      const supabase = createClient()
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, user_id, status, total_cents, created_at, shipping_address')
        .order('created_at', { ascending: false })
        .limit(500)
      if (orderError) throw orderError

      const rows = orderData || []
      const userIds = Array.from(new Set(rows.map((order) => order.user_id)))
      const profileResult = userIds.length
        ? await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', userIds)
        : { data: [], error: null }
      if (profileResult.error) throw profileResult.error

      const profiles = new Map(
        (profileResult.data || []).map((profile) => [profile.id, profile as CustomerProfile])
      )
      setOrders(
        rows.map((order) => ({
          ...order,
          status: order.status as OrderStatus,
          shipping_address: order.shipping_address || null,
          customer: profiles.get(order.user_id) || null,
        }))
      )
      setSelectedIds([])
    } catch (error: unknown) {
      console.error('Unable to load admin orders:', error)
      setLoadError('Impossible de charger les commandes. Vérifiez les droits administrateur et réessayez.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  const filteredOrders = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase()
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      const customer = order.customer
      const matchesSearch =
        !normalizedQuery ||
        order.id.toLocaleLowerCase().includes(normalizedQuery) ||
        customer?.email.toLocaleLowerCase().includes(normalizedQuery) ||
        customer?.full_name?.toLocaleLowerCase().includes(normalizedQuery) ||
        order.shipping_address?.fullName?.toLocaleLowerCase().includes(normalizedQuery)
      return matchesStatus && matchesSearch
    })
  }, [orders, searchQuery, statusFilter])

  const targetSourceStatus: OrderStatus = bulkStatus === 'shipped' ? 'paid' : 'shipped'
  const eligibleVisibleIds = filteredOrders
    .filter((order) => order.status === targetSourceStatus)
    .map((order) => order.id)
  const eligibleSelectedIds = selectedIds.filter((id) => {
    const order = orders.find((item) => item.id === id)
    return order?.status === targetSourceStatus
  })
  const allEligibleVisibleSelected =
    eligibleVisibleIds.length > 0 &&
    eligibleVisibleIds.every((id) => selectedIds.includes(id))

  const toggleOrderSelection = (orderId: string) => {
    setSelectedIds((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId]
    )
  }

  const toggleVisibleSelection = () => {
    setSelectedIds((current) =>
      allEligibleVisibleSelected
        ? current.filter((id) => !eligibleVisibleIds.includes(id))
        : Array.from(new Set([...current, ...eligibleVisibleIds]))
    )
  }

  const updateSelectedOrders = async () => {
    if (eligibleSelectedIds.length === 0 || updating) return
    setUpdating(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('orders')
        .update({ status: bulkStatus, updated_at: new Date().toISOString() })
        .in('id', eligibleSelectedIds)
        .eq('status', targetSourceStatus)
        .select('id')

      if (error) throw error
      const updatedIds = new Set((data || []).map((order) => order.id))
      if (updatedIds.size === 0) {
        throw new Error('Aucune commande sélectionnée n’a pu être mise à jour.')
      }

      setOrders((current) =>
        current.map((order) =>
          updatedIds.has(order.id) ? { ...order, status: bulkStatus } : order
        )
      )
      setSelectedIds((current) => current.filter((id) => !updatedIds.has(id)))
      toast.success(`${updatedIds.size} commande(s) mise(s) à jour.`)
      if (updatedIds.size < eligibleSelectedIds.length) {
        toast.error('Certaines commandes avaient déjà changé de statut et n’ont pas été modifiées.')
      }
    } catch (error: unknown) {
      console.error('Unable to bulk update order statuses:', error)
      toast.error('Impossible de mettre à jour les commandes sélectionnées.')
    } finally {
      setUpdating(false)
    }
  }

  const statusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-800'
      case 'shipped':
        return 'bg-sky-50 text-sky-800'
      case 'delivered':
        return 'bg-teal-50 text-teal-800'
      case 'cancelled':
        return 'bg-zinc-100 text-zinc-600'
      default:
        return 'bg-amber-50 text-amber-800'
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b7048]">
            Gestion de la boutique
          </p>
          <h1 className="mt-1 font-serif text-3xl text-zinc-950">Commandes</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Recherche client et suivi des commandes enregistrées dans Supabase.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadOrders()}
          disabled={loading}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:border-[#C5A059] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Actualiser
        </button>
      </header>

      <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
            <span className="sr-only">Rechercher une commande ou un client</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="N° commande, nom ou e-mail client"
              className="min-h-11 w-full rounded-xl border border-zinc-200 bg-[#faf9f6] pl-10 pr-3 text-sm text-zinc-900 outline-none transition focus:border-[#9a8056]"
            />
          </label>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={statusFilter === filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`min-h-9 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  statusFilter === filter.value
                    ? 'border-[#66563d] bg-[#66563d] text-white'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-[#9a8056]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border border-[#d9ceba] bg-[#faf8f4] p-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-zinc-700">
              {eligibleSelectedIds.length} commande(s) sélectionnée(s) éligible(s)
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="bulk-order-status" className="sr-only">
                Nouveau statut groupé
              </label>
              <select
                id="bulk-order-status"
                value={bulkStatus}
                onChange={(event) => {
                  setBulkStatus(event.target.value as 'shipped' | 'delivered')
                  setSelectedIds([])
                }}
                className="min-h-10 rounded-lg border border-zinc-300 bg-white px-3 text-xs text-zinc-800"
              >
                <option value="shipped">Marquer expédiées (payées uniquement)</option>
                <option value="delivered">Marquer livrées (expédiées uniquement)</option>
              </select>
              <button
                type="button"
                onClick={() => void updateSelectedOrders()}
                disabled={eligibleSelectedIds.length === 0 || updating}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#66563d] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#51432f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PackageCheck className="h-4 w-4" aria-hidden="true" />
                {updating ? 'Mise à jour…' : 'Appliquer'}
              </button>
            </div>
          </div>
        )}

        {loadError ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            <p>{loadError}</p>
            <button
              type="button"
              onClick={() => void loadOrders()}
              className="mt-3 font-semibold underline underline-offset-2"
            >
              Réessayer
            </button>
          </div>
        ) : loading ? (
          <p role="status" className="py-12 text-center text-sm text-zinc-500">
            Chargement des commandes…
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-zinc-200 text-[10px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="w-12 px-3 py-3">
                    <button
                      type="button"
                      onClick={toggleVisibleSelection}
                      disabled={eligibleVisibleIds.length === 0}
                      aria-label={
                        allEligibleVisibleSelected
                          ? 'Désélectionner les commandes visibles éligibles'
                          : 'Sélectionner les commandes visibles éligibles'
                      }
                      className="rounded p-1 text-zinc-500 hover:text-zinc-900 disabled:opacity-30"
                    >
                      {allEligibleVisibleSelected ? (
                        <CheckSquare2 className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Square className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-3">Commande</th>
                  <th className="px-3 py-3">Client</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredOrders.map((order) => {
                  const eligible = order.status === targetSourceStatus
                  const selected = selectedIds.includes(order.id)
                  return (
                    <tr key={order.id} className={selected ? 'bg-amber-50/60' : 'hover:bg-zinc-50'}>
                      <td className="px-3 py-4">
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={!eligible}
                          onChange={() => toggleOrderSelection(order.id)}
                          aria-label={`Sélectionner la commande ${order.id}`}
                          className="h-4 w-4 accent-[#66563d] disabled:cursor-not-allowed disabled:opacity-30"
                        />
                      </td>
                      <td className="px-3 py-4">
                        <span className="font-mono text-xs font-semibold text-zinc-900">
                          #{order.id.slice(0, 8)}
                        </span>
                        {order.shipping_address?.city && (
                          <span className="mt-1 block text-[11px] text-zinc-500">
                            {order.shipping_address.city}
                            {order.shipping_address.country ? `, ${order.shipping_address.country}` : ''}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <span className="block font-medium text-zinc-800">
                          {order.customer?.full_name ||
                            order.shipping_address?.fullName ||
                            'Client'}
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500">
                          {order.customer?.email || 'E-mail indisponible'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-xs text-zinc-600">
                        {new Date(order.created_at).toLocaleString('fr-FR', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-3 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyle(order.status)}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-right font-serif font-semibold text-zinc-900">
                        {formatPrice(order.total_cents)}
                      </td>
                    </tr>
                  )
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-12 text-center text-sm text-zinc-500">
                      {orders.length === 0
                        ? 'Aucune commande enregistrée pour le moment.'
                        : 'Aucune commande ne correspond à cette recherche.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {orders.length >= 500 && (
              <p className="border-t border-zinc-100 px-3 py-3 text-center text-xs text-zinc-500">
                Affichage limité aux 500 commandes les plus récentes.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
