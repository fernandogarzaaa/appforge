use std::fs;
use std::path::{Path, PathBuf};

/// The Quantum Oracle Logic Validator
/// Enforces immutable laws on AI-generated code.
pub struct QuantumOracle;

impl QuantumOracle {
    /// Validate the provided code against core logic laws and dynamic antibodies.
    pub fn validate(code: &str) -> Result<(), String> {
        // LAW 1: NO UNSAFE FS IN BROWSER
        if code.contains("fs.") && code.contains("React") {
            return Err("VIO_01: Memory Safety Violation - Browser FS Access.".to_string());
        }

        // LAW 2: ATOMICITY
        if code.contains("Transaction") && !code.contains("confirm") {
            return Err("VIO_02: Atomic Failure - Unconfirmed Transaction found.".to_string());
        }

        // DYNAMIC VALIDATION: Scan for generated antibodies
        // Note: Paths are relative to the project root where qcore is executed
        let dynamic_dir = "src/swarm/oracle/dynamic_tests";
        if Path::new(dynamic_dir).exists() {
            if let Ok(entries) = fs::read_dir(dynamic_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().and_then(|s| s.to_str()) == Some("rs") {
                        if let Ok(test_content) = fs::read_to_string(&path) {
                            let tc: &str = &test_content;
                            if let Some(start) = tc.find("code.contains(\"") {
                                let rest = &tc[start + 15..];
                                if let Some(end) = rest.find("\")") {
                                    let pattern = &rest[..end];
                                    if code.contains(pattern) {
                                        return Err(format!("VIO_DYNAMIC: Recursive Rejection - Pattern '{}' found in dynamic law.", pattern));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        Ok(())
    }
}
