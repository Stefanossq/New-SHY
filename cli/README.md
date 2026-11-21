# create-gato-pingado

O Gato Pingado pelo terminal. Gera um app full-stack pronto para rodar: **Next.js 15 + Convex + Clerk**, com **Stripe** opcional.

```bash
npx create-gato-pingado minha-loja --app store --purpose "Loja de cafés especiais torrados no sul de Minas" --payments
```

Sem opções, ele pergunta o que falta:

```bash
npx create-gato-pingado
```

## Apps

| `--app` | O que entrega |
|---|---|
| `store` | Loja virtual: catálogo, carrinho, pedidos, avaliações, painel admin |
| `blog` | Blog de anime e games com posts gerados por IA |
| `travel` | Planejador de viagens com roteiros gerados por IA |

## IA

Com `GEMINI_API_KEY` no ambiente (crie em https://aistudio.google.com/apikey), a IA cria:

- nome, slogan e **paleta de cores** (com contraste verificado);
- **textos do site** (título, subtítulo, botão, seção "sobre");
- na loja, o **catálogo** e até 3 **campos próprios** dos produtos (ex.: "Torra" e "Peso" para café).

Toda resposta passa por validação com zod; se vier errada, os erros voltam para a IA e ela tenta de novo. Sem chave (ou com `--no-ai`), o projeto sai com dados de exemplo.

```bash
GEMINI_API_KEY=... npx create-gato-pingado minha-loja --app store --purpose "..."
```

Opcional: `GEMINI_MODEL` (texto) e `GEMINI_IMAGE_MODEL` (fotos, com `--images`).

## Opções

```
--app <store|blog|travel>   qual app gerar
--name <nome>               nome do negócio (opcional)
--purpose <texto>           para que serve o app
--payments                  incluir pagamentos com Stripe
--no-ai                     não usar IA
--images                    gerar fotos dos produtos com IA
-y, --yes                   não perguntar nada
```

Requer Node.js 20.11+.
