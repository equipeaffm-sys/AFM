import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import { CartProvider } from "@/components/CartContext";
import { CurrencyProvider } from "@/components/CurrencyContext";
import { LanguageProvider } from "@/components/LanguageContext";
import ChatWidget from "@/components/ChatWidget";
import InteractiveEffects from "@/components/InteractiveEffects";
import ScrollUtilities from "@/components/ScrollUtilities";
import PageTransitions from "@/components/PageTransitions";
import { SavedProductsProvider } from "@/context/SavedProductsContext";
import { Toaster } from "react-hot-toast";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lm-maison.com";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  display: "swap",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "L&M",
    template: "%s | L&M",
  },
  description: "Consultez le catalogue et les informations disponibles sur le site L&M.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: "L&M",
    title: "L&M",
    description: "Consultez le catalogue et les informations disponibles sur le site L&M.",
  },
  twitter: {
    card: "summary_large_image",
    title: "L&M",
    description: "Consultez le catalogue et les informations disponibles sur le site L&M.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col justify-between bg-background text-foreground antialiased`}>
        <LanguageProvider>
          <CurrencyProvider>
            <CartProvider>
              <SavedProductsProvider>
              <Toaster
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: '#18181b',
                    color: '#f4f4f5',
                    border: '1px solid #27272a',
                    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                    fontSize: '12px',
                  },
                }}
              />
              <Navbar />
              <InteractiveEffects />
              <ScrollUtilities />
              <main className="flex-grow">
                <PageTransitions>{children}</PageTransitions>
              </main>
              <ChatWidget />
              <CookieBanner />
              <Footer />
              </SavedProductsProvider>
            </CartProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
