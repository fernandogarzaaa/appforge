# Implementation Plan: Reality Verification

To address the user's requirement for "no simulated data," I will implement a strict verification script that exercises the actual system interfaces (Network, FileSystem, Git) rather than relying on mocks or internal simulations.

## User Review Required

> [!NOTE]
> This verification involves opening real network ports (locally) and modifying the git status (creation of untracked files). These changes will be cleaned up automatically.

## Proposed Changes

### [Scripts]

#### [NEW] [scripts/verify_reality.ts](file:///c:/Users/ferna/Downloads/appforge-main/scripts/verify_reality.ts)

- **Mesh Test:** Instantiate two `P2PResonance` nodes on ports 11440 and 11441. Connect them via WebSocket. Broadcast a "Reality Token". Verify receipt in the peer's buffer.
- **Sensor Test:** Create a temporary file `reality_check_temp.txt`. Run `RealitySensor.scanGitHub()`. Verify that `UNCOMMITTED_CHANGES` are detected with the correct intensity.

## Verification Plan

### Automated Tests

- **`npx tsx scripts/verify_reality.ts`**: This single command will run the "Reality Check".
  - **Pass Criteria:**
    - Mesh: Node B receives "Reality Token" from Node A.
    - Sensor: Git status correctly identifies the uncommitted change.
