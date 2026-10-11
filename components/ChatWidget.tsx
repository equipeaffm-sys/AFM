'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot, LoaderCircle, MessageCircle, Send, X } from 'lucide-react'
import { Language, useLanguage } from './LanguageContext'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  actions?: ChatAction[]
}

type ChatAction = {
  label: string
  href: string
}

type LocalReply = {
  content: string
  actions?: ChatAction[]
}

const chatCopy: Record<Language, {
  title: string
  subtitle: string
  welcome: string
  topics: Array<{ label: string; question: string }>
  placeholder: string
  privacy: string
  replies: Record<'greeting' | 'delivery' | 'returns' | 'orders' | 'account' | 'products' | 'productSearch' | 'contact' | 'fallback' | 'unavailable', string>
  actions: Record<'catalog' | 'account' | 'tracking' | 'terms' | 'legal' | 'searchResults', string>
}> = {
  FR: {
    title: 'Conseiller boutique',
    subtitle: 'Nous sommes là pour vous aider',
    welcome: 'Bonjour ! Comment puis-je vous aider ?',
    topics: [
      { label: 'Trouver un article', question: 'Comment trouver un article ?' },
      { label: 'Livraison', question: 'Quelles sont les conditions de livraison ?' },
      { label: 'Suivi de commande', question: 'Comment suivre ma commande ?' },
    ],
    placeholder: 'Écrivez votre question…',
    privacy: 'Ne partagez pas d’informations personnelles ou de paiement.',
    replies: {
      greeting: 'Bonjour ! Que recherchez-vous ?',
      delivery: 'Les commandes ne sont pas encore ouvertes. Les informations de livraison seront disponibles prochainement.',
      returns: 'Les conditions de retour seront publiées avant l’ouverture des commandes.',
      orders: 'La prise de commande et le paiement sont temporairement désactivés. Si vous avez déjà une commande associée à votre compte, vous pouvez consulter son suivi après connexion.',
      account: 'Depuis votre espace membre, vous pouvez vous connecter et consulter les informations associées à votre compte. Ne partagez jamais votre mot de passe ici.',
      products: 'Consultez le catalogue et les fiches produit pour découvrir les articles, leurs prix et leur disponibilité.',
      productSearch: 'Voici les articles qui correspondent à votre recherche.',
      contact: 'Les coordonnées de la boutique sont indiquées dans les mentions légales.',
      fallback: 'Je peux vous renseigner sur les articles, votre compte, les commandes, la livraison et les retours.',
      unavailable: 'Je n’ai pas trouvé de réponse à cette demande. Essayez une question sur un article, une commande ou votre compte.',
    },
    actions: { catalog: 'Voir le catalogue', account: 'Mon compte', tracking: 'Suivi de commande', terms: 'Consulter les CGV', legal: 'Mentions légales', searchResults: 'Voir les articles correspondants' },
  },
  EN: {
    title: 'Store assistant',
    subtitle: 'Here to help',
    welcome: 'Hello! How can I help you?',
    topics: [
      { label: 'Find an item', question: 'How can I find an item?' },
      { label: 'Shipping', question: 'What are the shipping conditions?' },
      { label: 'Track an order', question: 'How can I track my order?' },
    ],
    placeholder: 'Type your question…',
    privacy: 'Do not share personal or payment information.',
    replies: {
      greeting: 'Hello! What are you looking for?',
      delivery: 'Orders are not open yet. Shipping information will be available soon.',
      returns: 'Return terms will be published before orders open.',
      orders: 'Ordering and payment are temporarily disabled. If you already have an order linked to your account, you can check its status after signing in.',
      account: 'Sign in to your account to view information linked to it. Never share your password here.',
      products: 'Browse the catalogue and product pages to see items, prices, and availability.',
      productSearch: 'Here are the items matching your search.',
      contact: 'Store contact details are available in the legal information.',
      fallback: 'I can help with products, your account, orders, shipping, and returns.',
      unavailable: 'I could not find an answer to that. Try asking about a product, order, or your account.',
    },
    actions: { catalog: 'Browse catalogue', account: 'My account', tracking: 'Track an order', terms: 'Sales terms', legal: 'Legal information', searchResults: 'View matching items' },
  },
  ES: {
    title: 'Asistente de la tienda',
    subtitle: 'Estamos aquí para ayudarte',
    welcome: '¡Hola! ¿Cómo puedo ayudarte?',
    topics: [
      { label: 'Buscar un artículo', question: '¿Cómo puedo encontrar un artículo?' },
      { label: 'Envío', question: '¿Cuáles son las condiciones de envío?' },
      { label: 'Seguimiento', question: '¿Cómo puedo seguir mi pedido?' },
    ],
    placeholder: 'Escribe tu pregunta…',
    privacy: 'No compartas datos personales ni de pago.',
    replies: {
      greeting: '¡Hola! ¿Qué estás buscando?',
      delivery: 'Los pedidos aún no están abiertos. La información de envío estará disponible próximamente.',
      returns: 'Las condiciones de devolución se publicarán antes de abrir los pedidos.',
      orders: 'Los pedidos y pagos están temporalmente desactivados. Si ya tienes un pedido asociado a tu cuenta, puedes consultar su estado al iniciar sesión.',
      account: 'Inicia sesión en tu cuenta para consultar la información asociada. Nunca compartas aquí tu contraseña.',
      products: 'Explora el catálogo y las fichas de producto para ver artículos, precios y disponibilidad.',
      productSearch: 'Aquí tienes los artículos que coinciden con tu búsqueda.',
      contact: 'Encontrarás los datos de contacto de la tienda en la información legal.',
      fallback: 'Puedo ayudarte con artículos, tu cuenta, pedidos, envíos y devoluciones.',
      unavailable: 'No he encontrado una respuesta. Prueba a preguntar sobre un artículo, un pedido o tu cuenta.',
    },
    actions: { catalog: 'Ver catálogo', account: 'Mi cuenta', tracking: 'Seguimiento del pedido', terms: 'Condiciones de venta', legal: 'Aviso legal', searchResults: 'Ver artículos coincidentes' },
  },
  DE: {
    title: 'Shop-Beratung',
    subtitle: 'Wir helfen dir gerne',
    welcome: 'Hallo! Wie kann ich dir helfen?',
    topics: [
      { label: 'Artikel finden', question: 'Wie finde ich einen Artikel?' },
      { label: 'Versand', question: 'Wie sind die Versandbedingungen?' },
      { label: 'Bestellung verfolgen', question: 'Wie kann ich meine Bestellung verfolgen?' },
    ],
    placeholder: 'Frage eingeben…',
    privacy: 'Bitte keine persönlichen Daten oder Zahlungsdaten teilen.',
    replies: {
      greeting: 'Hallo! Wonach suchst du?',
      delivery: 'Bestellungen sind derzeit noch nicht möglich. Versandinformationen folgen in Kürze.',
      returns: 'Die Rückgabebedingungen werden vor dem Verkaufsstart veröffentlicht.',
      orders: 'Bestellungen und Zahlungen sind vorübergehend deaktiviert. Falls bereits eine Bestellung mit deinem Konto verknüpft ist, kannst du dich anmelden und den Status prüfen.',
      account: 'Melde dich in deinem Konto an, um die zugehörigen Informationen aufzurufen. Teile hier niemals dein Passwort.',
      products: 'Im Katalog und auf den Produktseiten findest du Artikel, Preise und Verfügbarkeit.',
      productSearch: 'Hier findest du die Artikel, die zu deiner Suche passen.',
      contact: 'Die Kontaktdaten des Shops stehen in den rechtlichen Informationen.',
      fallback: 'Ich helfe dir bei Artikeln, deinem Konto, Bestellungen, Versand und Rückgaben.',
      unavailable: 'Dazu habe ich keine Antwort gefunden. Frage gern nach einem Artikel, einer Bestellung oder deinem Konto.',
    },
    actions: { catalog: 'Katalog ansehen', account: 'Mein Konto', tracking: 'Bestellung verfolgen', terms: 'Verkaufsbedingungen', legal: 'Impressum', searchResults: 'Passende Artikel ansehen' },
  },
}

