import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConvexProviderWithClerkComponent from "./ConvexProviderWithClerk";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import { ToasterProvider } from "@/context/ToasterContext";
import Toaster from "@/components/Toaster";
import { dark } from "@clerk/themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Loja Monochrome",
  description: "E-commerce Premium",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={ptBR} appearance={{ baseTheme: dark }}>
      <html lang="pt-BR">
        <body className={inter.className}>
          <ConvexProviderWithClerkComponent>
            <ToasterProvider>
              <CartProvider>
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                  <Header />
                  <main style={{ flexGrow: 1 }}>{children}</main>
                  <Footer />
                </div>
                <Toaster />
              </CartProvider>
            </ToasterProvider>
          </ConvexProviderWithClerkComponent>
        </body>
      </html>
    </ClerkProvider>
  );
}