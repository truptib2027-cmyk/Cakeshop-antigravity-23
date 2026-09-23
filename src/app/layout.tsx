import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CakeCart | Artisan Home-Bakery & Custom Celebration Cakes",
  description:
    "Handcrafted small-batch artisan celebration cakes with daily capacity limits, scheduled pickup windows, and custom hand-piped messages.",
  keywords: ["artisan bakery", "custom cakes", "bento cakes", "eggless cakes", "gluten-free cakes", "celebration cakes"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${outfit.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2A1B14] selection:bg-[#FEF3C7] selection:text-[#92400E]">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
