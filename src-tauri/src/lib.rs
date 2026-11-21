//! Backend do app desktop do Gato Pingado.
//!
//! Só faz o que o navegador não pode fazer com segurança:
//! - guardar a chave Gemini no Gerenciador de Credenciais do Windows;
//! - chamar a API Gemini com essa chave (prompts e schemas vêm da interface, em shared/content.ts);
//! - gravar o projeto gerado direto numa pasta escolhida pelo usuário.

use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use keyring::Entry;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::path::{Component, Path, PathBuf};
use std::sync::LazyLock;
use std::time::Duration;
use tauri_plugin_dialog::DialogExt;

// Mantido como "new-shy" para não perder chaves já salvas no Gerenciador de Credenciais.
const SERVICE_NAME: &str = "new-shy";
const KEY_NAME: &str = "gemini_api_key";
/// Mesmo padrão de shared/config.ts (DEFAULT_TEXT_MODEL).
const TEST_MODEL: &str = "gemini-3.8-flash";
const API_BASE: &str = "https://generativelanguage.googleapis.com/v1beta/models";

static HTTP: LazyLock<reqwest::Client> = LazyLock::new(|| {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(120))
        .build()
        .expect("falha ao criar o cliente HTTP")
});

fn entry() -> Result<Entry, String> {
    Entry::new(SERVICE_NAME, KEY_NAME).map_err(|e| format!("Falha ao acessar o Gerenciador de Credenciais: {e}"))
}

fn saved_key() -> Result<String, String> {
    match entry()?.get_password() {
        Ok(k) if !k.trim().is_empty() => Ok(k),
        Ok(_) | Err(keyring::Error::NoEntry) => Err("Nenhuma chave Gemini salva. Clique em \"Chave Gemini\".".into()),
        Err(e) => Err(format!("Erro ao ler a chave do cofre: {e}")),
    }
}

#[tauri::command]
fn save_api_key(key: String) -> Result<(), String> {
    let key = key.trim();
    if key.is_empty() {
        return Err("A chave não pode estar vazia.".into());
    }
    entry()?.set_password(key).map_err(|e| format!("Erro ao salvar a chave: {e}"))
}

#[tauri::command]
fn has_api_key() -> Result<bool, String> {
    match entry()?.get_password() {
        Ok(k) => Ok(!k.trim().is_empty()),
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(e) => Err(format!("Erro ao acessar o cofre de credenciais: {e}")),
    }
}

#[tauri::command]
fn delete_api_key() -> Result<(), String> {
    match entry()?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(format!("Erro ao remover a chave: {e}")),
    }
}

/// Aceita só nomes de modelo simples (evita montar URLs arbitrárias).
fn check_model(model: &str) -> Result<(), String> {
    let ok = !model.is_empty() && model.len() <= 64 && model.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '.');
    if ok { Ok(()) } else { Err(format!("Nome de modelo inválido: {model}")) }
}

async fn gemini(model: &str, body: Value) -> Result<Value, String> {
    check_model(model)?;
    let key = saved_key()?;
    let resp = HTTP
        .post(format!("{API_BASE}/{model}:generateContent"))
        .header("x-goog-api-key", key)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Falha de conexão com a API Gemini: {e}"))?;
    let status = resp.status();
    if !status.is_success() {
        let text = resp.text().await.unwrap_or_default();
        return Err(match status.as_u16() {
            400 | 401 | 403 => format!("Chave recusada ou requisição inválida (HTTP {status}): {text}"),
            404 => format!("Modelo {model} não encontrado (HTTP 404)."),
            429 => "Cota da API Gemini esgotada (HTTP 429). Aguarde e tente de novo.".into(),
            _ => format!("Erro da API Gemini (HTTP {status}): {text}"),
        });
    }
    resp.json().await.map_err(|e| format!("Resposta inválida da API Gemini: {e}"))
}

fn first_part(resp: &Value) -> Option<&Value> {
    resp["candidates"][0]["content"]["parts"].as_array()?.first()
}

#[tauri::command]
async fn test_api_key() -> Result<String, String> {
    gemini(TEST_MODEL, json!({ "contents": [{ "parts": [{ "text": "Responda apenas OK" }] }] })).await?;
    Ok(format!("Chave válida. Conexão com {TEST_MODEL} funcionando."))
}

