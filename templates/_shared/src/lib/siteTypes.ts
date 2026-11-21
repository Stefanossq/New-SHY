// Formato da configuração do site (src/lib/site.ts). Gerado pelo Gato Pingado.

export interface SitePalette {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
}

export interface SiteCopy {
  heroTitle: string;
  heroSubtitle: string;
  ctaLabel: string;
  aboutTitle: string;
  aboutText: string;
}

/** Campo extra dos produtos (valores ficam em `product.attributes[key]`). */
export interface SiteProductField {
  key: string;
  label: string;
  type: "text" | "number";
  unit?: string;
}

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  /** Mesmo valor de palette.accent (mantido por compatibilidade). */
  accentColor: string;
  palette: SitePalette;
  copy: SiteCopy;
  productFields: SiteProductField[];
  features: {
    payments: boolean;
  };
}
