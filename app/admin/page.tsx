'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import AdminSessionGuard from '@/components/AdminSessionGuard'
import {
  Package,
  ShoppingBag,
  Plus,
  Trash2,
  Edit,
  X,
  Check,
  Clock,
  ShieldCheck,
  FileText,
  UserCheck,
  Users,
} from 'lucide-react'

type UserRole = 'customer' | 'support' | 'editor' | 'super_admin'

interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
}

interface AuditLog {
  id: string
  actor_email: string
  action: string
  target_resource: string
  details: Record<string, unknown>
  created_at: string
}

interface Product {
  id: string
  title: string
  description: string
  price_cents: number
  category: string
  stock: number
  images: string[]
}

interface OrderItem {
  id: string
  title: string
  unit_price_cents: number
  quantity: number
}

interface Order {
  id: string
  user_id: string
  status: string
  total_cents: number
  shipping_address: {
    fullName?: string
    street?: string
    city?: string
    country?: string
  } | null
  items: OrderItem[]
  created_at: string
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [allUsers, setAllUsers] = useState<Profile[]>([])
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'users' | 'audit'>('products')

  // Products CRUD State
  const [products, setProducts] = useState<Product[]>([])
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)

  // Form Inputs
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priceCents, setPriceCents] = useState<number>(0)
  const [category, setCategory] = useState('')
  const [stock, setStock] = useState<number>(0)
  const [imageUrl, setImageUrl] = useState('')

  // Orders State & Full Control Modals
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const router = useRouter()

  const recordAuditLog = useCallback(async (action: string, targetResource: string, details: Record<string, unknown>) => {
    const supabase = createClient()
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    const newLog: AuditLog = {
      id: crypto.randomUUID(),
      actor_email: currentUser?.email || '',
      action,
      target_resource: targetResource,
      details,
      created_at: new Date().toISOString(),
    }

    try {
      const { error } = await supabase.from('audit_logs').insert([
        {
          actor_id: currentUser?.id,
          actor_email: newLog.actor_email,
          action,
          target_resource: targetResource,
          details,
        },
      ])
      if (error) return
    } catch {
      return
    }

    setAuditLogs((prev) => [newLog, ...prev])
  }, [])

  const loadAdminData = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (currentUser) {
      // Fetch user profile for RBAC
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (profile) {
        setUserProfile(profile)
      }

      // Fetch all user profiles for Users Cockpit
      const { data: profiles } = await supabase.from('profiles').select('*')
      setAllUsers(profiles || [])

      // Fetch products
      const { data: dbProducts } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      setProducts(dbProducts || [])

      // Fetch all orders
      const { data: dbOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      setOrders((dbOrders || []).map((order) => ({
        ...order,
        shipping_address: order.shipping_address || null,
        items: Array.isArray(order.items) ? order.items : [],
      })))

      // Fetch Audit Logs
      const { data: dbLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      setAuditLogs(dbLogs || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAdminData()
  }, [loadAdminData])

  const openCreateModal = () => {
    setEditingProductId(null)
    setTitle('')
    setDescription('')
    setPriceCents(0)
    setCategory('')
    setStock(0)
    setImageUrl('')
    setIsProductModalOpen(true)
  }

  const openEditModal = (p: Product) => {
    setEditingProductId(p.id)
    setTitle(p.title)
    setDescription(p.description || '')
    setPriceCents(p.price_cents)
    setCategory(p.category)
    setStock(p.stock)
    setImageUrl(p.images[0] || '')
    setIsProductModalOpen(true)
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionMessage(null)

    if (userProfile && userProfile.role === 'support') {
      alert('Erreur RBAC : Le rôle Support ne possède pas la permission d\'édition du catalogue.')
      return
    }

    const newProductData = {
      title,
      description,
      price_cents: priceCents,
      category,
      stock,
      images: imageUrl ? [imageUrl] : [],
    }

    try {
      const supabase = createClient()

      if (editingProductId) {
        const { error } = await supabase
          .from('products')
          .update(newProductData)
          .eq('id', editingProductId)
        if (error) throw error

        setProducts((prev) =>
          prev.map((p) => (p.id === editingProductId ? { ...p, ...newProductData } : p))
        )
        setActionMessage('Produit mis à jour avec succès.')
        await recordAuditLog('PRODUCT_UPDATE', 'products', { productId: editingProductId, title })
      } else {
        const { data: created, error } = await supabase
          .from('products')
          .insert([newProductData])
          .select()
          .single()
        if (error || !created) throw error || new Error('Product not created')

        const newId = created.id
        setProducts((prev) => [created, ...prev])
        setActionMessage('Nouveau produit ajouté au catalogue.')
        await recordAuditLog('PRODUCT_CREATE', 'products', { productId: newId, title })
      }
    } catch {
      setActionMessage('Impossible d’enregistrer le produit.')
    } finally {
      setIsProductModalOpen(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (userProfile && userProfile.role === 'support') {
      alert('Erreur RBAC : Le rôle Support ne possède pas la permission de suppression.')
      return
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      await recordAuditLog('PRODUCT_DELETE', 'products', { productId: id })
    } catch {
      setActionMessage('Impossible de supprimer le produit.')
      return
    }
    setProducts((prev) => prev.filter((p) => p.id !== id))
    setActionMessage('Produit supprimé du catalogue.')
  }

  // --- ORDER FULL CONTROL ACTIONS ---
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
      if (error) throw error
      await recordAuditLog('ORDER_STATUS_UPDATE', 'orders', { orderId, newStatus })
    } catch {
      setActionMessage('Impossible de mettre à jour le statut de la commande.')
      return
    }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
    setSelectedOrder((prev) => prev?.id === orderId ? { ...prev, status: newStatus } : prev)
    setActionMessage(`Statut de la commande #${orderId.substring(0, 8)} mis à jour.`)
  }

  const handleUpdateOrderAddress = async (orderId: string, street: string) => {
    const order = orders.find((item) => item.id === orderId)
    if (!order) return
    const shippingAddress = { ...order.shipping_address, street }
    const { error } = await createClient().from('orders').update({ shipping_address: shippingAddress }).eq('id', orderId)
    if (error) {
      setActionMessage('Impossible de mettre à jour l’adresse de livraison.')
      return
    }
    setOrders((prev) => prev.map((item) => item.id === orderId ? { ...item, shipping_address: shippingAddress } : item))
    setSelectedOrder((prev) => prev?.id === orderId ? { ...prev, shipping_address: shippingAddress } : prev)
    await recordAuditLog('ORDER_ADDRESS_UPDATE', 'orders', { orderId, street })
    setActionMessage(`Adresse de livraison mise à jour pour #${orderId.substring(0, 8)}.`)
  }

  const handleUserRoleChange = async (userId: string, newRole: UserRole) => {
    if (userProfile?.role !== 'super_admin') {
      alert('Seul un compte Super Admin peut modifier les rôles.')
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
      if (error) throw error
    } catch {
      setActionMessage('Impossible de mettre à jour le rôle utilisateur.')
      return
    }

    setAllUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
    await recordAuditLog('USER_ROLE_CHANGE', 'profiles', { userId, newRole })
    setActionMessage(`Rôle utilisateur mis à jour vers ${newRole}.`)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#FAFAFA] text-zinc-500 font-serif">
        Chargement de l&apos;Espace Administrateur L&amp;M...
      </div>
    )
  }

  const userRole = userProfile?.role || 'customer'

  return (
    <AdminSessionGuard timeoutMinutes={15}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-zinc-900 space-y-8 bg-[#FAFAFA]">
      {/* Admin Header & RBAC Badge */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 rounded-full text-xs font-semibold uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              Espace Panneau de Contrôle
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 rounded-full text-xs font-mono uppercase font-bold">
              <UserCheck className="w-3.5 h-3.5" />
              Rôle RBAC: {userRole}
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-zinc-950 mt-3">Tableau de Bord L&amp;M</h1>
          <p className="text-zinc-600 text-sm font-light mt-1">
            Gestion sécurisée du catalogue, des commandes Stripe, rôles utilisateurs et registre d&apos;audit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-4 py-2.5 border border-zinc-300 hover:border-[#C5A059] text-zinc-800 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors"
          >
            Site Vitrine
          </Link>
          <button
            onClick={handleSignOut}
            className="px-4 py-2.5 border border-zinc-300 hover:border-red-500 text-zinc-800 hover:text-red-600 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 border text-xs rounded-xl flex items-center gap-2 ${
          actionMessage.startsWith('Impossible')
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <Check className={`w-4 h-4 ${actionMessage.startsWith('Impossible') ? 'text-red-600' : 'text-emerald-600'}`} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200 space-x-6 text-sm">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 font-semibold uppercase tracking-wider text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'products'
              ? 'border-[#C5A059] text-[#C5A059]'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Package className="w-4 h-4" />
          Catalogue ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 font-semibold uppercase tracking-wider text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'border-[#C5A059] text-[#C5A059]'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Commandes ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 font-semibold uppercase tracking-wider text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-[#C5A059] text-[#C5A059]'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Utilisateurs ({allUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 font-semibold uppercase tracking-wider text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'border-[#C5A059] text-[#C5A059]'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Products Management */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-serif text-zinc-950 font-bold">Produits du Catalogue</h2>
            {userRole !== 'support' && (
              <button
                onClick={openCreateModal}
                className="px-4 py-2.5 bg-[#0D0D0D] text-[#C5A059] hover:bg-[#C5A059] hover:text-[#0D0D0D] font-semibold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Ajouter une Pièce
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.length === 0 ? (
              <p className="col-span-full rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
                Aucun produit enregistré.
              </p>
            ) : products.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-zinc-200/90 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-56 w-full bg-zinc-100">
                    {product.images[0] && (
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-[#C5A059] border border-zinc-200 text-[10px] uppercase font-semibold rounded-full">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-serif text-lg font-bold text-zinc-950">{product.title}</h3>
                    <p className="text-zinc-600 text-xs line-clamp-2 font-light">{product.description}</p>
                    <div className="pt-2 flex justify-between items-center">
                      <span className="text-[#C5A059] font-serif font-bold text-base">
                        {(product.price_cents / 100).toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </span>
                      <span className="text-zinc-500 text-xs font-mono">Stock: {product.stock}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-zinc-100 bg-[#FAFAFA] flex items-center justify-end gap-2">
                  {userRole !== 'support' ? (
                    <>
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-2 border border-zinc-200 hover:border-[#C5A059] text-zinc-600 hover:text-[#C5A059] rounded-lg transition-colors text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Éditer
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 border border-zinc-200 hover:border-red-500 text-zinc-600 hover:text-red-600 rounded-lg transition-colors text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Supprimer
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-zinc-400 font-mono italic">
                      Mode Support (Lecture seule)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Orders Full Control */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-xl font-serif text-zinc-950 font-bold">Gestion Intégrale des Commandes</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700">
              <thead className="bg-[#FAFAFA] text-zinc-500 uppercase text-[10px] tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="p-4">N° Commande</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Montant Total</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions de Gestion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-light">
                {orders.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-zinc-500">Aucune commande enregistrée.</td></tr>
                ) : orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-4 font-mono font-semibold text-[#C5A059]">
                      #{order.id.substring(0, 8)}
                    </td>
                    <td className="p-4 font-mono text-zinc-600">{order.user_id.substring(0, 12)}...</td>
                    <td className="p-4 text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="p-4 font-serif font-bold text-zinc-950">
                      {(order.total_cents / 100).toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          order.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : order.status === 'shipped'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="bg-white border border-zinc-200 rounded-lg text-xs py-1 px-2 text-zinc-800 focus:outline-none focus:border-[#C5A059] cursor-pointer"
                      >
                        <option value="pending">pending</option>
                        <option value="paid">paid</option>
                        <option value="shipped">shipped</option>
                        <option value="delivered">delivered</option>
                        <option value="cancelled">cancelled</option>
                      </select>

                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setIsOrderModalOpen(true)
                        }}
                        className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      >
                        Détails / Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Users & Roles Cockpit */}
      {activeTab === 'users' && (
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-serif text-zinc-950 font-bold">Gestion des Utilisateurs &amp; Rôles RBAC</h2>
            <span className="text-[10px] uppercase font-mono px-2.5 py-1 bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 rounded-full font-bold">
              Contrôle Super-Admin
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700">
              <thead className="bg-[#FAFAFA] text-zinc-500 uppercase text-[10px] tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="p-4">Utilisateur</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Rôle Actuel</th>
                  <th className="p-4 text-right">Attribuer Rôle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-light">
                {allUsers.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-zinc-500">Aucun utilisateur disponible.</td></tr>
                ) : allUsers.map((usr) => (
                  <tr key={usr.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-4 font-semibold text-zinc-900">{usr.full_name || 'Client L&M'}</td>
                    <td className="p-4 font-mono text-zinc-600">{usr.email}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-zinc-100 border border-zinc-200 text-zinc-800 rounded-full text-[10px] font-bold uppercase font-mono">
                        {usr.role}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <select
                        value={usr.role}
                        onChange={(e) => handleUserRoleChange(usr.id, e.target.value as UserRole)}
                        className="bg-white border border-zinc-200 rounded-lg text-xs py-1 px-2 text-zinc-800 focus:outline-none focus:border-[#C5A059] cursor-pointer"
                      >
                        <option value="customer">customer</option>
                        <option value="support">support</option>
                        <option value="editor">editor</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Security Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif text-zinc-950 font-bold">Registre d&apos;Audit de Sécurité (`audit_logs`)</h2>
            <span className="text-[10px] uppercase font-mono px-2.5 py-1 bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 rounded-full">
              Inaltérable
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700">
              <thead className="bg-[#FAFAFA] text-zinc-500 uppercase text-[10px] tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="p-4">Horodatage</th>
                  <th className="p-4">Auteur</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Cible</th>
                  <th className="p-4">Détails JSON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-mono text-[11px]">
                {auditLogs.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-zinc-500">Aucune entrée d’audit disponible.</td></tr>
                ) : auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-4 text-zinc-500">
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </td>
                    <td className="p-4 text-[#C5A059] font-semibold">{log.actor_email}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-zinc-100 text-zinc-800 rounded text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-600">{log.target_resource}</td>
                    <td className="p-4 text-zinc-500 max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details & Edit Address / Refund Modal */}
      {isOrderModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-4">
              <h3 className="font-serif text-lg font-bold text-zinc-950">
                Commande #{selectedOrder.id.substring(0, 8)}
              </h3>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-zinc-500 block uppercase font-mono text-[10px] mb-1">
                  Articles de la commande
                </span>
                <div className="space-y-2 bg-[#FAFAFA] p-3 rounded-xl border border-zinc-200">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center font-medium">
                      <span>{item.title} (x{item.quantity})</span>
                      <span className="font-serif font-bold text-[#C5A059]">
                        {((item.unit_price_cents * item.quantity) / 100).toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-zinc-500 block uppercase font-mono text-[10px] mb-1">
                  Adresse de livraison (Éditable)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedOrder.shipping_address?.street || ''}
                    onChange={(e) => handleUpdateOrderAddress(selectedOrder.id, e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-5 py-2 bg-[#0D0D0D] text-white text-xs font-bold uppercase rounded-lg hover:bg-[#C5A059] transition-all cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-4">
              <h3 className="font-serif text-lg font-bold text-zinc-950">
                {editingProductId ? 'Éditer la Pièce' : 'Ajouter une Pièce d\'Exception'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase text-zinc-500 mb-1">Titre de la pièce</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-[#C5A059]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase text-zinc-500 mb-1">Catégorie</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-[#C5A059]"
                    required
                  />
                </div>

                <div>
                  <label className="block uppercase text-zinc-500 mb-1">Prix (en centimes EUR)</label>
                  <input
                    type="number"
                    value={priceCents}
                    onChange={(e) => setPriceCents(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-[#C5A059]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase text-zinc-500 mb-1">Quantité en Stock</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-[#C5A059]"
                  required
                />
              </div>

              <div>
                <label className="block uppercase text-zinc-500 mb-1">URL de l&apos;Image</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-2.5 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-[#C5A059]"
                  required
                />
              </div>

              <div>
                <label className="block uppercase text-zinc-500 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-[#C5A059]"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0D0D0D] text-[#C5A059] font-bold uppercase rounded-lg hover:bg-[#C5A059] hover:text-[#0D0D0D] transition-all cursor-pointer"
                >
                  {editingProductId ? 'Enregistrer' : 'Créer la pièce'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </AdminSessionGuard>
  )
}
