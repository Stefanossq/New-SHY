# 🚀 Guia de Empacotamento do Executável (.exe)
Este projeto está arquitetado para funcionar tanto na Web quanto como um **programa desktop `.exe` nativo de alto desempenho** para Windows através do **Tauri v2**.

---

## 📋 Pré-requisitos na Máquina do Desenvolvedor (Windows)

1. **Node.js (v18+) e NPM**:
   - `node -v`
2. **Rust Toolchain**:
   - Baixe e instale pelo instalador oficial: [rustup.rs](https://rustup.rs)
3. **Microsoft C++ Build Tools**:
   - Baixe o *Visual Studio Installer* e marque a opção: **"Desenvolvimento para Desktop com C++"** (*Desktop development with C++*).

---

## 🛠️ Passo a Passo para Gerar o `.exe`

Abra o terminal na raiz deste projeto:

### 1. Instalar as dependências do projeto
```bash
npm install
```

### 2. Testar o aplicativo em modo Desktop (Desenvolvimento com Hot-Reload)
```bash
npx tauri dev
```
*O Tauri abrirá uma janela nativa do Windows rodando a interface React com aceleração de hardware WebView2.*

### 3. Compilar o `.exe` Independente para Produção
```bash
npx tauri build
```

O compilador Rust irá gerar os instaladores e o binário independente nos seguintes diretórios:
- **Executável direto (.exe)**: `src-tauri/target/release/saas-prototype-engine.exe`
- **Instalador com Assistente (.msi / setup.exe)**: `src-tauri/target/release/bundle/msi/`

---

## 🌐 Como Separar os Repositórios de Templates no GitHub

Para manter o `.exe` leve (~12 MB) e permitir adicionar novos templates sem recompilar o programa:

1. **Crie um repositório no seu GitHub para cada template**:
   - Exemplo: `https://github.com/seu-usuario/template-ecommerce-convex`
2. **Adicione um arquivo `blueprint.json` na raiz de cada repositório**:
   ```json
   {
     "templateId": "convex-ecommerce-v1",
     "name": "E-Commerce Next.js + Convex",
     "version": "1.0.0",
     "description": "Template desacoplado com banco Convex",
     "injectionPoints": [
       {
         "filePath": "convex/products.ts",
         "strategy": "inject-database-schema",
         "marker": "/* __AI_PRODUCTS_INJECTION_POINT__ */"
       }
     ]
   }
   ```
3. **No painel "Registro de Templates"**:
   - O criador insere a URL do repositório.
   - O aplicativo faz o stream do template sob demanda e injeta as regras de negócio!
