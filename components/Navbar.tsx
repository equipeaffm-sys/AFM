"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingBag, Search, Menu, X, User } from "lucide-react";
import { useCart } from "./CartContext";
import { useLanguage } from "./LanguageContext";
import SearchModal from "./SearchModal";
import MegaMenu from "./MegaMenu";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const [dbAnnouncement, setDbAnnouncement] = useState<Record<string, string> | null>(null);
  const [announcementActive, setAnnouncementActive] = useState<boolean>(false);

  const { totalCount, toggleCart } = useCart();
  const { language, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock background scroll when mobile menu drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "main_config")
          .single();

        if (data?.value) {
          if (data.value.announcement_texts && typeof data.value.announcement_texts === 'object') {
            setDbAnnouncement(data.value.announcement_texts);
          } else if (data.value.announcement_text) {
            setDbAnnouncement({ FR: data.value.announcement_text });
          }
          if (typeof data.value.announcement_active === "boolean") {
            setAnnouncementActive(data.value.announcement_active);
          }
        }
      } catch (error) {
        console.error('Unable to load announcement settings:', error);
      }
    }
    loadSettings();
  }, []);

  // Use only an announcement configured in the database.
  const activeMarqueeText =
    dbAnnouncement?.[language] ||
    dbAnnouncement?.FR ||
    "";

  return (
    <header className="sticky top-0 left-0 right-0 z-40 w-full border-b border-white/[0.07] bg-[#1b1c1b]/95 shadow-[0_4px_24px_-18px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-300">
      {/* Infinite Marquee Top Announcement Bar (Strictly i18n Single Language) */}
      {announcementActive && activeMarqueeText && (
        <div className="bg-[#222320] text-[#b6a17d] border-b border-white/[0.06] text-[10px] uppercase font-semibold tracking-[0.25em] py-1.5 overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee">
            <span>
              {activeMarqueeText}
              {activeMarqueeText}
              {activeMarqueeText}
              {activeMarqueeText}
            </span>
          </div>
        </div>
      )}

      {/* Main Navigation Header */}
      <div
        className={`transition-all duration-300 text-zinc-200 ${
          isScrolled ? "py-2.5 bg-[#1b1c1b]/95" : "py-3.5 bg-[#1b1c1b]/90"
        }`}
      >
        <nav className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between text-[#e6e3dc]">
          {/* Left Navigation (Desktop) */}
          <div className="hidden md:flex items-center space-x-8 text-xs tracking-[0.2em] uppercase font-medium text-[#d0cdc5]">
            <Link
              href="/products"
              className="motion-link relative py-2 text-[#d0cdc5] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-[#b6a17d] after:transition-transform hover:text-[#e8e5de] hover:after:scale-x-100"
            >
              {t.catalog}
            </Link>
            <MegaMenu />
          </div>

          {/* Brand Logo */}
          <div className="flex-1 md:flex-none text-center">
            <Link href="/" className="inline-block group">
              <span className="font-serif text-2xl md:text-3xl tracking-[0.25em] font-light uppercase text-[#eeeae2]">
                L<span className="text-[#b6a17d] font-normal">&amp;</span>M
              </span>
              <span                             className="block text-[8px] tracking-[0.4em] text-zinc-500 uppercase font-light text-center group-hover:text-[#c2b18f] transition-colors">
                Boutique
              </span>
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-4 md:space-x-6 text-zinc-200">
            {/* Live Search Trigger Button */}
            <button
              onClick={() => setSearchModalOpen(true)}
              aria-label="Rechercher"
              className="motion-link p-1 text-[#c9c6be] hover:text-[#e8e5de] hidden sm:block cursor-pointer"
            >
              <Search className="w-5 h-5 stroke-[1.5]" />
            </button>

            <Link
              href="/account"
              aria-label="Compte client"
              className="motion-link p-1 text-[#c9c6be] hover:text-[#e8e5de] hidden sm:block"
            >
              <User className="w-5 h-5 stroke-[1.5]" />
            </Link>

            <button
              onClick={toggleCart}
              aria-label="Panier d'achats"
              className="motion-link relative p-1 text-[#c9c6be] hover:text-[#e8e5de] cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
              <span className="absolute -top-1 -right-1 bg-[#b6a17d] text-[#191a19] text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-sm">
                {totalCount}
              </span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              className="md:hidden p-1 text-[#c9c6be] hover:text-[#b6a17d] transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 stroke-[1.5]" />
              ) : (
                <Menu className="w-6 h-6 stroke-[1.5]" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Full-Screen / Side Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-[60px] bg-[#191a19] text-[#e6e3dc] z-50 flex flex-col justify-between p-8 space-y-6 animate-fadeIn overflow-y-auto">
            <div className="space-y-6">
              <div className="flex flex-col space-y-5 text-center text-sm tracking-[0.2em] uppercase font-serif text-[#e6e3dc] pt-4">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSearchModalOpen(true);
                  }}
                  className="py-2 text-[#c2b18f] font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  Recherche Instantanée
                </button>
                <Link
                  href="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 hover:text-[#c2b18f] transition-colors"
                >
                  {t.catalog}
                </Link>
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-[#c2b18f] font-bold transition-colors"
                >
                  Mon compte
                </Link>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Live Search Fullscreen Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </header>
  );
}
