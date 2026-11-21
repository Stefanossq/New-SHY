import type { CSSProperties } from "react";
import type { SitePalette, SiteProductField } from "./siteTypes";

/**
 * Variáveis CSS da paleta, aplicadas no <body>. Cobre os nomes usados pelos
 * três templates (loja, blog e planejador), então trocar a paleta em
 * src/lib/site.ts muda o site inteiro.
 */
export const themeVars = (p: SitePalette): CSSProperties => {
  const border = `color-mix(in srgb, ${p.text} 16%, ${p.background})`;
  const vars: Record<string, string> = {
    // loja
    "--bg-main": p.background,
    "--bg-card": p.surface,
    "--bg-input": `color-mix(in srgb, ${p.surface} 85%, ${p.text})`,
    "--text-main": p.text,
    "--text-muted": p.muted,
    "--border-light": border,
    "--border-focus": p.accent,
    "--accent": p.accent,
    "--accent-hover": `color-mix(in srgb, ${p.accent} 82%, ${p.text})`,
    "--accent-text": p.accentText,
    // blog
    "--bg-color": p.background,
    "--text-primary": p.text,
    "--text-secondary": p.muted,
    "--color-accent": p.accent,
    "--border-color": border,
    "--card-bg": p.surface,
    // planejador
    "--panel-bg": `color-mix(in srgb, ${p.surface} 70%, transparent)`,
  };
  return { ...vars, backgroundColor: p.background, color: p.text } as CSSProperties;
};

/** Valor de um campo extra formatado para exibição ("250 g", "Média"). */
export const formatAttribute = (field: SiteProductField, value: string | number | undefined): string => {
  if (value === undefined || value === "") return "—";
  // Sem separador de milhar: anos e códigos ("2017") não podem virar "2.017".
  const text = typeof value === "number" ? value.toLocaleString("pt-BR", { useGrouping: false, maximumFractionDigits: 2 }) : value;
  return field.unit ? `${text} ${field.unit}` : text;
};
