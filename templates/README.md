# 📦 Repositório de Templates de Aplicações

Este diretório contém os projetos templates independentes do **ScaffoldEngine**. Cada template é um projeto autônomo, desacoplado e pronto para ser executado ou customizado individualmente.

## 📁 Estrutura de Diretórios

```
templates/
├── store/     # E-commerce Full-Stack (Next.js 15 + Convex DB + Clerk Auth + Gemini)
├── blog/      # Blog Dinâmico (Next.js + SSG Markdown + Jikan Anime API + Gemini)
└── travel/    # Planejador de Viagens IA (Dashboard Minimalista + Glassmorphism + Gemini)
```

---

## 🚀 Como Executar Qualquer Template Manualmente

1. Navegue até o diretório desejado:
   ```bash
   cd templates/store # ou templates/blog, templates/travel
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure o arquivo de ambiente:
   ```bash
   cp .env.local.example .env.local
   # Adicione sua chave GEMINI_API_KEY se desejar funcionalidades de IA
   ```

4. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

---

## 🔑 Dependência da API Gemini
Todos os templates utilizam estritamente a chave de API padrão (`GEMINI_API_KEY`) para geração de dados e inteligência artificial, sem bibliotecas invasivas ou configurações complexas.
