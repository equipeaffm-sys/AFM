export interface HomepageSection {
  id: string
  title: string
  is_active: boolean
}

export interface SiteSettings {
  hero_title: string
  hero_subtitle: string
  hero_image_url: string
  hero_cta_text: string
  hero_cta_link: string
  announcement_text: string
  announcement_texts: {
    FR: string
    EN: string
    ES: string
    DE: string
  }
  announcement_active: boolean
  theme_accent_color: string
  homepage_sections: HomepageSection[]
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  hero_title: 'Bienvenue',
  hero_subtitle: 'Découvrez notre sélection.',
  hero_image_url: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?q=80&w=1600&auto=format&fit=crop',
  hero_cta_text: 'Voir le catalogue',
  hero_cta_link: '/products',
  announcement_text: '',
  announcement_texts: {
    FR: '',
    EN: '',
    ES: '',
    DE: '',
  },
  announcement_active: false,
  theme_accent_color: '#C5A059',
  homepage_sections: [
    { id: 'hero', title: 'Bannière Principale (Hero)', is_active: true },
    { id: 'featured', title: 'Produits', is_active: true },
  ],
}

export function sanitizeSiteSettings(val: unknown): SiteSettings {
  if (!val || typeof val !== 'object') return DEFAULT_SITE_SETTINGS

  const obj = val as Record<string, unknown>

  const sections = Array.isArray(obj.homepage_sections)
    ? obj.homepage_sections
        .filter((s: unknown) => s && typeof s === 'object' && typeof (s as Record<string, unknown>).id === 'string')
        .map((s: unknown) => {
          const item = s as Record<string, unknown>
          return {
            id: item.id as string,
            title: typeof item.title === 'string' ? item.title : (item.id as string),
            is_active: typeof item.is_active === 'boolean' ? item.is_active : true,
          }
        })
    : DEFAULT_SITE_SETTINGS.homepage_sections

  const rawTexts = obj.announcement_texts && typeof obj.announcement_texts === 'object'
    ? (obj.announcement_texts as Record<string, unknown>)
    : null

  const announcement_texts = rawTexts
    ? {
        FR: typeof rawTexts.FR === 'string' ? rawTexts.FR : DEFAULT_SITE_SETTINGS.announcement_texts.FR,
        EN: typeof rawTexts.EN === 'string' ? rawTexts.EN : DEFAULT_SITE_SETTINGS.announcement_texts.EN,
        ES: typeof rawTexts.ES === 'string' ? rawTexts.ES : DEFAULT_SITE_SETTINGS.announcement_texts.ES,
        DE: typeof rawTexts.DE === 'string' ? rawTexts.DE : DEFAULT_SITE_SETTINGS.announcement_texts.DE,
      }
    : DEFAULT_SITE_SETTINGS.announcement_texts

  return {
    hero_title: typeof obj.hero_title === 'string' ? obj.hero_title : DEFAULT_SITE_SETTINGS.hero_title,
    hero_subtitle: typeof obj.hero_subtitle === 'string' ? obj.hero_subtitle : DEFAULT_SITE_SETTINGS.hero_subtitle,
    hero_image_url: typeof obj.hero_image_url === 'string' ? obj.hero_image_url : DEFAULT_SITE_SETTINGS.hero_image_url,
    hero_cta_text: typeof obj.hero_cta_text === 'string' ? obj.hero_cta_text : DEFAULT_SITE_SETTINGS.hero_cta_text,
    hero_cta_link: typeof obj.hero_cta_link === 'string' ? obj.hero_cta_link : DEFAULT_SITE_SETTINGS.hero_cta_link,
    announcement_text: typeof obj.announcement_text === 'string' ? obj.announcement_text : DEFAULT_SITE_SETTINGS.announcement_text,
    announcement_texts,
    announcement_active: typeof obj.announcement_active === 'boolean' ? obj.announcement_active : DEFAULT_SITE_SETTINGS.announcement_active,
    theme_accent_color: typeof obj.theme_accent_color === 'string' ? obj.theme_accent_color : DEFAULT_SITE_SETTINGS.theme_accent_color,
    homepage_sections: sections.length > 0 ? sections : DEFAULT_SITE_SETTINGS.homepage_sections,
  }
}
