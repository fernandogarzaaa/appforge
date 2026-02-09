//! Enterprise Security Module - Rust/WebAssembly
//!
//! Phase 3: Enterprise Features
//! - RBAC permission evaluation
//! - Token validation
//! - Rate limiting
//! - Audit log processing

use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use wasm_bindgen::prelude::*;

// ============================================================
// RBAC Permission Evaluation
// ============================================================

/// Permission check result
#[wasm_bindgen]
#[derive(Clone)]
pub struct PermissionResult {
    allowed: bool,
    matched_role: String,
    reason: String,
}

#[wasm_bindgen]
impl PermissionResult {
    #[wasm_bindgen(getter)]
    pub fn allowed(&self) -> bool {
        self.allowed
    }

    #[wasm_bindgen(getter)]
    pub fn matched_role(&self) -> String {
        self.matched_role.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn reason(&self) -> String {
        self.reason.clone()
    }
}

/// Evaluate RBAC permission
/// roles_csv: "admin,editor,viewer"
/// permissions_csv: "admin:create,admin:delete,editor:create,viewer:read"
/// required_permission: "create"
#[wasm_bindgen]
pub fn evaluate_permission(
    user_roles_csv: &str,
    role_permissions_csv: &str,
    required_permission: &str,
) -> PermissionResult {
    let user_roles: HashSet<&str> = user_roles_csv.split(',').map(|s| s.trim()).collect();

    // Parse role:permission pairs
    for pair in role_permissions_csv.split(',') {
        let parts: Vec<&str> = pair.split(':').collect();
        if parts.len() == 2 {
            let role = parts[0].trim();
            let permission = parts[1].trim();

            if user_roles.contains(role) && permission == required_permission {
                return PermissionResult {
                    allowed: true,
                    matched_role: role.to_string(),
                    reason: format!("Role '{}' has permission '{}'", role, permission),
                };
            }
        }
    }

    PermissionResult {
        allowed: false,
        matched_role: String::new(),
        reason: format!("No role grants permission '{}'", required_permission),
    }
}

/// Check if user has any of required permissions (OR logic)
#[wasm_bindgen]
pub fn has_any_permission(
    user_roles_csv: &str,
    role_permissions_csv: &str,
    required_permissions_csv: &str,
) -> bool {
    for permission in required_permissions_csv.split(',') {
        let result = evaluate_permission(user_roles_csv, role_permissions_csv, permission.trim());
        if result.allowed {
            return true;
        }
    }
    false
}

/// Check if user has all required permissions (AND logic)
#[wasm_bindgen]
pub fn has_all_permissions(
    user_roles_csv: &str,
    role_permissions_csv: &str,
    required_permissions_csv: &str,
) -> bool {
    for permission in required_permissions_csv.split(',') {
        let result = evaluate_permission(user_roles_csv, role_permissions_csv, permission.trim());
        if !result.allowed {
            return false;
        }
    }
    true
}

// ============================================================
// Rate Limiting
// ============================================================

/// Rate limit check result
#[wasm_bindgen]
#[derive(Clone)]
pub struct RateLimitResult {
    allowed: bool,
    remaining: u32,
    retry_after_seconds: u32,
}

#[wasm_bindgen]
impl RateLimitResult {
    #[wasm_bindgen(getter)]
    pub fn allowed(&self) -> bool {
        self.allowed
    }

    #[wasm_bindgen(getter)]
    pub fn remaining(&self) -> u32 {
        self.remaining
    }

