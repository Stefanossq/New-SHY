import "./globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import ConvexClientProvider from "./ConvexClientProvider";
import Header from "@/components/Header";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: SITE.name,
  description: SITE.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="pt-BR">
        <body style={{ "--accent": SITE.accentColor } as React.CSSProperties}>
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
