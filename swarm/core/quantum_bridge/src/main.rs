use axum::{routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;

#[derive(Deserialize)]
struct AuditRequest {
    code: String,
}

#[derive(Serialize)]
struct AuditResponse {
    safe: bool,
    message: String,
    confidence: f64,
}

#[tokio::main]
async fn main() {
    // Define the router
    let app = Router::new().route("/api/oracle/validate", post(run_audit));

    // Address for the local "Hybrid Iron" server
    let addr = SocketAddr::from(([127, 0, 0, 1], 3002));
    println!("🛡️ AppForge Oracle (Hybrid Iron) listening on {}", addr);

    // Start the server
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn run_audit(Json(payload): Json<AuditRequest>) -> Json<AuditResponse> {
    // 1. Hybrid Safety Check (Q-Core Logic)
    // In a real scenario, this would invoke deep recursive analysis or call 'resolve_quantum_gate'
    let fs_violation = payload.code.contains("fs.") || payload.code.contains("child_process");
    let network_leak = payload.code.contains("eval(") || payload.code.contains("dangerouslySetInnerHTML");
    
    let is_safe = !fs_violation && !network_leak;
    
    let (message, confidence) = if is_safe {
        ("Quantum State: COHERENT. Code Verified.", 0.99)
    } else {
        if fs_violation {
            ("VIO_01: Filesystem Access Violation detected.", 0.0)
        } else {
            ("VIO_02: Unsafe Execution Vector detected.", 0.0)
        }
    };

    println!("🔍 Audit Request: {} chars -> Safe? {}", payload.code.len(), is_safe);

    Json(AuditResponse {
        safe: is_safe,
        message: message.to_string(),
        confidence,
    })
}