    #[wasm_bindgen(getter)]
    pub fn retry_after_seconds(&self) -> u32 {
        self.retry_after_seconds
    }
}

/// Check rate limit using sliding window algorithm
/// request_timestamps_csv: comma-separated Unix timestamps
/// window_seconds: time window for rate limiting
/// max_requests: maximum requests allowed in window
/// current_time: current Unix timestamp
#[wasm_bindgen]
pub fn check_rate_limit(
    request_timestamps_csv: &str,
    window_seconds: u32,
    max_requests: u32,
    current_time: u64,
) -> RateLimitResult {
    let window_start = current_time.saturating_sub(window_seconds as u64);

    let recent_requests: Vec<u64> = request_timestamps_csv
        .split(',')
        .filter_map(|s| s.trim().parse().ok())
        .filter(|&ts| ts >= window_start)
        .collect();

    let request_count = recent_requests.len() as u32;

    if request_count >= max_requests {
        // Find oldest request to calculate retry_after
        let oldest = *recent_requests.iter().min().unwrap_or(&current_time);
        let retry_after = (oldest + window_seconds as u64).saturating_sub(current_time) as u32;

        return RateLimitResult {
            allowed: false,
            remaining: 0,
            retry_after_seconds: retry_after.max(1),
        };
    }

    RateLimitResult {
        allowed: true,
        remaining: max_requests - request_count,
        retry_after_seconds: 0,
    }
}

// ============================================================
// Audit Log Processing
// ============================================================

/// Parse and validate audit log entry
#[wasm_bindgen]
pub fn validate_audit_entry(user_id: &str, action: &str, resource: &str, timestamp: u64) -> bool {
    // Validate required fields
    if user_id.is_empty() || action.is_empty() || resource.is_empty() {
        return false;
    }

    // Validate timestamp (not in future, not too old)
    let now = js_sys::Date::now() as u64 / 1000;
    if timestamp > now + 60 || timestamp < now.saturating_sub(365 * 24 * 60 * 60) {
        return false;
    }

    // Validate action format
    let valid_actions = [
        "create", "read", "update", "delete", "login", "logout", "export",
    ];
    valid_actions.iter().any(|&a| action.starts_with(a))
}

/// Calculate audit risk score
#[wasm_bindgen]
pub fn calculate_audit_risk_score(
    action: &str,
    is_sensitive_resource: bool,
    is_outside_business_hours: bool,
    failed_attempts_count: u32,
) -> u32 {
    let mut score = 0u32;

    // High-risk actions
    match action {
        "delete" => score += 30,
        "export" => score += 25,
        "update" => score += 10,
        _ => {}
    }

    // Sensitive resource
    if is_sensitive_resource {
        score += 20;
    }

    // Outside business hours
    if is_outside_business_hours {
        score += 15;
    }

    // Failed attempts (exponential penalty)
    score += (failed_attempts_count * failed_attempts_count).min(50);

    score.min(100)
}

// ============================================================
// Token Validation
// ============================================================

/// Validate JWT structure (not cryptographic verification)
#[wasm_bindgen]
pub fn validate_token_structure(token: &str) -> bool {
    let parts: Vec<&str> = token.split('.').collect();

    // JWT must have 3 parts
    if parts.len() != 3 {
        return false;
    }

    // Each part must be non-empty and valid base64url
    parts.iter().all(|part| {
        !part.is_empty()
            && part
                .chars()
                .all(|c| c.is_alphanumeric() || c == '-' || c == '_')
    })
}

/// Check if token is expired
#[wasm_bindgen]
pub fn is_token_expired(exp_timestamp: u64) -> bool {
    let now = js_sys::Date::now() as u64 / 1000;
    exp_timestamp <= now
}

/// Calculate token age in seconds
#[wasm_bindgen]
pub fn token_age_seconds(iat_timestamp: u64) -> u64 {
    let now = js_sys::Date::now() as u64 / 1000;
    now.saturating_sub(iat_timestamp)
}

// ============================================================
// Security Utilities
// ============================================================

/// Sanitize user input for logging
#[wasm_bindgen]
pub fn sanitize_for_log(input: &str, max_length: u32) -> String {
    let sanitized: String = input
        .chars()
        .take(max_length as usize)
        .filter(|c| !c.is_control() && *c != '\n' && *c != '\r')
        .collect();

    // Escape special characters
    sanitized
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

/// Hash string for deduplication (DJB2 algorithm)
#[wasm_bindgen]
pub fn quick_hash(input: &str) -> u32 {
    let mut hash: u32 = 5381;
    for byte in input.bytes() {
        hash = hash.wrapping_mul(33).wrapping_add(byte as u32);
    }
    hash
}

// ============================================================
// Tests
// ============================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_permission_allowed() {
        let result = evaluate_permission("admin,viewer", "admin:delete,viewer:read", "delete");
        assert!(result.allowed);
        assert_eq!(result.matched_role, "admin");
    }

    #[test]
    fn test_permission_denied() {
        let result = evaluate_permission("viewer", "admin:delete,viewer:read", "delete");
        assert!(!result.allowed);
    }

    #[test]
    fn test_rate_limit_allowed() {
        let result = check_rate_limit("100,200,300", 60, 10, 400);
        assert!(result.allowed);
        assert!(result.remaining > 0);
    }

    #[test]
    fn test_rate_limit_exceeded() {
        let timestamps: Vec<String> = (0..10).map(|i| (350 + i).to_string()).collect();
        let result = check_rate_limit(&timestamps.join(","), 60, 10, 400);
        assert!(!result.allowed);
    }

    #[test]
    fn test_token_structure() {
        // Valid JWT structure
        assert!(validate_token_structure(
            "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.abc123"
        ));
        // Invalid
        assert!(!validate_token_structure("invalid.token"));
        assert!(!validate_token_structure("no.dots.here.extra"));
    }

    #[test]
    fn test_audit_risk() {
        let low_risk = calculate_audit_risk_score("read", false, false, 0);
        let high_risk = calculate_audit_risk_score("delete", true, true, 3);
        assert!(high_risk > low_risk);
    }

    #[test]
    fn test_sanitize() {
        let result = sanitize_for_log("<script>alert('xss')</script>", 100);
        assert!(!result.contains('<'));
        assert!(result.contains("&lt;"));
    }
}
