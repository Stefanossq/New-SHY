// Plano pago do planejador. Ajuste nome, preço (em centavos), benefícios e limite.
export const PLAN = {
  name: "Premium",
  priceCents: 1990,
  /** Quantos roteiros o plano grátis pode salvar. */
  freeTripLimit: 3,
  benefits: [
    "Roteiros salvos ilimitados (no plano grátis: 3)",
    "Cancelamento a qualquer momento pelo portal do Stripe",
  ],
} as const;
