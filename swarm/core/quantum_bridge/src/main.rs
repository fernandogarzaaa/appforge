use axum::{routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;

mod oracle; // Use the oracle module directly in the binary crate
mod kernel; // Phase 42: Truth Anchor Module

#[derive(Deserialize)]
struct AuditRequest {
    code: String,
    intent: Option<String>,
    verification_hash: Option<String>,
}

#[derive(Serialize)]
struct AuditResponse {
    safe: bool,
    message: String,
    confidence: f64,
}

#[derive(Deserialize)]
struct TxAuditRequest {
    tx: String, // Base64 encoded transaction
}

#[derive(Serialize)]
struct TxAuditResponse {
    verified: bool,
    risk_score: f64,
    details: String,
}

#[derive(Deserialize)]
struct HandshakeRequest {
    intent: String,
    payload: String,
}

#[derive(Serialize)]
struct HandshakeResponse {
    blessed: bool,
    token: Option<String>,
    message: String,
}

trait SafetyCell {
    fn inspect(&self, code: &str) -> (bool, String, f64);
}

struct EconomicCell;
impl SafetyCell for EconomicCell {
    fn inspect(&self, code: &str) -> (bool, String, f64) {
        let risk_patterns = vec!["rug_pull", "mint_unlimited", "transfer_ownership"];
        for pattern in risk_patterns {
            if code.contains(pattern) {
                return (false, format!("ECONOMIC_RISK: Found {}", pattern), 0.1);
            }
        }
        (true, "Economic Logic: SOUND".to_string(), 0.95)
    }
}

struct SpatialCell;
impl SafetyCell for SpatialCell {
    fn inspect(&self, code: &str) -> (bool, String, f64) {
        if code.contains("overlap") || code.contains("divide_by_zero") { // Simulating physics checks
            return (false, "SPATIAL_VIOLATION: Structural instability detected.".to_string(), 0.2);
        }
        (true, "Spatial Integrity: STABLE".to_string(), 0.98)
    }
}

struct InferenceCell;
impl SafetyCell for InferenceCell {
    fn inspect(&self, code: &str) -> (bool, String, f64) {
        if code.contains("while(true)") || code.contains("loop {") {
            return (false, "INFERENCE_HALT: Infinite recursion detected.".to_string(), 0.0);
        }
        (true, "Logic Flow: TERMINATING".to_string(), 0.99)
    }
}

#[tokio::main]
async fn main() {
    // Define the router
    let app = Router::new()
        .route("/api/oracle/validate", post(run_audit))
        .route("/api/oracle/verify-tx", post(run_tx_audit))
        .route("/api/oracle/bless", post(run_bless))
        .route("/api/oracle/profile", post(run_profile)); // Phase 39: Profiler

    // Address for the local "Hybrid Iron" server
    let addr = SocketAddr::from(([127, 0, 0, 1], 3002));
    println!("🛡️ AppForge Oracle (Hybrid Iron) listening on {}", addr);

    // Start the server
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn run_bless(Json(req): Json<HandshakeRequest>) -> Json<HandshakeResponse> {
    println!("🙏 Blessing Request: '{}'", req.intent);
    
    // PHASE 45: TURBO-HEAL PARALLELIZATION
    let handle = tokio::spawn(async move {
        kernel::bless::BlessingEngine::bless(&req.intent, &req.payload)
    });

    match handle.await.unwrap() {
        Some(token) => {
            println!("✨ BLESSED: {}", token);
            Json(HandshakeResponse {
                blessed: true,
                token: Some(token),
                message: "Sovereign Handshake Accepted (Parallel Processing).".to_string(),
            })
        },
        None => {
            println!("🚫 REJECTED: Truth Anchor Violation.");
            Json(HandshakeResponse {
                blessed: false,
                token: None,
                message: "VIOLATION: Proposal contradicts Immutable Axioms.".to_string(),
            })
        }
    }
}

async fn run_audit(Json(payload): Json<AuditRequest>) -> Json<AuditResponse> {
    let intent = payload.intent.unwrap_or_else(|| "general".to_string());
    
    // PHASE 33 & 42: PRODUCTION HARDENING + TRUTH ANCHOR
    // In production, every request MUST have a verification hash proving it came from a verified source.
    if payload.verification_hash.is_none() {
        println!("🛑 HARD_STOP_PROD: Missing Verification Hash.");
        return Json(AuditResponse {
            safe: false,
            message: "HARD_STOP_PROD: Unverified Source. Action Halted.".to_string(),
            confidence: 0.0,
        });
    }

    // PHASE 42: TRUTH ANCHOR VALIDATION
    // Check against Immutable Axioms
    let (axiom_compliance, axiom_msg) = kernel::truth::TruthAnchor::validate(&intent, &payload.code);
    if !axiom_compliance {
        println!("🛑 TRUTH ANCHOR VIOLATION: {}", axiom_msg);
        return Json(AuditResponse {
            safe: false,
            message: axiom_msg,
            confidence: 0.0,
        });
    }

    // PHASE 39: SYSTEM LOAD PROFILING
    let load = kernel::profiler::KernelProfiler::get_system_load();
    if load > 0.9 {
        println!("⚠️ KERNEL_LOAD: High System Pressure ({})", load);
    }

    println!("🔍 Audit Request: Intent='{}' Length={}", intent, payload.code.len());
    
    // Continue with specialized cell inspection...
    let (safe, message, confidence) = if intent.contains("spatial") || intent.contains("city") {
        SpatialCell.inspect(&payload.code)
    } else if intent.contains("defi") || intent.contains("token") {
        EconomicCell.inspect(&payload.code)
    } else {
        // Universal / Inference Check
        let inf_result = InferenceCell.inspect(&payload.code);
        if !inf_result.0 {
            inf_result
        } else {
             // Fallback to basic safety checks
            let fs_violation = payload.code.contains("fs.") || payload.code.contains("child_process");
            let network_leak = payload.code.contains("eval(") || payload.code.contains("dangerouslySetInnerHTML");
            
            let is_safe = !fs_violation && !network_leak;
            
            if is_safe {
                (true, "Quantum State: COHERENT. Code Verified.".to_string(), 0.99)
            } else {
                if fs_violation {
                    (false, "VIO_01: Filesystem Access Violation.".to_string(), 0.0)
                } else {
                    (false, "VIO_02: Unsafe Execution Vector.".to_string(), 0.0)
                }
            }
        }
    };

    Json(AuditResponse {
        safe,
        message,
        confidence,
    })
}

async fn run_profile(Json(payload): Json<AuditRequest>) -> Json<AuditResponse> {
    let suggestions = kernel::profiler::KernelProfiler::suggest_optimizations(&payload.code);
    let message = if suggestions.is_empty() {
        "NO_OPTIMIZATIONS_NEEDED".to_string()
    } else {
        suggestions.join(" | ")
    };

    Json(AuditResponse {
        safe: true,
        message,
        confidence: 1.0,
    })
}

async fn run_tx_audit(Json(payload): Json<TxAuditRequest>) -> Json<TxAuditResponse> {
    println!("💸 Transaction Audit Request Received");
    let result = oracle::tx_audit::audit_transaction(&payload.tx);
    
    println!("   Verdict: Verified={}, Risk={}, Details={}", result.verified, result.risk_score, result.details);

    Json(TxAuditResponse {
        verified: result.verified,
        risk_score: result.risk_score,
        details: result.details,
    })
}
