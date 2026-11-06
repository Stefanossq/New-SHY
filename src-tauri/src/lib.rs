use keyring::Entry;
use serde_json::{json, Value};
use std::sync::LazyLock;
use std::time::Duration;

const SERVICE_NAME: &str = "new-shy";
const USER_KEY_NAME: &str = "gemini_api_key";
const GEMINI_API_ENDPOINT: &str = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";

static HTTP_CLIENT: LazyLock<reqwest::Client> = LazyLock::new(|| {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(60))
        .build()
        .expect("Falha ao inicializar cliente HTTP com certificados nativos")
});

/// Retorna uma referência estática ao cliente HTTP compartilhado
fn get_http_client() -> &'static reqwest::Client {
    &HTTP_CLIENT
}

/// Recupera a chave salva no keyring ou propaga erro explícito
fn get_saved_key() -> Result<String, String> {
    let entry = Entry::new(SERVICE_NAME, USER_KEY_NAME)
        .map_err(|e| format!("Falha ao inicializar acesso ao Windows Credential Manager: {}", e))?;
    entry
        .get_password()
        .map_err(|e| format!("Chave não encontrada no cofre seguro: {}", e))
}

/// Salva a chave de API no Windows Credential Manager via keyring
#[tauri::command]
pub fn save_api_key(key: String) -> Result<(), String> {
    let trimmed = key.trim();
    if trimmed.is_empty() {
        return Err("A chave de API não pode estar vazia.".to_string());
    }
    let entry = Entry::new(SERVICE_NAME, USER_KEY_NAME)
        .map_err(|e| format!("Erro ao inicializar entrada no Windows Credential Manager: {}", e))?;
    entry
        .set_password(trimmed)
        .map_err(|e| format!("Erro ao salvar chave no cofre seguro: {}", e))
}

/// Verifica se já existe uma chave salva e válida.
/// Retorna Result<bool, String> para não mascarar falhas do Windows Credential Manager como 'sem chave'.
#[tauri::command]
pub fn has_api_key() -> Result<bool, String> {
    let entry = Entry::new(SERVICE_NAME, USER_KEY_NAME)
        .map_err(|e| format!("Falha ao conectar ao Windows Credential Manager: {}", e))?;
    
    match entry.get_password() {
        Ok(k) => Ok(!k.trim().is_empty()),
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(e) => Err(format!("Erro ao acessar cofre seguro de credenciais: {}", e)),
    }
}

/// Remove a chave de API salva no Windows Credential Manager.
/// Deletar credencial inexistente (NoEntry) é tratado como sucesso Ok(()).
#[tauri::command]
pub fn delete_api_key() -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, USER_KEY_NAME)
        .map_err(|e| format!("Erro ao inicializar entrada no cofre: {}", e))?;
    match entry.delete_password() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(format!("Erro ao remover chave do cofre seguro: {}", e)),
    }
}

/// Faz uma chamada mínima ao Gemini para validar se a chave funciona e tem cota
/// Header: x-goog-api-key: <chave> (sem parâmetros na URL)
#[tauri::command]
pub async fn test_api_key() -> Result<String, String> {
    let key = get_saved_key()?;
    let client = get_http_client();

    let payload = json!({
        "contents": [{
            "parts": [{ "text": "Responda apenas com a palavra 'OK'" }]
        }],
        "generationConfig": {
            "maxOutputTokens": 10
        }
    });

    let resp = client
        .post(GEMINI_API_ENDPOINT)
        .header("Content-Type", "application/json")
        .header("User-Agent", "aistudio-build-desktop")
        .header("x-goog-api-key", &key)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Erro de conexão de rede ao testar chave: {}", e))?;

    let status = resp.status();
    if status.is_success() {
        Ok("Conexão validada com sucesso! A chave Gemini está pronta para uso.".to_string())
    } else {
        let err_body = resp.text().await.unwrap_or_default();
        eprintln!("[Gemini] Status {}: {}", status, err_body);
        if status.as_u16() == 400 || status.as_u16() == 403 {
            Err(format!("Chave de API inválida ou sem permissão (Status {}). Verifique se a chave do Google AI Studio está correta.", status))
        } else if status.as_u16() == 429 {
            Err("Cota de requisições excedida na API Gemini (Status 429). Aguarde alguns instantes.".to_string())
        } else {
            Err(format!("Erro retornado pela API Gemini (Status {}): {}", status, err_body))
        }
    }
}

