# Gato Pingado

Gerador de apps full-stack. O cliente escolhe **qual app** quer, descreve **para quê** (o negócio e o público) e escolhe **com o quê** (recursos como pagamentos). No fim recebe um projeto completo, pronto para rodar:

- **Next.js 15** (App Router) + **TypeScript**
- **Convex** (banco, backend e tempo real)
- **Clerk** (login) e painel admin restrito por `ADMIN_USER_IDS`
- **Stripe** (opcional): checkout real na loja ou assinatura mensal no blog e no planejador
- **Gemini** (opcional): nome, **paleta de cores**, **textos do site**, catálogo com **campos próprios do negócio** e fotos, gerados a partir da descrição

| App | O que entrega | Pagamentos |
|---|---|---|
| Loja virtual | Catálogo, carrinho, pedidos, avaliações, painel admin | Checkout Stripe (cartão, Pix…), estoque reservado e liberado por webhook |
| Blog de anime e games | Posts gerados por IA (Jikan, FreeToGame), chatbot, painel admin | Assinatura "Apoiador" |
| Planejador de viagens | Roteiros dia a dia gerados por IA, salvos por usuário, chat | Plano Premium (grátis: 3 roteiros) |

## Rodar o gerador

Requisitos: Node.js 20.11+.

```bash
npm install
cp .env.example .env      # coloque sua GEMINI_API_KEY (opcional)
npm run dev               # http://localhost:3000
```

Sem `GEMINI_API_KEY` o gerador continua funcionando e avisa que está usando dados de exemplo.

A interface web é a demonstração. Para uso no dia a dia, há a CLI.

### CLI (`npx create-gato-pingado`)

```bash
npx create-gato-pingado minha-loja --app store --purpose "Loja de cafés especiais do sul de Minas" --payments
```

Sem opções, ela pergunta o que falta. Com `GEMINI_API_KEY` no ambiente, usa a IA; sem, sai com dados de exemplo. Detalhes em [cli/README.md](cli/README.md).

Para testar a CLI daqui: `npm run build:cli && node cli/dist/bin.js --help`. Para publicar: `cd cli && npm publish` (depois do `build:cli`).

## Personalização pela IA

A IA devolve JSON num formato fixo e **toda resposta passa por validação com zod** (`shared/content.ts`):

- **Paleta**: 6 cores `#RRGGBB`, fundo escuro e contrastes mínimos (WCAG) verificados em código. Paleta ilegível é rejeitada.
- **Textos**: título, subtítulo, botão e seção "sobre" da página inicial.
- **Campos do schema** (loja): até 3 campos extras por produto escolhidos para o negócio (ex.: "Torra" e "Peso" em g). Viram `attributes` na tabela `products` do Convex e aparecem na página do produto e no painel admin.

Se a resposta não passa, os erros voltam para a IA ("contraste de texto sobre o fundo é 1.2:1, precisa de 7:1") e ela tenta de novo, até 3 vezes. Falhas passageiras (503, limite de cota) também são repetidas. Se ainda assim falhar, o projeto sai com dados de exemplo e a interface avisa.

Produção: `npm run build && npm start`.

### App desktop (Windows)

A chave Gemini fica no Gerenciador de Credenciais do Windows e o projeto é gravado direto numa pasta.

```bash
npm run tauri dev     # desenvolvimento
npm run tauri build   # instalador .msi / .exe em src-tauri/target/release/bundle
```

Requer Rust (rustup) e os pré-requisitos do Tauri 2.

## Estrutura

```
shared/        Regras do produto, usadas pela interface, servidor, desktop e CLI
  catalog.ts     apps, recursos e variáveis de ambiente
  content.ts     prompts, schemas zod, validação, nova tentativa e dados de exemplo
  compose.ts     monta o projeto final a partir de templates/
  gemini.ts      cliente da API Gemini (REST) usado pelo servidor e pela CLI
  zip.ts         o .zip entregue (o mesmo que o CI testa)
  config.ts      modelos Gemini e limites de entrada
cli/           create-gato-pingado (npx); empacotada por scripts/build-cli.ts
src/           Interface (React + Tailwind)
server/        Servidor web (Express): endpoints de geração, a chave fica aqui
src-tauri/     App desktop (Rust): cofre da chave, chamadas Gemini, gravar pasta
templates/     Fonte única dos projetos gerados
  _shared/       arquivos comuns aos três apps
  store/ blog/ travel/
  _features/payments/   camadas aplicadas quando o cliente escolhe pagamentos
scripts/       verify-templates.ts: gera, instala e compila cada variação
tests/         testes (Vitest)
```

Os templates são lidos de `templates/` no build: não existe cópia deles no código.

## Qualidade

```bash
npm run typecheck          # TypeScript do gerador
npm test                   # testes do compositor e da validação
npm run verify:templates   # gera os 6 projetos (3 apps × com/sem pagamento) como .zip,
                           # descompacta, instala, publica num Convex local e roda tsc
npm run verify:templates -- --build   # também roda next build
```

O `verify:templates` sobe um backend Convex local anônimo (sem conta) e não precisa de chaves reais.

## Segurança dos projetos gerados

- Preços e estoque são calculados no servidor; o navegador nunca define o valor cobrado.
- Nenhum dado de cartão passa pelo site: o pagamento acontece no Stripe e é confirmado por webhook assinado.
- Mutations de admin exigem `ADMIN_USER_IDS`; recursos de IA exigem login.
- O servidor do gerador não é um proxy aberto da Gemini: aceita só os pedidos de geração, com entrada validada e limite por IP.

## Licença

MIT
