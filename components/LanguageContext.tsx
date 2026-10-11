'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type Language = 'FR' | 'EN' | 'ES' | 'DE'

export const DICTIONARY: Record<Language, {
  catalog: string
  hauteHorlogerie: string
  maroquinerie: string
  joaillerie: string
  allProducts: string
  heroBadge: string
  heroTitle: string
  heroSubtitle: string
  exploreCatalog: string
  accountSpace: string
  featuredTitle: string
  featuredTag: string
  featuredSubtitle: string
  viewPiece: string
  exploreAll: string
  cartTitle: string
  emptyCart: string
  continueShopping: string
  subtotal: string
  checkout: string
  freeShipping: string
  searchPlaceholder: string
  sortDefault: string
  sortPriceAsc: string
  sortPriceDesc: string
  sortDateDesc: string
  sortDateAsc: string
  addToCart: string
  addedToCart: string
  bookAppointment: string
  secureDelivery: string
  secureDeliveryDesc: string
  certificate: string
  certificateDesc: string
  concierge: string
  conciergeDesc: string
  announcement: string
}> = {
  FR: {
    catalog: 'Catalogue',
    hauteHorlogerie: 'Haute Horlogerie',
    maroquinerie: 'Maroquinerie',
    joaillerie: 'Joaillerie',
    allProducts: 'Tous',
    heroBadge: 'Maison L&M',
    heroTitle: 'Bienvenue chez',
    heroSubtitle: 'Découvrez les produits et les informations disponibles sur notre site.',
    exploreCatalog: 'Découvrir le Catalogue',
    accountSpace: 'Mon compte',
    featuredTitle: 'Collection à la Une',
    featuredTag: 'Catalogue',
    featuredSubtitle: 'Produits actuellement disponibles.',
    viewPiece: 'Voir la pièce',
    exploreAll: 'Explorer toute la collection',
    cartTitle: 'Votre Panier Privilège',
    emptyCart: 'Votre panier est actuellement vide.',
    continueShopping: 'Explorer nos créations',
    subtotal: 'Sous-total',
    checkout: 'Procéder au Paiement',
    freeShipping: 'Les frais de livraison sont indiqués avant validation de la commande.',
    searchPlaceholder: 'Rechercher une pièce par nom ou description...',
    sortDefault: 'Tri par défaut',
    sortPriceAsc: 'Prix : Croissant',
    sortPriceDesc: 'Prix : Décroissant',
    sortDateDesc: 'Plus récents',
    sortDateAsc: 'Plus anciens',
    addToCart: 'Ajouter au Panier',
    addedToCart: 'Ajouté à votre panier',
    bookAppointment: 'Se connecter',
    secureDelivery: 'Livraison',
    secureDeliveryDesc: 'Les modalités sont indiquées avant le paiement.',
    certificate: 'Informations produit',
    certificateDesc: 'Consultez les informations disponibles sur chaque fiche produit.',
    concierge: 'Service client',
    conciergeDesc: 'Pour toute question, contactez notre équipe.',
    announcement: '',
  },
  EN: {
    catalog: 'Catalog',
    hauteHorlogerie: 'Fine Watchmaking',
    maroquinerie: 'Leather Goods',
    joaillerie: 'High Jewelry',
    allProducts: 'All',
    heroBadge: 'Maison L&M',
    heroTitle: 'Welcome to',
    heroSubtitle: 'Browse the products and information available on our website.',
    exploreCatalog: 'Discover the Catalog',
    accountSpace: 'My account',
    featuredTitle: 'Featured Collection',
    featuredTag: 'Catalog',
    featuredSubtitle: 'Products currently available.',
    viewPiece: 'View Piece',
    exploreAll: 'Explore Full Collection',
    cartTitle: 'Your Privilege Bag',
    emptyCart: 'Your shopping bag is currently empty.',
    continueShopping: 'Explore our creations',
    subtotal: 'Subtotal',
    checkout: 'Proceed to Checkout',
    freeShipping: 'Shipping costs are shown before you place your order.',
    searchPlaceholder: 'Search a piece by title or description...',
    sortDefault: 'Default sorting',
    sortPriceAsc: 'Price: Low to High',
    sortPriceDesc: 'Price: High to Low',
    sortDateDesc: 'Newest first',
    sortDateAsc: 'Oldest first',
    addToCart: 'Add to Bag',
    addedToCart: 'Added to your bag',
    bookAppointment: 'Sign in',
    secureDelivery: 'Delivery',
    secureDeliveryDesc: 'Delivery details are shown before payment.',
    certificate: 'Product information',
    certificateDesc: 'See the information available on each product page.',
    concierge: 'Customer service',
    conciergeDesc: 'Contact our team if you have any questions.',
    announcement: '',
  },
  ES: {
    catalog: 'Catálogo',
    hauteHorlogerie: 'Alta Relojería',
    maroquinerie: 'Marroquinería',
    joaillerie: 'Alta Joyería',
    allProducts: 'Todos',
    heroBadge: 'Maison L&M',
    heroTitle: 'Bienvenido a',
    heroSubtitle: 'Descubra los productos y la información disponibles en nuestro sitio.',
    exploreCatalog: 'Descubrir el Catálogo',
    accountSpace: 'Mi cuenta',
    featuredTitle: 'Colección Destacada',
    featuredTag: 'Catálogo',
    featuredSubtitle: 'Productos actualmente disponibles.',
    viewPiece: 'Ver la pieza',
    exploreAll: 'Explorar toda la colección',
    cartTitle: 'Su Cesta Privilegio',
    emptyCart: 'Su cesta está actualmente vacía.',
    continueShopping: 'Explorar nuestras creaciones',
    subtotal: 'Subtotal',
    checkout: 'Proceder al Pago',
    freeShipping: 'Los gastos de envío se indican antes de confirmar el pedido.',
    searchPlaceholder: 'Buscar una pieza por nombre o descripción...',
    sortDefault: 'Orden por defecto',
    sortPriceAsc: 'Precio: De menor a mayor',
    sortPriceDesc: 'Precio: De mayor a menor',
    sortDateDesc: 'Más recientes',
    sortDateAsc: 'Más antiguos',
    addToCart: 'Añadir a la Cesta',
    addedToCart: 'Añadido a su cesta',
    bookAppointment: 'Iniciar sesión',
    secureDelivery: 'Envío',
    secureDeliveryDesc: 'Las condiciones se indican antes del pago.',
    certificate: 'Información del producto',
    certificateDesc: 'Consulte la información disponible en cada ficha de producto.',
    concierge: 'Atención al cliente',
    conciergeDesc: 'Contacte con nuestro equipo si tiene alguna pregunta.',
    announcement: '',
  },
  DE: {
    catalog: 'Katalog',
    hauteHorlogerie: 'Feine Uhrmacherkunst',
    maroquinerie: 'Lederwaren',
    joaillerie: 'Hohe Schmuckkunst',
    allProducts: 'Alle',
    heroBadge: 'Maison L&M',
    heroTitle: 'Willkommen bei',
    heroSubtitle: 'Entdecken Sie die auf unserer Website verfügbaren Produkte und Informationen.',
    exploreCatalog: 'Katalog Entdecken',
    accountSpace: 'Mein Konto',
    featuredTitle: 'Ausgewählte Kollektion',
    featuredTag: 'Katalog',
    featuredSubtitle: 'Derzeit verfügbare Produkte.',
    viewPiece: 'Stück ansehen',
    exploreAll: 'Gesamte Kollektion erkunden',
    cartTitle: 'Ihr Privileg Warenkorb',
    emptyCart: 'Ihr Warenkorb ist derzeit leer.',
    continueShopping: 'Kreationen erkunden',
    subtotal: 'Zwischensumme',
    checkout: 'Zur Kasse gehen',
    freeShipping: 'Versandkosten werden vor der Bestellung angezeigt.',
    searchPlaceholder: 'Suche nach Namen oder Beschreibung...',
    sortDefault: 'Standardsortierung',
    sortPriceAsc: 'Preis: Aufsteigend',
    sortPriceDesc: 'Preis: Absteigend',
    sortDateDesc: 'Neueste zuerst',
    sortDateAsc: 'Älteste zuerst',
    addToCart: 'In den Warenkorb',
    addedToCart: 'Hinzugefügt',
    bookAppointment: 'Anmelden',
    secureDelivery: 'Versand',
    secureDeliveryDesc: 'Die Bedingungen werden vor der Zahlung angezeigt.',
    certificate: 'Produktinformationen',
    certificateDesc: 'Weitere Angaben finden Sie auf der jeweiligen Produktseite.',
    concierge: 'Kundenservice',
    conciergeDesc: 'Bei Fragen wenden Sie sich bitte an unser Team.',
    announcement: '',
  },
}

interface LanguageContextType {
  language: Language
  setLanguage: (l: Language) => void
  t: typeof DICTIONARY['FR']
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('FR')

  useEffect(() => {
    const saved = localStorage.getItem('lm_language') as Language
    if (saved && ['FR', 'EN', 'ES', 'DE'].includes(saved)) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (l: Language) => {
    setLanguageState(l)
    localStorage.setItem('lm_language', l)
  }

  const t = DICTIONARY[language] || DICTIONARY.FR

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
