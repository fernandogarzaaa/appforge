
module.exports = {
    apps: [{
        name: "appforge-swarm",
        script: "./swarm/core/loop.ts",
        interpreter: "node",
        interpreter_args: "--import tsx",
        watch: ["swarm"],
        // Ignore changes to memory/logs to prevent infinite restart loops
        ignore_watch: ["swarm_memory.json", "node_modules", "logs"],
        env: {
            NODE_ENV: "production",
            // Load .env.local manually in code, but PM2 can also have env vars here
        }
    }]
};
