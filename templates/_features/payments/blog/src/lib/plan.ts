// Assinatura do blog. Ajuste nome, preço (em centavos) e benefícios à vontade.
export const PLAN = {
  name: "Apoiador",
  priceCents: 990,
  benefits: [
    "Ajuda a manter o blog no ar e com conteúdo novo toda semana",
    "Cancelamento a qualquer momento pelo portal do Stripe",
  ],
} as const;
