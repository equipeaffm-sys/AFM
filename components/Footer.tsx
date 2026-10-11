"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { useLanguage, Language } from "./LanguageContext";
import { useCurrency, Currency } from "./CurrencyContext";

export default function Footer() {
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();

  return (
    <footer className="bg-[#151615] text-[#e6e3dc] border-t border-white/[0.07] pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-16 border-b border-white/10">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="font-serif text-3xl tracking-[0.25em] font-light uppercase text-[#eeeae2]">
                L<span className="text-[#b6a17d]">&amp;</span>M
              </span>
            </Link>
            <p className="max-w-xs text-xs text-zinc-400 font-light leading-relaxed">
              Une boutique indépendante, avec des univers et des articles sélectionnés pour vous.
            </p>
          </div>

          {/* Collections Column */}
          <div>
            <h4 className="text-xs tracking-widest uppercase font-medium text-[#b6a17d] mb-6">
              Collections
            </h4>
            <ul className="space-y-3 text-xs font-light text-zinc-400">
              <li>
                <Link href="/products" className="hover:text-[#eeeae2] transition-colors">
                  Voir le catalogue
                </Link>
              </li>
            </ul>
          </div>

          {/* Maison Column */}
          <div>
            <h4 className="text-xs tracking-widest uppercase font-medium text-[#b6a17d] mb-6">
              La Maison
            </h4>
            <ul className="space-y-3 text-xs font-light text-zinc-400">
              <li>
                <Link href="/account" className="hover:text-[#eeeae2] transition-colors">
                  Espace Membre
                </Link>
              </li>
              <li>
                <Link href="/mentions-legales" className="hover:text-[#eeeae2] transition-colors">
                  Mentions Légales
                </Link>
              </li>
              <li>
                <Link href="/cgv" className="hover:text-[#eeeae2] transition-colors">
                  CGV
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright, legal & discrete i18n/currency selectors */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-zinc-400 font-light space-y-4 md:space-y-0">
          <p>&copy; {new Date().getFullYear()} L&amp;M. Tous droits réservés.</p>

          {/* Discrete Language and Currency Selectors in Footer */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-md px-2.5 py-1 text-xs">
              <Globe className="w-3.5 h-3.5 text-[#b6a17d]" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="FR" className="bg-[#0D0D0D] text-white">Français (FR)</option>
                <option value="EN" className="bg-[#0D0D0D] text-white">English (EN)</option>
                <option value="ES" className="bg-[#0D0D0D] text-white">Español (ES)</option>
                <option value="DE" className="bg-[#0D0D0D] text-white">Deutsch (DE)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-md px-2.5 py-1 text-xs">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="bg-transparent text-[#c2b18f] font-medium focus:outline-none cursor-pointer"
              >
                <option value="EUR" className="bg-[#0D0D0D] text-white">EUR (€)</option>
                <option value="USD" className="bg-[#0D0D0D] text-white">USD ($)</option>
                <option value="GBP" className="bg-[#0D0D0D] text-white">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-6">
            <Link href="/mentions-legales" className="hover:text-white transition-colors">
              Mentions Légales
            </Link>
            <Link href="/cgv" className="hover:text-white transition-colors">
              CGV
            </Link>
            <Link href="/politique-de-confidentialite" className="hover:text-[#eeeae2] transition-colors">
              Confidentialité &amp; Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
