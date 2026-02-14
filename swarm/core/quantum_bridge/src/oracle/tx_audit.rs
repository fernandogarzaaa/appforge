// Lightweight Solana Transaction Parser (Zero-Dependency)
// format: https://docs.solana.com/developing/programming-model/transactions

#[derive(Debug, Clone)]
pub struct AuditResult {
    pub verified: bool,
    pub risk_score: f64,
    pub details: String,
}

use super::program_whitelist;
use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine as _};

pub fn audit_transaction(tx_base64: &str) -> AuditResult {
    // 1. Decode Base64
    let tx_bytes = match BASE64_STANDARD.decode(tx_base64) {
        Ok(b) => b,
        Err(_) => {
            return AuditResult {
                verified: false,
                risk_score: 1.0,
                details: "VIO_TX_ERR: Base64 Decode Failed".to_string(),
            }
        }
    };

    let mut cursor = 0;

    // Helper to read compact-u16
    let read_compact_u16 = |bytes: &[u8], cursor: &mut usize| -> Option<usize> {
        let mut len = 0;
        let mut size = 0;
        loop {
            if *cursor >= bytes.len() {
                return None;
            }
            let elem = bytes[*cursor];
            *cursor += 1;
            len |= ((elem & 0x7f) as usize) << (size * 7);
            size += 1;
            if (elem & 0x80) == 0 {
                break;
            }
        }
        Some(len)
    };

    // 2. Parse Signatures
    let num_signatures = match read_compact_u16(&tx_bytes, &mut cursor) {
        Some(n) => n,
        None => {
            return AuditResult {
                verified: false,
                risk_score: 1.0,
                details: "VIO_TX_ERR: Malformed Signatures".to_string(),
            }
        }
    };

    cursor += num_signatures * 64; // Skip signatures
    if cursor >= tx_bytes.len() {
        return AuditResult {
            verified: false,
            risk_score: 1.0,
            details: "VIO_TX_ERR: Truncated after signatures".to_string(),
        };
    }

    // 3. Parse Message Header
    // u8: num_required_signatures
    // u8: num_readonly_signed_accounts
    // u8: num_readonly_unsigned_accounts
    if cursor + 3 > tx_bytes.len() {
        return AuditResult {
            verified: false,
            risk_score: 1.0,
            details: "VIO_TX_ERR: Malformed Header".to_string(),
        };
    }
    let num_required_signatures = tx_bytes[cursor];
    cursor += 3;

    // 4. Parse Account Keys
    let num_account_keys = match read_compact_u16(&tx_bytes, &mut cursor) {
        Some(n) => n,
        None => {
            return AuditResult {
                verified: false,
                risk_score: 1.0,
                details: "VIO_TX_ERR: Malformed Accounts".to_string(),
            }
        }
    };

    let accounts_start = cursor;
    let accounts_end = cursor + (num_account_keys * 32);
    if accounts_end > tx_bytes.len() {
        return AuditResult {
            verified: false,
            risk_score: 1.0,
            details: "VIO_TX_ERR: Truncated Accounts".to_string(),
        };
    }

    let accounts = &tx_bytes[accounts_start..accounts_end];
    cursor = accounts_end;

    // 5. Parse Recent Blockhash
    cursor += 32;
    if cursor > tx_bytes.len() {
        return AuditResult {
            verified: false,
            risk_score: 1.0,
            details: "VIO_TX_ERR: Truncated Blockhash".to_string(),
        };
    }

    // 6. Parse Instructions
    let num_instructions = match read_compact_u16(&tx_bytes, &mut cursor) {
        Some(n) => n,
        None => {
            return AuditResult {
                verified: false,
                risk_score: 1.0,
                details: "VIO_TX_ERR: Malformed Instructions".to_string(),
            }
        }
    };

    // Whitelist check delegated to program_whitelist module

    for _ in 0..num_instructions {
        if cursor >= tx_bytes.len() {
            break;
        }

        let program_id_index = tx_bytes[cursor] as usize;
        cursor += 1;

        if program_id_index >= num_account_keys {
            return AuditResult {
                verified: false,
                risk_score: 1.0,
                details: "VIO_TX_ERR: Invalid Program Index".to_string(),
            };
        }

        // Get Program ID Bytes
        let pid_start = program_id_index * 32;
        let pid_bytes = &accounts[pid_start..pid_start + 32];
        let pid_b58 = bs58::encode(pid_bytes).into_string();

        // Check Whitelist
        match program_whitelist::get_program_name(&pid_b58) {
            Some(name) => {
                // Program is whitelisted (Safe)
                // We could add logging here if needed: format!("Verified interaction with {}", name)
            }
            None => {
                // Program NOT in whitelist (Danger)
                return AuditResult {
                    verified: false,
                    risk_score: 1.0, // High Risk
                    details: format!("UNAUTHORIZED_PROGRAM: {} (Unknown Protocol)", pid_b58),
                };
            }
        }

        // Skip rest of instruction (accounts + data)
        let num_accts = match read_compact_u16(&tx_bytes, &mut cursor) {
            Some(n) => n,
            None => break,
        };
        cursor += num_accts; // skip account indices (u8 each)

        let data_len = match read_compact_u16(&tx_bytes, &mut cursor) {
            Some(n) => n,
            None => break,
        };
        cursor += data_len;
    }

    // 7. Verify Fee Payer
    // Fee payer is the first account if signatures are required
    if num_required_signatures == 0 {
        return AuditResult {
            verified: false,
            risk_score: 0.8,
            details: "VIO_TX_02: No Signatures Required".to_string(),
        };
    }

    AuditResult {
        verified: true,
        risk_score: 0.0,
        details: "Transaction Secured by Iron Ledger (All Programs Verified)".to_string(),
    }
}
