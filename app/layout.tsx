import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import { CartProvider } from "@/components/CartContext";
import { CurrencyProvider } from "@/components/CurrencyContext";
import { LanguageProvider } from "@/components/LanguageContext";
import { CartDrawer } from "@/components/CartDrawer";
import ChatWidget from "@/components/ChatWidget";
import { Toaster } from "react-hot-toast";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lm-maison.com";

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
      <body className="bg-background text-foreground antialiased min-h-screen flex flex-col justify-between">
        <LanguageProvider>
          <CurrencyProvider>
            <CartProvider>
              <Toaster
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: '#18181b',
                    color: '#f4f4f5',
                    border: '1px solid #27272a',
                    fontFamily: 'serif',
                    fontSize: '12px',
                  },
                }}
              />
              <Navbar />
              <main className="flex-grow">{children}</main>
              <CartDrawer />
              <ChatWidget />
              <CookieBanner />
              <Footer />
            </CartProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
