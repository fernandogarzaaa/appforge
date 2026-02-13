/**
 * 🌟 SOVEREIGN AI ECOSYSTEM - Unified PM2 Configuration
 * 
 * This configuration launches the 4 pillars of the Sovereign state:
 * 1. Hyper Intelligence v2 (Finance & Markets)
 * 2. Swarm Agent Collective (Multi-Agent Intelligence)
 * 3. Universal Intelligence (Cross-Domain Knowledge)
 * 4. WhatsApp Bridge (Communication & Sovereignty)
 */

module.exports = {
    apps: [
        {
            name: "sovereign-hyper-v2",
            script: "./swarm/core/real_hyper_intelligence_v2.ts",
            interpreter: "node",
            interpreter_args: "--import tsx",
            out_file: "./swarm/logs/hyper_v2.log",
            error_file: "./swarm/logs/hyper_v2.err.log",
            env: {
                NODE_ENV: "production",
                SWARM_REALITY_MODE: "true"
            }
        },
        {
            name: "sovereign-agents",
            script: "./swarm/test_all_agents.ts",
            interpreter: "node",
            interpreter_args: "--import tsx",
            out_file: "./swarm/logs/agents.log",
            error_file: "./swarm/logs/agents.err.log",
            env: {
                NODE_ENV: "production",
                SWARM_REALITY_MODE: "true"
            }
        },
        {
            name: "sovereign-universal",
            script: "./swarm/core/universal_hyper_intelligence.ts",
            interpreter: "node",
            interpreter_args: "--import tsx",
            out_file: "./swarm/logs/universal.log",
            error_file: "./swarm/logs/universal.err.log",
            env: {
                NODE_ENV: "production",
                SWARM_REALITY_MODE: "true"
            }
        },
        {
            name: "sovereign-whatsapp",
            script: "./swarm/core/whatsapp_bridge.ts",
            interpreter: "node",
            interpreter_args: "--import tsx",
            out_file: "./swarm/logs/whatsapp.log",
            error_file: "./swarm/logs/whatsapp.err.log",
            env: {
                NODE_ENV: "production",
                SWARM_REALITY_MODE: "true"
            }
        },
        {
            name: "sovereign-scc-server",
            script: "./scripts/scc_server.ts",
            interpreter: "node",
            interpreter_args: "--import tsx",
            out_file: "./swarm/logs/scc.log",
            error_file: "./swarm/logs/scc.err.log",
            env: {
                NODE_ENV: "production",
                SWARM_REALITY_MODE: "true"
            }
        }
    ]
};
