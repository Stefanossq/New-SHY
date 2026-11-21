import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConvexClientProvider from "./ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import { dark } from "@clerk/themes";
import { ToasterProvider } from "@/context/ToasterContext";
import Toaster from "@/components/Toaster";
import { SITE } from "@/lib/site";
import { themeVars } from "@/lib/theme";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: SITE.name,
  description: SITE.description,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider localization={ptBR} appearance={{ baseTheme: dark }}>
      <html lang="pt-BR">
        <body className={inter.className} style={themeVars(SITE.palette)}>
          <ConvexClientProvider>
            <ToasterProvider>
              <CartProvider>
                <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
                  <Header />
                  <main style={{ flexGrow: 1 }}>{children}</main>
                  <Footer />
                </div>
                <Toaster />
              </CartProvider>
            </ToasterProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
