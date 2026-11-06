# Loja Simples (Premium Monochrome)

E-commerce profissional com design minimalista, simulação de pagamento avançada e sistema de avaliações.

## Stack

- **Framework:** Next.js 15.2+ (React 19)
- **Backend:** Convex
- **Auth:** Clerk
- **AI:** Google Gemini (Geração de Imagens)

## Funcionalidades Novas

1.  **Checkout Simulado (Stripe-like):**
    - Inputs de cartão com formatação automática.
    - Validação de algoritmo de Luhn para números de cartão de crédito.
    - Feedback visual de erro/sucesso nos inputs.

2.  **Sistema de Avaliações:**
    - Usuários logados podem avaliar produtos (1-5 estrelas).
    - Cálculo automático de média.

3.  **Design "Noir":**
    - Tema preto e branco de alto contraste para passar credibilidade.

## Configuração

1.  Instale: `npm install` (Sem erros de peer deps!)
2.  Configure `.env.local` (veja exemplo).
3.  Rode: `npx convex dev` e `npm run dev`.
