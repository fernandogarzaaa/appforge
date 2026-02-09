//! Workflow DAG Processing - Rust/WebAssembly
//!
//! High-performance workflow graph algorithms:
//! - Topological sort for execution order
//! - Connection resolution
//! - Cycle detection

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet, VecDeque};
use wasm_bindgen::prelude::*;

/// Node in the workflow graph
#[wasm_bindgen]
#[derive(Clone, Serialize, Deserialize)]
pub struct WorkflowNode {
    id: String,
    node_type: String,
    name: String,
}

#[wasm_bindgen]
impl WorkflowNode {
    #[wasm_bindgen(constructor)]
    pub fn new(id: String, node_type: String, name: String) -> WorkflowNode {
        WorkflowNode {
            id,
            node_type,
            name,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn id(&self) -> String {
        self.id.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn node_type(&self) -> String {
        self.node_type.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn name(&self) -> String {
        self.name.clone()
    }
}

/// Connection between workflow nodes
#[wasm_bindgen]
#[derive(Clone, Serialize, Deserialize)]
pub struct WorkflowConnection {
    from: String,
    to: String,
}

#[wasm_bindgen]
impl WorkflowConnection {
    #[wasm_bindgen(constructor)]
    pub fn new(from: String, to: String) -> WorkflowConnection {
        WorkflowConnection { from, to }
    }

    #[wasm_bindgen(getter)]
    pub fn from(&self) -> String {
        self.from.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn to(&self) -> String {
        self.to.clone()
    }
}

/// Result of execution order computation
#[wasm_bindgen]
#[derive(Clone)]
pub struct ExecutionOrder {
    order: Vec<String>,
    has_cycle: bool,
}

#[wasm_bindgen]
impl ExecutionOrder {
    /// Get the ordered node IDs as a comma-separated string
    #[wasm_bindgen(getter)]
    pub fn order_csv(&self) -> String {
        self.order.join(",")
    }

    /// Check if the graph has a cycle
    #[wasm_bindgen(getter)]
    pub fn has_cycle(&self) -> bool {
        self.has_cycle
    }

    /// Get the number of nodes in execution order
    #[wasm_bindgen(getter)]
    pub fn count(&self) -> usize {
        self.order.len()
    }
}

/// Build execution order using topological sort (Kahn's algorithm)
/// Returns nodes in the order they should be executed
#[wasm_bindgen]
pub fn build_execution_order(
    node_ids_csv: &str,
    connections_csv: &str, // format: "from1:to1,from2:to2"
) -> ExecutionOrder {
    // Parse inputs
    let node_ids: Vec<&str> = if node_ids_csv.is_empty() {
        vec![]
    } else {
        node_ids_csv.split(',').collect()
    };

    // Build adjacency list and in-degree map
    let mut adj: HashMap<&str, Vec<&str>> = HashMap::new();
    let mut in_degree: HashMap<&str, usize> = HashMap::new();

    // Initialize all nodes
    for &node_id in &node_ids {
        adj.entry(node_id).or_insert_with(Vec::new);
        in_degree.entry(node_id).or_insert(0);
    }

    // Parse connections
    if !connections_csv.is_empty() {
        for conn in connections_csv.split(',') {
            let parts: Vec<&str> = conn.split(':').collect();
            if parts.len() == 2 {
                let from = parts[0];
                let to = parts[1];

                adj.entry(from).or_insert_with(Vec::new).push(to);
                *in_degree.entry(to).or_insert(0) += 1;
            }
        }
    }

    // Kahn's algorithm: BFS from nodes with in-degree 0
    let mut queue: VecDeque<&str> = VecDeque::new();

    for (&node, &degree) in &in_degree {
        if degree == 0 {
            queue.push_back(node);
        }
    }

    let mut result: Vec<String> = Vec::new();

    while let Some(node) = queue.pop_front() {
        result.push(node.to_string());

        if let Some(neighbors) = adj.get(node) {
            for &neighbor in neighbors {
                if let Some(degree) = in_degree.get_mut(neighbor) {
                    *degree -= 1;
                    if *degree == 0 {
                        queue.push_back(neighbor);
                    }
                }
            }
        }
    }

    // Check for cycle
    let has_cycle = result.len() != node_ids.len();

    ExecutionOrder {
        order: result,
        has_cycle,
    }
}

/// Find the starting node (trigger) in a workflow
#[wasm_bindgen]
pub fn find_start_node(node_ids_csv: &str, node_types_csv: &str) -> String {
    let ids: Vec<&str> = node_ids_csv.split(',').collect();
    let types: Vec<&str> = node_types_csv.split(',').collect();

    for (id, node_type) in ids.iter().zip(types.iter()) {
        if *node_type == "trigger" {
            return id.to_string();
        }
    }

    String::new()
}

/// Get downstream nodes from a given node
#[wasm_bindgen]
pub fn get_downstream_nodes(node_id: &str, connections_csv: &str) -> String {
    let mut downstream: Vec<String> = Vec::new();

    if !connections_csv.is_empty() {
        for conn in connections_csv.split(',') {
            let parts: Vec<&str> = conn.split(':').collect();
            if parts.len() == 2 && parts[0] == node_id {
                downstream.push(parts[1].to_string());
            }
        }
    }

    downstream.join(",")
}

/// Detect if a cycle exists in the workflow graph
#[wasm_bindgen]
pub fn detect_cycle(node_ids_csv: &str, connections_csv: &str) -> bool {
    let result = build_execution_order(node_ids_csv, connections_csv);
    result.has_cycle
}

// ============================================================
// Tests
// ============================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_execution_order() {
        let nodes = "trigger,llm,output";
        let connections = "trigger:llm,llm:output";

        let result = build_execution_order(nodes, connections);

        assert!(!result.has_cycle);
        assert_eq!(result.count(), 3);
        assert_eq!(result.order_csv(), "trigger,llm,output");
    }

    #[test]
    fn test_branching_workflow() {
        let nodes = "trigger,branch,path_a,path_b,merge";
        let connections = "trigger:branch,branch:path_a,branch:path_b,path_a:merge,path_b:merge";

        let result = build_execution_order(nodes, connections);

        assert!(!result.has_cycle);
        assert_eq!(result.count(), 5);
    }

    #[test]
    fn test_cycle_detection() {
        let nodes = "a,b,c";
        let connections = "a:b,b:c,c:a"; // Cycle!

        let result = build_execution_order(nodes, connections);

        assert!(result.has_cycle);
    }

    #[test]
    fn test_find_start() {
        let ids = "node1,trigger1,node2";
        let types = "llm,trigger,output";

        let start = find_start_node(ids, types);
        assert_eq!(start, "trigger1");
    }

    #[test]
    fn test_downstream() {
        let connections = "a:b,a:c,b:d";
        let downstream = get_downstream_nodes("a", connections);

        assert!(downstream.contains("b"));
        assert!(downstream.contains("c"));
    }
}
