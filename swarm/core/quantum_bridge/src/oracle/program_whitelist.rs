use std::collections::HashMap;

pub fn get_allowed_programs() -> HashMap<String, String> {
    let mut allowed = HashMap::new();
    
    // PHASE 53: SOVEREIGN MODULE WHITELIST
    // Purged all legacy Solana program IDs.
    // Tracking only internal Sovereign Kernel modules and verified bridges.
    
    allowed.insert(
        "SOV_KERNEL_CORE".to_string(),
        "Sovereign Kernel v1.0".to_string(),
    );
    allowed.insert(
        "SOV_BRIDGE_WA".to_string(),
        "WhatsApp Sovereign Bridge".to_string(),
    );
    allowed.insert(
        "SOV_EVOLVE_GEN".to_string(),
        "Quantum Evolution Engine".to_string(),
    );

    allowed
}

pub fn get_program_name(program_id: &str) -> Option<String> {
    let allowed = get_allowed_programs();
    allowed.get(program_id).cloned()
}
