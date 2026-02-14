use crate::kernel::truth::{Axiom, TruthAnchor};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, PartialEq)]
pub enum NodeState {
    Stable,
    Inconsistent,
    Converging,
}

pub struct LatticeNode {
    pub id: String,
    pub state: NodeState,
    pub axioms: Vec<Axiom>,
    pub neighbors: Vec<String>,
}

pub struct LatticeController {
    pub nodes: Arc<Mutex<HashMap<String, LatticeNode>>>,
    pub anchor: Arc<TruthAnchor>,
}

impl LatticeController {
    pub fn new(anchor: Arc<TruthAnchor>) -> Self {
        Self {
            nodes: Arc::new(Mutex::new(HashMap::new())),
            anchor,
        }
    }

    pub fn register_node(&self, id: String, axioms: Vec<Axiom>, neighbors: Vec<String>) {
        let mut nodes = self.nodes.lock().unwrap();
        nodes.insert(
            id.clone(),
            LatticeNode {
                id,
                state: NodeState::Stable,
                axioms,
                neighbors,
            },
        );
    }

    /// Passive Stability Sync (Cellular Automata Principle)
    pub fn stable_sync(&self) {
        let mut nodes = self.nodes.lock().unwrap();
        let node_ids: Vec<String> = nodes.keys().cloned().collect();

        for id in node_ids {
            let (is_consistent, neighbor_inconsistency) = {
                let node = nodes.get(&id).unwrap();
                let mut consistent = true;
                let mut _bad_neighbor = None;

                for neighbor_id in &node.neighbors {
                    if let Some(neighbor) = nodes.get(neighbor_id) {
                        // Check if neighbor violates axioms relative to this node
                        if !self
                            .anchor
                            .verify_cross_consistency(&node.axioms, &neighbor.axioms)
                        {
                            consistent = false;
                            _bad_neighbor = Some(neighbor_id.clone());
                            break;
                        }
                    }
                }
                (consistent, _bad_neighbor)
            };

            if !is_consistent {
                if let Some(node) = nodes.get_mut(&id) {
                    node.state = NodeState::Inconsistent;
                    println!(
                        "🛡️ LATTICE: Inconsistency detected at {}. Auto-resolving...",
                        id
                    );
                    // Passive recovery: Converge toward Truth Anchor
                    node.state = NodeState::Converging;
                }
            }
        }
    }
}
