use serde::Deserialize;
use serde_json;
use std::collections::HashMap;
use std::fs;

#[derive(Deserialize)]
struct WhitelistConfig {
    verified_programs: HashMap<String, String>,
}

pub fn get_allowed_programs() -> HashMap<String, String> {
    // 1. Default Hardcoded Whitelist (Fallback)
    let mut allowed = HashMap::new();
    allowed.insert(
        "11111111111111111111111111111111".to_string(),
        "System Program".to_string(),
    );
    allowed.insert(
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA".to_string(),
        "Token Program".to_string(),
    );
    allowed.insert(
        "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcQb".to_string(),
        "Memo Program".to_string(),
    );
    allowed.insert(
        "675kPX9PXcDuuvPsdr7ZUfJ5vJ673GBNbCGS08v5qFj".to_string(),
        "Raydium V4".to_string(),
    );
    allowed.insert(
        "JUP6LkbZbjS1jKKccwgwsS16SjyTdfYJ837f48M8h77".to_string(),
        "Jupiter V6".to_string(),
    );

    // 2. Load from whitelist.json (Dynamic)
    let paths = vec!["whitelist.json", "../../../whitelist.json"];

    for path in paths {
        if let Ok(content) = fs::read_to_string(path) {
            if let Ok(config) = serde_json::from_str::<WhitelistConfig>(&content) {
                println!(
                    "🛡️ Loaded Dynamic Whitelist from {}: {} programs",
                    path,
                    config.verified_programs.len()
                );
                for (id, name) in config.verified_programs {
                    allowed.insert(id, name);
                }
                break;
            }
        }
    }

    allowed
}

pub fn get_program_name(program_id: &str) -> Option<String> {
    let allowed = get_allowed_programs();
    allowed.get(program_id).cloned()
}