/// Gera produtos estruturados para o template de E-commerce
/// Header: x-goog-api-key: <chave> (sem query param)
/// generationConfig: responseMimeType e responseSchema estruturado espelhado de server.ts
#[tauri::command]
pub async fn generate_store_products(theme: String) -> Result<Value, String> {
    let key = get_saved_key()?;
    let client = get_http_client();

    let prompt = format!(
        "Gere uma lista de 4 produtos comerciais originais e realistas para uma loja online sobre '{}'. \
        Retorne preços realistas em BRL, descrições persuasivas e estoques coerentes.",
        theme
    );

    let payload = json!({
        "contents": [{
            "parts": [{ "text": prompt }]
        }],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "name":        { "type": "STRING" },
                        "price":       { "type": "NUMBER" },
                        "description": { "type": "STRING" },
                        "category":    { "type": "STRING" },
                        "stock":       { "type": "INTEGER" }
                    },
                    "required": ["name", "price", "description", "category", "stock"]
                }
            }
        }
    });

    let resp = client
        .post(GEMINI_API_ENDPOINT)
        .header("Content-Type", "application/json")
        .header("User-Agent", "aistudio-build-desktop")
        .header("x-goog-api-key", &key)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Falha de conexão com a API Gemini: {}", e))?;

    let status = resp.status();
    if !status.is_success() {
        let err_text = resp.text().await.unwrap_or_default();
        eprintln!("[Gemini] Status {}: {}", status, err_text);
        if status.as_u16() == 429 {
            return Err("Cota de requisições excedida na API Gemini (Status 429). Tente novamente mais tarde.".to_string());
        }
        if status.as_u16() == 400 || status.as_u16() == 403 {
            return Err(format!("Chave Gemini recusada pela API (Status {}). Verifique as permissões da chave.", status));
        }
        return Err(format!("Erro da API Gemini (Status {}): {}", status, err_text));
    }

    let json_resp: Value = resp
        .json()
        .await
        .map_err(|e| format!("Erro ao parsear resposta da API Gemini: {}", e))?;

    let raw_text = json_resp["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .unwrap_or("[]");

    let clean_json = raw_text.trim().trim_start_matches("```json").trim_start_matches("```").trim_end_matches("```").trim();
    let parsed: Value = serde_json::from_str(clean_json)
        .map_err(|e| format!("Falha ao parsear produtos em JSON: {} (Texto bruto: {})", e, clean_json))?;

    Ok(parsed)
}