/// Gera JSON estruturado: a interface manda prompt e schema, e valida a resposta.
#[tauri::command]
async fn gemini_generate_json(model: String, prompt: String, schema: Value) -> Result<Value, String> {
    let resp = gemini(
        &model,
        json!({
            "contents": [{ "parts": [{ "text": prompt }] }],
            "generationConfig": { "responseMimeType": "application/json", "responseSchema": schema }
        }),
    )
    .await?;
    let text = first_part(&resp).and_then(|p| p["text"].as_str()).ok_or("A IA retornou uma resposta vazia.")?;
    serde_json::from_str(text.trim()).map_err(|e| format!("A IA não retornou JSON válido: {e}"))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct GeneratedImage {
    base64: String,
    mime_type: String,
}

#[tauri::command]
async fn gemini_generate_image(model: String, prompt: String) -> Result<GeneratedImage, String> {
    let resp = gemini(
        &model,
        json!({
            "contents": [{ "parts": [{ "text": prompt }] }],
            "generationConfig": { "responseModalities": ["IMAGE"] }
        }),
    )
    .await?;
    let parts = resp["candidates"][0]["content"]["parts"].as_array().cloned().unwrap_or_default();
    let inline = parts
        .iter()
        .find_map(|p| p.get("inlineData").filter(|d| d["data"].is_string()))
        .ok_or("A IA não retornou imagem.")?;
    Ok(GeneratedImage {
        base64: inline["data"].as_str().unwrap_or_default().to_string(),
        mime_type: inline["mimeType"].as_str().unwrap_or("image/png").to_string(),
    })
}

#[derive(Deserialize)]
struct ProjectFile {
    path: String,
    content: String,
    base64: bool,
}

/// Caminho relativo seguro: sem raiz, sem "..", sem prefixo de drive.
fn safe_relative(path: &str) -> Result<PathBuf, String> {
    let p = Path::new(path);
    let bad_chars = path.contains(':') || path.contains('\\');
    if path.is_empty() || bad_chars || p.components().any(|c| !matches!(c, Component::Normal(_))) {
        return Err(format!("Caminho inválido no projeto: {path}"));
    }
    Ok(p.to_path_buf())
}

/// Pede uma pasta ao usuário e grava o projeto em <pasta>/<folder_name>.
/// Retorna o caminho gravado, ou None se o usuário cancelar.
#[tauri::command]
async fn save_project(app: tauri::AppHandle, folder_name: String, files: Vec<ProjectFile>) -> Result<Option<String>, String> {
    let name = safe_relative(&folder_name)?;
    if name.components().count() != 1 {
        return Err("Nome de pasta inválido.".into());
    }
    let Some(picked) = app.dialog().file().set_title("Onde salvar o projeto?").blocking_pick_folder() else {
        return Ok(None);
    };
    let base = picked.into_path().map_err(|e| format!("Pasta inválida: {e}"))?;
    let target = base.join(&name);
    if target.exists() && target.read_dir().map(|mut d| d.next().is_some()).unwrap_or(true) {
        return Err(format!("A pasta {} já existe e não está vazia.", target.display()));
    }
    for file in files {
        let full = target.join(safe_relative(&file.path)?);
        if let Some(parent) = full.parent() {
            std::fs::create_dir_all(parent).map_err(|e| format!("Erro ao criar {}: {e}", parent.display()))?;
        }
        let bytes = if file.base64 {
            BASE64.decode(file.content.as_bytes()).map_err(|e| format!("Arquivo {} corrompido: {e}", file.path))?
        } else {
            file.content.into_bytes()
        };
        std::fs::write(&full, bytes).map_err(|e| format!("Erro ao gravar {}: {e}", full.display()))?;
    }
    Ok(Some(target.display().to_string()))
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            save_api_key,
            has_api_key,
            delete_api_key,
            test_api_key,
            gemini_generate_json,
            gemini_generate_image,
            save_project
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o Gato Pingado");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejeita_caminhos_perigosos() {
        for bad in ["", "../x", "a/../../b", "/etc/passwd", "C:\\Windows\\x", "C:/x"] {
            assert!(safe_relative(bad).is_err(), "{bad}");
        }
        assert!(safe_relative("src/app/page.tsx").is_ok());
    }

    #[test]
    fn valida_nome_do_modelo() {
        assert!(check_model("gemini-3.8-flash").is_ok());
        assert!(check_model("x/../../evil").is_err());
        assert!(check_model("").is_err());
    }
}
