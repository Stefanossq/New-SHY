import "./globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import ConvexClientProvider from "./ConvexClientProvider";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Travel AI Noir",
  description: "Planejamento de viagens minimalista",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="pt-BR">
        <body>
          <ConvexClientProvider>
            <Header />
            <main className="main-wrapper">
                {children}
            </main>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
