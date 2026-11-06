# 🖥️ Guia de Compilação Desktop (Tauri v2 + Windows BYOK)

Este documento contém o passo a passo completo para compilar o executável portátil (`.exe`) e o instalador oficial do Windows (`.msi` / NSIS) utilizando o modelo seguro **BYOK (Bring Your Own Key)** com o **Windows Credential Manager**.

---

## 1. Migrando do Modo Dev (.env) para o Executável (.exe)

- **Modo Web Dev (`npm run dev`)**:
  - A chave de API do Gemini vem exclusivamente da variável `GEMINI_API_KEY` configurada no `.env` do backend (`server.ts`).
  - No modo Web, o modal `ApiKeyModal` **não é exibido** e nenhuma chave é gravada no `localStorage` do navegador.
- **Modo Desktop Produção (`.exe` / `.msi`)**:
  - O arquivo `.env` **não é embutido e não é lido pelo executável** (por razões de segurança, para não vazar credenciais no binário distribuído para o cliente).
  - Ao abrir o aplicativo desktop pela primeira vez, o `ApiKeyModal` é exibido automaticamente uma única vez.
  - O usuário cola sua chave pessoal do Google AI Studio, clica em **"Salvar no Cofre"**, e ela é gravada diretamente no **Windows Credential Manager** (sob o serviço `new-shy`).
  - Nas execuções seguintes, o aplicativo lê a credencial do cofre do sistema de forma silenciosa e automática.

---

## 2. Pré-Requisitos no Windows 10/11

Antes de compilar no seu computador ou máquina de build Windows, instale os seguintes componentes:

### A. Ferramentas do Compilador C++ (Visual Studio Build Tools)
1. Baixe o instalador do [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
2. No instalador, marque a carga de trabalho:
   - **Desenvolvimento para desktop com C++** (Desktop development with C++).
   - Componentes incluídos: Compilador MSVC, Windows 10/11 SDK e ferramentas CMake.

### B. Rust & Cargo
1. Baixe o [rustup-init.exe](https://rustup.rs/) e execute.
2. Selecione a opção padrão (1 - default installation).
3. Abra um novo terminal PowerShell e valide:
   ```powershell
   rustc --version
   cargo --version
   ```

### C. WiX Toolset (Obrigatório para gerar o instalador corporativo `.msi`)
1. Baixe e instale o [WiX Toolset v3.14 ou v4](https://wixtoolset.org/releases/).
2. Certifique-se de que os executáveis `candle.exe` e `light.exe` estejam no `PATH` do sistema Windows.

### D. Node.js (v18+)
```powershell
node --version
npm --version
```

---

## 3. Passo a Passo de Compilação

Na pasta raiz do projeto clonado no seu Windows:

### Passo 1: Instalar dependências Node
```powershell
npm install
```

### Passo 2: Executar no modo de desenvolvimento Desktop (Hot Reload)
```powershell
npm run tauri dev
```

### Passo 3: Gerar os Ícones da Aplicação (Obrigatório para o Bundle)
Como o empacotador do instalador (`.msi` / NSIS) exige os arquivos de ícone configurados na seção `bundle.icon`, gere o conjunto completo a partir de uma imagem PNG quadrada (recomendado 1024x1024):
```powershell
# Cria automaticamente icons/32x32.png, 128x128.png, icon.ico, etc.
npx @tauri-apps/cli icon caminho/para/seu-logo-1024x1024.png
# Ou via npm script caso configurado:
npm run tauri icon caminho/para/seu-logo-1024x1024.png
```

### Passo 4: Gerar o Executável Standalone e Instaladores
Para compilar a versão final de produção otimizada:
```powershell
npm run tauri build
```

---

## 4. Onde Ficam os Arquivos Gerados?

Após a conclusão do comando `npm run tauri build`, todos os instaladores e binários estarão na pasta:

```
src-tauri/target/release/
├── saas-prototype-engine.exe          <- Executável standalone direto
└── bundle/
    ├── nsis/
    │   └── SaaS Prototype Engine_1.0.0_x64-setup.exe   <- Instalador executável padrão (NSIS)
    └── msi/
        └── SaaS Prototype Engine_1.0.0_x64_en-US.msi   <- Instalador corporativo Windows (.msi)
```

---

## 5. Como Funciona a Segurança BYOK no Rust

- **Header Seguro**: Todas as chamadas para o Gemini utilizam o header HTTP:
  ```http
  x-goog-api-key: <chave-do-cofre>
  ```
  A chave **nunca é incluída na URL** como parâmetro `?key=`.
- **Chamadas de Rede 100% Nativas no Rust**:
  - As requisições HTTPS para `https://generativelanguage.googleapis.com` são efetuadas exclusivamente pelo backend Rust utilizando o crate `reqwest` com `rustls-tls`.
  - Por essa razão, **não é necessário configurar CSP** no `tauri.conf.json` para o domínio do Gemini, mantendo o frontend isolado contra injeções.
- **Serviço do Windows**:
  - Serviço: `new-shy`
  - Conta: `gemini_api_key`
  - Acesso através do crate Rust `keyring = "3"`.
- **Remoção de Chave**:
  - O usuário pode remover sua chave a qualquer momento clicando no botão **"Remover Chave Salva"** no `ApiKeyModal`, que invoca o comando `delete_api_key()`.
