# Plano de Implementação: Arquitetura Limpa de Diretórios, Templates Desacoplados e Suíte de Testes

Reestruturar a arquitetura do repositório para que seja intuitivo, modular e fácil de manipular por qualquer desenvolvedor no GitHub, separando os templates em seus próprios diretórios físicos reais (`templates/store`, `templates/blog`, `templates/travel`), garantindo que a integração com Gemini seja estritamente dependente da chave de API (sem amarras ou SDKs pesados no cliente), e introduzindo uma suíte de testes automatizada para validar o gerador e a integridade de cada template individual.

---

## Revisão do Usuário & Decisões Críticas

> [!IMPORTANT]
> As escolhas arquiteturais foram confirmadas na fase de alinhamento interativo:

- **Estruturação de Diretórios**: Pasta raiz `templates/` com subdiretórios individuais dedicados:
  - `templates/store/` (Template E-Commerce Full-Stack com Convex DB e Clerk Auth)
  - `templates/blog/` (Template Blog Markdown / Next.js com geração estática SSG)
  - `templates/travel/` (Template AI Travel Planner com microserviços e Convex)
- **Formato dos Templates**: Arquivos reais no disco, facilitando manutenção direta via git/editor, carregados dinamicamente pelo gerador e empacotados na exportação.
- **Dependência do Gemini**: Exclusiva da variável de ambiente `GEMINI_API_KEY` via rota de backend (`/api/ai/*`) com modelo estável `gemini-3.8-flash`. Nenhuma dependência externa invasiva no cliente.
- **Estratégia de Validação**: Suíte automatizada de testes (`npm test`) validando a integridade sintática e estrutural de cada template, além da orquestração de geração e exportação.

---

## 1. Visão Geral & Conceito

- **Objetivo**: Transformar o repositório em um projeto de referência limpo para GitHub e TCC/portfólio, onde:
  1. Qualquer desenvolvedor pode navegar na pasta `templates/`, inspecionar o código de qualquer um dos templates como um projeto autônomo, rodá-lo ou modificá-lo livremente.
  2. O gerador (`ScaffoldEngine`) orquestra os templates sem acoplamento rígido, lendo as estruturas modulares e injetando dados dinâmicos quando solicitado.
  3. A validação de compilação e integridade de cada template pode ser executada por scripts simples de automação.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ESTRUTURA DO REPOSITÓRIO                        │
├────────────────────────────────────────────────────────────────────────┤
│ ├── server.ts                 (Servidor proxy + Gemini 3.8 Flash)      │
│ ├── App.tsx                   (UI do ScaffoldEngine Studio)            │
│ ├── templates/                (PROJETOS TEMPLATES INDEPENDENTES)       │
│ │   ├── store/                (Loja Next.js + Convex + Clerk)          │
│ │   │   ├── package.json, app/, convex/, components/, ...              │
│ │   ├── blog/                 (Blog Next.js + SSG Markdown)            │
│ │   │   ├── package.json, pages/, posts/, styles/, ...                 │
│ │   └── travel/               (Travel Planner AI + Microserviços)      │
│ │       ├── package.json, app/, convex/, lib/, ...                     │
│ ├── lib/                      (Mecanismos do Gerador & Adaptador)      │
│ │   ├── templateLoader.ts     (Carregador dos templates do disco)      │
│ │   ├── generatorEngine.ts    (Orquestração e injeção dinâmica)        │
│ │   └── platformAdapter.ts    (Exportação Web ZIP / Desktop Local)     │
│ └── tests/                    (Suíte de testes automatizada)           │
│     ├── generator.test.ts     (Testa fluxo de geração e IA)           │
│     └── templates.test.ts     (Valida integridade de cada template)    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Experiência do Usuário & Navegação

- **Navegação Intuitiva no GitHub**: O desenvolvedor abre o repositório e identifica de imediato a pasta `templates/` com os três projetos prontos para uso, cada um com seu próprio `package.json` e `README.md`.
- **Experiência na Aplicação**:
  - Seleção ágil entre os três templates com filtros e visualização de stack.
  - No template Loja, inserção do tema da loja (ex.: "Cafeteria Artesanal" ou "Carros Esportivos") com chamada segura ao Gemini via chave de API no servidor.
  - Tela de resultado protegida pelo `ResultScreenErrorBoundary`, com abas de *Live Preview*, *Explorador de Arquivos*, *Esquemas DB*, *Topologia Distribuída* e *Exportação*.
  - Exportação direta para ZIP ou gravação direta em disco no caso de executável Desktop.

---

## 3. Decisões Técnicas & Arquitetura

### Decisão 1: Templates como Arquivos Reais no Disco vs Strings Hardcoded
- **Abordagem**: Criar diretórios físicos reais em `templates/store/`, `templates/blog/` e `templates/travel/`. Cada template possui sua árvore de código limpa. O gerador unifica e carrega esses arquivos de modo transparente.
- **Benefício**: Qualquer pessoa que clone o repositório pode entrar em `templates/store` e dar `npm install && npm run dev` diretamente sem depender do gerador.

### Decisão 2: Gemini Dependente Apenas da Chave de API
- **Abordagem**: Todas as requisições de IA passam pelo endpoint `/api/ai/products` e utilizam unicamente a `process.env.GEMINI_API_KEY` (injetada pelo ambiente ou configurada no `.env`). Nenhuma dependência invasiva ou token complexo no front-end. Em caso de ausência da chave, fallback gracioso imediato.

### Decisão 3: Suíte de Testes Automatizada
- **Abordagem**: Implementar testes automatizados com Node test runner (`node --test` ou Vitest) para testar:
  1. Carregamento e completude dos arquivos de cada template em `templates/`.
  2. Validação dos schemas de banco e arquivos de entrada (`package.json`, layout, entry points).
  3. Orquestração da geração com injeção de catálogo dinâmico.
  4. Endpoint de saúde `/api/health` e rota `/api/ai/products`.

---

## 4. Fases de Execução

1. **Estruturação Física de Templates (`templates/`)**:
   - Criar `templates/store/` com todos os arquivos completos do projeto de e-commerce.
   - Criar `templates/blog/` com todos os arquivos completos do projeto de blog SSG.
   - Criar `templates/travel/` com todos os arquivos completos do planejador de viagens.
   - Adicionar `README.md` explicativo em cada diretório de template indicando como executar cada um de forma independente.

2. **Criação do Módulo Unificado de Carregamento (`lib/templateLoader.ts`)**:
   - Carregar e indexar os arquivos de cada template diretamente da pasta correspondente.
   - Integrar ao `PROJECT_TEMPLATES` e `generatorEngine.ts` sem quebras na UI ou na exportação.

3. **Verificação da Dependência do Gemini**:
   - Garantir que `server.ts` use estritamente `process.env.GEMINI_API_KEY` com fallback robusto.
   - Confirmar ausência de bibliotecas de IA client-side desnecessárias no bundle do React.

4. **Criação e Execução da Suíte de Testes**:
   - Criar `tests/templates.test.ts` e `tests/generator.test.ts`.
   - Adicionar script `"test"` ao `package.json`.
   - Executar os testes e validar que cada template e o motor de geração passam com 100% de sucesso.

5. **Verificação de Compilação & Dev Server**:
   - Executar `compile_applet` e testes para garantir estabilidade e zero regressões.
