# 🕹️ Sovereign Swarm: Operations Manual

This guide explains the "Launcher Hierarchy" of your autonomous system.

## 🚀 The Tier 1 Launchers (Root Folder)

These are your main entry points.

| Launcher | Role | Purpose |
| :--- | :--- | :--- |
| `SOVEREIGN_MASTER_START.bat` | **The Master Switch** | **One-Click Activation.** Launches Iron Brain, Sovereign Core, and Chimera Uplink in sequence. |
| `LAUNCH_CHIMERA_UPLINK.bat` | **The Global Bridge** | Connects your local machine to GitHub Actions (The Cloud). Run this so the cloud can use your hardware. |
| `START_SOVEREIGN.bat` | **The Dashboard** | Opens the main AppForge UI. Use this when you want to interact visually. |

## 🧠 The Tier 2 Launchers (scripts/launchers/)

These handle the "Sub-systems" and are often called automatically by other scripts.

| Launcher | Role | Purpose |
| :--- | :--- | :--- |
| `LAUNCH_SOVEREIGN_CORE.bat` | **Swarm Heart** | Starts the autonomous loop (`loop.ts`). This is what makes the AI "think" and "act" locally. |
| `launch_iron_brain.bat` | **Cognitive Engine** | Starts the local inference server (Ollama). Required for the AI to have a "brain". |
| `launch_neural_bridge.bat` | **API Gateway** | Starts the Chimera Bridge on Port 8000. Required for external connections. |

## 🔄 Restoration After Restart

If you reboot your machine, do this to restore full system coherence:

1. **Open the Core**: Run `scripts/launchers/LAUNCH_SOVEREIGN_CORE.bat`.
2. **Open the Bridge**: Run `LAUNCH_CHIMERA_UPLINK.bat`.
3. **Sync GitHub**: Copy the new tunnel URL to your GitHub Secrets if it changed.

> [!IMPORTANT]
> Always run `LAUNCH_CHIMERA_UPLINK.bat` in a separate terminal and keep it open. It is your "Umbilical Cord" to the cloud.