function getLocalReply(question: string, language: Language): LocalReply | null {
  const normalized = question
    .toLocaleLowerCase('fr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const copy = chatCopy[language]
  const action = (key: keyof typeof copy.actions, href: string): ChatAction => ({
    label: copy.actions[key],
    href,
  })
  const catalog = action('catalog', '/products')
  const account = action('account', '/account')
  const tracking = action('tracking', '/track-order')
  const searchTerms = getCatalogSearchTerms(normalized)

  if (/^(bonjour|bonsoir|salut|coucou|hello|help|aide|hola|buenas|guten tag|hallo|hilfe)$/.test(normalized)) {
    return {
      content: copy.replies.greeting,
      actions: [catalog, account],
    }
  }

  if (/\b(livraison|livrer|expedition|expedie|delai|frais de port|transport|shipping|delivery|ship|envio\w*|entrega\w*|versand\w*|liefer\w*)\b/.test(normalized)) {
    return {
      content: copy.replies.delivery,
      actions: [catalog],
    }
  }

  if (/\b(retour|remboursement|echanger|echange|annuler|annulation|garantie|retractation|return|refund|exchange|cancel|devolucion|reembolso|cambio|storno|ruckgabe|erstattung|umtausch)\b/.test(normalized)) {
    return {
      content: copy.replies.returns,
      actions: [action('terms', '/cgv')],
    }
  }

  if (/\b(suivi|suivre|statut|ou est ma commande|commande|colis|paiement|payer|paiements|order|track|tracking|payment|pay|pedido|seguimiento|pago|bestellung|verfolgen|sendung|zahlung)\b/.test(normalized)) {
    return {
      content: copy.replies.orders,
      actions: [account, tracking],
    }
  }

  if (/\b(compte|connexion|connecter|inscription|inscrire|mot de passe|profil|account|login|sign in|password|register|cuenta|iniciar sesion|contrasena|registrar|konto|anmelden|passwort|registrieren)\b/.test(normalized)) {
    return {
      content: copy.replies.account,
      actions: [account],
    }
  }

  if (/\b(stock|disponible|disponibilite|taille|couleur|matiere|caracteristique|description|prix|article|produit|catalogue|categorie|categories|chercher|recherche|trouver|available|size|color|material|description|price|item|product|catalog|category|find|search|disponibilidad|talla|precio|articulos?|productos?|catalogo|categorias?|buscar|verfugbar|grosse|farbe|preis|artikel|produkte?|katalog|kategorie|finden|suche)\b/.test(normalized)) {
    return {
      content: copy.replies.products,
      actions: [catalog],
    }
  }

  if (/\b(contact|contacter|telephone|email|adresse|service client|conseiller humain|support|customer service|phone|address|atencion al cliente|contacto|telefono|direccion|kundendienst|kontakt|telefon|adresse)\b/.test(normalized)) {
    return {
      content: copy.replies.contact,
      actions: [action('legal', '/mentions-legales')],
    }
  }

  if (
    searchTerms &&
    /\b(cherche|recherche|trouver|trouve|veux|voudrais|avez|proposez|find|looking|search|want|have|busco|buscar|encuentro|quiero|tienen|necesito|suche|finden|suchen|mochte|habt|brauche)\b/.test(normalized)
  ) {
    return {
      content: copy.replies.productSearch,
      actions: [{
        label: copy.actions.searchResults,
        href: `/products?q=${encodeURIComponent(searchTerms)}`,
      }],
    }
  }

  return null
}

const SEARCH_STOP_WORDS = new Set(
  'a an am an and are as at auf aus avec avoir bei bitte can could de des do did does du ein eine einer et for from haben have ich i in is ihr la le les mi of on oder ou para por pour que qui rechercher recherche cherche trouver trouve un une the to want was what with you your je tu vous votre est ce auriez voudrais veux avez article articles produit products item items catalog catalogue chercher find looking search suche suchen finden mochte moechte busco buscar quiero como puedo el los las del y para por tienes tienen necesito quisiera habt brauche'.split(' ')
)

function getCatalogSearchTerms(normalizedQuestion: string): string {
  const terms = normalizedQuestion
    .split(' ')
    .filter((term) => term.length > 1 && !SEARCH_STOP_WORDS.has(term))
    .slice(0, 6)
  return terms.join(' ').slice(0, 80).trim()
}

export default function ChatWidget() {
  const pathname = usePathname()
  const { language } = useLanguage()
  const [open, setOpen] = useState(false)
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || configured !== null) return

    fetch('/api/chat')
      .then(async (response) => {
        if (!response.ok) throw new Error('Impossible de vérifier la disponibilité du chat.')
        const data: { configured?: boolean } = await response.json()
        setConfigured(data.configured === true)
      })
      .catch(() => setConfigured(false))
  }, [open, configured])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, sending, open])

  if (pathname.startsWith('/admin')) return null

  async function handleQuestion(question: string) {
    const content = question.trim()
    if (!content || sending) return

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content }]
    setMessages(nextMessages)
    setInput('')
    const copy = chatCopy[language]
    const generalHelp: LocalReply = {
      content: copy.replies.fallback,
      actions: [
        { label: copy.actions.catalog, href: '/products' },
        { label: copy.actions.account, href: '/account' },
        { label: copy.actions.tracking, href: '/track-order' },
      ],
    }
    const localReply = getLocalReply(content, language)
    if (localReply || configured !== true) {
      setMessages([...nextMessages, { role: 'assistant', ...(localReply || generalHelp) }])
      return
    }

    setSending(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages.slice(-10) }),
      })
      const data: { message?: string; error?: string } = await response.json()
      if (!response.ok || !data.message) {
        throw new Error(data.error || 'La réponse du conseiller est indisponible.')
      }
      setMessages((current) => [...current, { role: 'assistant', content: data.message! }])
    } catch (submitError) {
      console.error('Chat assistant request failed:', submitError)
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: copy.replies.unavailable,
          actions: generalHelp.actions,
        },
      ])
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void handleQuestion(input)
  }

  return (
    <div className="fixed bottom-5 right-4 z-40 sm:bottom-6 sm:right-6">
      {open && (
        <section
          aria-label="Conseiller de la boutique"
          className="motion-rise mb-3 flex h-[min(520px,calc(100dvh-7rem))] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[#20211f] text-zinc-200 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.8)]"
        >
          <header className="flex items-center justify-between border-b border-white/[0.08] bg-[#242523] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#b6a17d]/10 text-[#c2b18f]">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-serif text-base font-semibold text-zinc-100">{chatCopy[language].title}</h2>
                <p className="text-[11px] text-zinc-500">{chatCopy[language].subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le conseiller"
              className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            <div className="max-w-[90%] rounded-2xl rounded-tl-sm border border-white/[0.08] bg-[#292a27] px-3.5 py-3 text-sm leading-relaxed text-zinc-300 shadow-sm">
              {chatCopy[language].welcome}
            </div>
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {chatCopy[language].topics.map((topic) => (
                  <button
                    key={topic.label}
                    type="button"
                    onClick={() => void handleQuestion(topic.question)}
                    className="rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[11px] text-zinc-300 transition-colors hover:border-[#8f8065] hover:text-zinc-100"
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            )}
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'ml-auto max-w-[90%]' : 'max-w-[90%]'}>
                <div
                  className={`whitespace-pre-wrap rounded-2xl px-3.5 py-3 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'rounded-tr-sm bg-[#66563d] text-white'
                      : 'rounded-tl-sm border border-white/[0.08] bg-[#292a27] text-zinc-300 shadow-sm'
                  }`}
                >
                  {message.content}
                </div>
                {message.actions && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.actions.map((action) => (
                      <Link
                        key={action.href}
                        href={action.href}
                        onClick={() => setOpen(false)}
                        className="rounded-full border border-[#8f8065]/50 px-3 py-1.5 text-[11px] font-medium text-[#c2b18f] transition-colors hover:bg-white/[0.05]"
                      >
                        {action.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Préparation de la réponse…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-white/[0.08] bg-[#242523] p-3">
            <label className="sr-only" htmlFor="store-chat-message">Votre message</label>
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-[#191a19] p-1.5 focus-within:border-[#8f8065] focus-within:ring-2 focus-within:ring-[#b6a17d]/15">
              <input
                id="store-chat-message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={1000}
                disabled={sending}
                placeholder={chatCopy[language].placeholder}
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                aria-label="Envoyer le message"
                disabled={!input.trim() || sending}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#665d4d] text-white transition-colors hover:bg-[#77705f] disabled:cursor-not-allowed disabled:bg-zinc-700"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-zinc-500">{chatCopy[language].privacy}</p>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? 'Fermer le conseiller boutique' : 'Ouvrir le conseiller boutique'}
        className="motion-link ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#665d4d] text-white shadow-lg shadow-black/30 hover:bg-[#77705f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8f8065]"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </div>
  )
}
