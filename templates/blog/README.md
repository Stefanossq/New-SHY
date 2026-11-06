# Blog Pessoal AI (Jikan + Gemini)

Este é um blog gerado automaticamente utilizando dados da **Jikan API** (Animes) e textos do **Google Gemini**.
Possui suporte a temas Dark (Terminal Refinado) e Light (Clean).

## Funcionalidades

- **Conteúdo:** Recomendações de animes geradas por IA (pt-BR) via endpoint Random.
- **Real-time Respect (Likes):** Sistema de likes em tempo real via WebSockets do Convex.
- **Busca:** Filtragem instantânea de posts por título.
- **Airing Now:** Widget lateral mostrando animes lançados no dia atual (Jikan Schedules) em PT-BR.
- **Comentários IA:** O Gemini gera comentários de personas (Hater, Fanboy, etc) para cada post.
- **CMS Admin:** Edite e exclua posts diretamente pelo dashboard.
- **Promo Widget:** Exibe trailers recentes de animes na Home via Jikan API (/watch/promos).
- **Vibe Matcher:** Encontre animes baseados no seu sentimento atual (IA).
- **Times:** Geração aleatória de times de personagens via Jikan API (Agora na Home).
- **Game da Semana:** Recomendação de game via FreeToGame API.
- **Chatbot TTS:** Assistente virtual com Text-to-Speech para acessibilidade.
- **Temas:** Alternância entre modo Terminal Soft e modo Clean.

## Configuração

1. Instale as dependências: `npm install` (Compatível com React 18).
2. Configure as variáveis em `.env.local`.
3. Rode o Convex: `npx convex dev`
4. Rode o Next.js: `npm run dev`
