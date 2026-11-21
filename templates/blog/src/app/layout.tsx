import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import WelcomeChatBot from "@/components/WelcomeChatBot";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { themeVars } from "@/lib/theme";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: SITE.name,
  description: SITE.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="pt-BR">
        <body className={inter.className} style={themeVars(SITE.palette)}>
          <ConvexClientProvider>
            <header className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
                <Link href="/" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                    &gt;_ {SITE.name}
                </Link>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {SITE.features.payments && <Link href="/premium">Seja apoiador</Link>}
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="btn" style={{ padding: '5px 15px', fontSize: '0.8rem' }}>LOGIN</button>
                        </SignInButton>
                    </SignedOut>
                </div>
            </header>
            
            {children}
            <WelcomeChatBot />
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