/// Gera notícias/posts estruturados para o template de Blog
/// Header: x-goog-api-key: <chave>
/// generationConfig: responseMimeType e responseSchema estruturado para artigos do blog
#[tauri::command]
pub async fn generate_blog_news(topic: String) -> Result<Value, String> {
    let key = get_saved_key()?;
    let client = get_http_client();

    let prompt = format!(
        "Gere 3 artigos ou notícias completas e estruturadas para um blog moderno sobre '{}'.",
        topic
    );

    let payload = json!({
        "contents": [{
            "parts": [{ "text": prompt }]
        }],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "title":   { "type": "STRING" },
                        "slug":    { "type": "STRING" },
                        "summary": { "type": "STRING" },
                        "content": { "type": "STRING" },
                        "author":  { "type": "STRING" }
                    },
                    "required": ["title", "slug", "summary", "content", "author"]
                }
            }
        }
    });

    let resp = client
        .post(GEMINI_API_ENDPOINT)
        .header("Content-Type", "application/json")
        .header("User-Agent", "aistudio-build-desktop")
        .header("x-goog-api-key", &key)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Falha de conexão com Gemini: {}", e))?;

    let status = resp.status();
    if !status.is_success() {
        let err_text = resp.text().await.unwrap_or_default();
        eprintln!("[Gemini] Status {}: {}", status, err_text);
        if status.as_u16() == 429 {
            return Err("Cota de requisições excedida na API Gemini (Status 429). Tente novamente mais tarde.".to_string());
        }
        if status.as_u16() == 400 || status.as_u16() == 403 {
            return Err(format!("Chave Gemini recusada pela API (Status {}).", status));
        }
        return Err(format!("Erro da API Gemini (Status {}): {}", status, err_text));
    }

    let json_resp: Value = resp
        .json()
        .await
        .map_err(|e| format!("Erro ao parsear resposta: {}", e))?;

    let raw_text = json_resp["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .unwrap_or("[]");

    let clean = raw_text.trim().trim_start_matches("```json").trim_start_matches("```").trim_end_matches("```").trim();
    let parsed: Value = serde_json::from_str(clean)
        .map_err(|e| format!("Falha ao parsear blog news em JSON: {} (Texto bruto: {})", e, clean))?;

    Ok(parsed)
}

/// Gera roteiro inteligente para o template de Viagens
/// Header: x-goog-api-key: <chave>
/// generationConfig: responseMimeType e responseSchema estruturado por dias
#[tauri::command]
pub async fn generate_travel_plan(destination: String, days: u32) -> Result<Value, String> {
    if days < 1 || days > 30 {
        return Err("Número de dias deve estar entre 1 e 30.".to_string());
    }

    let key = get_saved_key()?;
    let client = get_http_client();

    let prompt = format!(
        "Crie um roteiro de viagem detalhado de {} dias para o destino '{}'.",
        days, destination
    );

    let payload = json!({
        "contents": [{
            "parts": [{ "text": prompt }]
        }],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "day":       { "type": "INTEGER" },
                        "title":     { "type": "STRING" },
                        "morning":   { "type": "STRING" },
                        "afternoon": { "type": "STRING" },
                        "evening":   { "type": "STRING" }
                    },
                    "required": ["day", "title", "morning", "afternoon", "evening"]
                }
            }
        }
    });

    let resp = client
        .post(GEMINI_API_ENDPOINT)
        .header("Content-Type", "application/json")
        .header("User-Agent", "aistudio-build-desktop")
        .header("x-goog-api-key", &key)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Falha de conexão com Gemini: {}", e))?;

    let status = resp.status();
    if !status.is_success() {
        let err_text = resp.text().await.unwrap_or_default();
        eprintln!("[Gemini] Status {}: {}", status, err_text);
        if status.as_u16() == 429 {
            return Err("Cota de requisições excedida na API Gemini (Status 429). Tente novamente mais tarde.".to_string());
        }
        if status.as_u16() == 400 || status.as_u16() == 403 {
            return Err(format!("Chave Gemini recusada pela API (Status {}).", status));
        }
        return Err(format!("Erro da API Gemini (Status {}): {}", status, err_text));
    }

    let json_resp: Value = resp
        .json()
        .await
        .map_err(|e| format!("Erro ao parsear resposta: {}", e))?;

    let raw_text = json_resp["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .unwrap_or("[]");

    let clean = raw_text.trim().trim_start_matches("```json").trim_start_matches("```").trim_end_matches("```").trim();
    let parsed: Value = serde_json::from_str(clean)
        .map_err(|e| format!("Falha ao parsear roteiro em JSON: {} (Texto bruto: {})", e, clean))?;

    Ok(parsed)
}

/// Função de entrada principal da biblioteca Tauri v2
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save_api_key,
            has_api_key,
            delete_api_key,
            test_api_key,
            generate_store_products,
            generate_blog_news,
            generate_travel_plan
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
