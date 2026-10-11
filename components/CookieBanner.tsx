"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("lm_cookie_notice_dismissed");
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("lm_cookie_notice_dismissed", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-zinc-950/95 border-t border-amber-500/30 backdrop-blur-md text-zinc-100 shadow-2xl transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 max-w-3xl">
          <Cookie className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-serif text-sm font-semibold tracking-wider text-amber-500 uppercase">
              Informations sur les cookies
            </h3>
            <p className="text-xs text-zinc-300 font-light leading-relaxed">
              Les informations détaillées sur les cookies et technologies utilisés sont en cours de préparation. Consultez notre{" "}
              <Link href="/politique-de-confidentialite" className="underline text-amber-400 hover:text-amber-300 transition-colors">
                Politique de Confidentialité
              </Link>{" "}
              pour en savoir plus.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800">
          <button
            onClick={handleDismiss}
            className="flex-1 md:flex-none px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-amber-500/10"
          >
            Fermer
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Fermer"
            className="text-zinc-500 hover:text-zinc-300 p-1 md:ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
