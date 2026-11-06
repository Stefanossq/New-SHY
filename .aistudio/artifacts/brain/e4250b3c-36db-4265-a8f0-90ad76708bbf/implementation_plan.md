# Plano de Implementação: Modelo BYOK Desktop (Tauri + Windows Credential Manager)

Implementar a arquitetura nativa BYOK (Bring Your Own Key) para a aplicação desktop utilizando **Tauri v2 + Rust**, armazenando a chave da API Gemini com segurança no **Windows Credential Manager** (via crate `keyring`, serviço `new-shy`) e executando chamadas diretas ao Gemini 3.8 Flash no backend Rust, mantendo total compatibilidade retroativa e fallback transparente para o ambiente Web/Dev (`npm run dev`).

---

## Revisão do Usuário & Decisões Confirmadas

> [!IMPORTANT]
> Decisões confirmadas com o usuário na fase de alinhamento:
- **Detecção Híbrida Inteligente**: A aplicação identificará automaticamente se está executando no container Tauri (`window.__TAURI_INTERNALS__`) ou no navegador web (`npm run dev`). Em ambiente web, fará fallback transparente via servidor local/localStorage sem quebrar o fluxo.
- **Sincronização de Chaves**: Ao salvar ou testar a chave no `ApiKeyModal`, o sistema salvará com segurança no keyring do Windows (`new-shy`) no desktop e manterá cópia segura no armazenamento local quando em modo dev.
- **Documentação de Compilação Completa**: Criação de um guia minucioso com pré-requisitos (Visual Studio C++ Build Tools, WiX Toolset v3.14/v4 para `.msi`, NSIS para `.exe`), comandos de build (`npm run tauri build`) e caminhos exatos dos arquivos gerados.

---

## 1. Visão Geral & Arquitetura BYOK

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUITETURA BYOK DESKTOP                        │
├────────────────────────────────────────────────────────────────────────┤
│ FRONTEND (React 19 + Tailwind + Lucide)                                │
│   ├── ApiKeyModal.tsx        (Modal de primeiro acesso / chave)        │
│   ├── App.tsx                (Checagem de has_api_key() ao montar)     │
│   └── lib/aiService.ts       (Ponte invoke <-> fallback HTTP Web)      │
│               │                                   │                    │
│      Se Tauri (Desktop)                    Se Web (Dev Browser)        │
│               ▼                                   ▼                    │
│ BACKEND RUST (src-tauri)               EXPRESS BACKEND (server.ts)     │
│   ├── keyring ("new-shy")                ├── process.env.GEMINI_API_KEY│
│   ├── reqwest (HTTPS direto)             └── GoogleGenAI Node SDK      │
│   │   └─> gemini-3.8-flash                       │                     │
│   └── Tauri Commands (invoke_handler)            │                     │
│               │                                  │                     │
│               └───────────────┬──────────────────┘                     │
│                               ▼                                        │
│                 Google Gemini 3.8 Flash API                            │
│                 (generativelanguage.googleapis.com)                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detalhamento dos Componentes & Tarefas

### Fase 1: Backend Rust (`src-tauri/Cargo.toml` e `src-tauri/src/main.rs`)
1. **Atualização de Dependências em `src-tauri/Cargo.toml`**:
   - `reqwest = { version = "0.12", features = ["json"] }`
   - `keyring = "2"` (ou `3` compatível com Windows Credential Manager)
   - `serde = { version = "1.0", features = ["derive"] }`
   - `serde_json = "1.0"`
   - `tokio = { version = "1", features = ["full"] }`

2. **Implementação dos Comandos Tauri em `src-tauri/src/main.rs`**:
   - Serviço keyring: `"new-shy"`, usuário `"default_user"`.
   - `save_api_key(key: String) -> Result<(), String>`: Grava no Windows Credential Manager.
   - `has_api_key() -> bool`: Verifica se a chave existe e é válida.
   - `delete_api_key() -> Result<(), String>`: Remove a credencial.
   - `test_api_key() -> Result<String, String>`: Executa requisição mínima de teste ao Gemini 3.8 Flash com prompt `"teste"` e retorna status.
   - `generate_store_products(theme: String) -> Result<Value, String>`: POST para `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=...`, parseia o array de 4 produtos em JSON e retorna o objeto `Value`.
   - `generate_blog_news(topic: String) -> Result<Value, String>`: Gera dados estruturados para posts e notícias do blog.
   - `generate_travel_plan(destination: String, days: u32) -> Result<Value, String>`: Gera roteiro estruturado por dias.
   - Registro de todos os comandos no `tauri::generate_handler![...]`.

3. **Configuração de Permissões e Rede (`src-tauri/tauri.conf.json`)**:
   - Configurar CSP e permissões de rede HTTP seguras para o endpoint `https://generativelanguage.googleapis.com/**`.

---

### Fase 2: Frontend & Experiência de Usuário

1. **Componente `components/ApiKeyModal.tsx`**:
   - Modal com design profissional dark slate e zero-pill discipline.
   - Campo de entrada com máscara de senha e botão para alternar visualização.
   - Botão **"Testar Conexão"** com feedback em tempo real (spinner, sucesso verde ou erro detalhado).
   - Botão **"Salvar no Cofre do Windows"** com persistência segura.
   - Tratamento de status: Chave inválida (400/403), Sem internet / Falha de rede, Quota excedida (429).

2. **Adaptação em `lib/aiService.ts`**:
   - Função utilitária `invokeTauri<T>(command: string, args?: any): Promise<T | null>`.
   - Métodos `hasApiKey()`, `saveApiKey()`, `testApiKey()`.
   - No método `generateProducts(theme)`:
     - Se `PlatformAdapter.isTauriApp()` for verdadeiro, invoca `invoke('generate_store_products', { theme })`.
     - Caso contrário ou em caso de erro, recorre ao endpoint de fallback `/api/ai/products` existente no `server.ts`.
     - Mapeia avisos claros de cota ou rede para a UI sem travar o gerador.

3. **Integração no `App.tsx`**:
   - `useEffect` na montagem do app chamando `hasApiKey()`.
   - Se retornar `false`, abre imediatamente o `ApiKeyModal` antes de prosseguir com o fluxo de scaffolding.
   - Adicionado botão de atalho no cabeçalho (ao lado de Configurações) para alterar ou testar a chave a qualquer momento.

---

### Fase 3: Validação, Compatibilidade Web & Guia de Build Windows

1. **Validação de Retrocompatibilidade (`npm run dev` e `npm test`)**:
   - Garantir que o ambiente web no browser continue 100% operacional através do proxy `server.ts`.
   - Executar os testes automatizados (`npm test`) para garantir zero quebras.
   - Executar `npm run build` do frontend Vite.

2. **Criação do Guia Detalhado de Compilação Desktop (`DESKTOP_BUILD_GUIDE.md`)**:
   - Passo a passo completo no Windows 10/11:
     1. Instalação do Rust e Cargo (`rustup-init.exe`).
     2. Instalação do Visual Studio C++ Build Tools.
     3. Instalação do WiX Toolset para geração do instalador `.msi`.
     4. Execução de `npm run tauri build`.
     5. Localização exata dos artefatos: `src-tauri/target/release/bundle/nsis/*.exe` e `src-tauri/target/release/bundle/msi/*.msi`.
