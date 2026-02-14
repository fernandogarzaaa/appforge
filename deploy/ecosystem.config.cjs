
module.exports = {
    apps: [{
        name: "appforge-swarm",
        script: "./swarm/core/loop.ts",
        interpreter: "node",
        interpreter_args: "--import tsx",
        // Run as a stable daemon in production. Swarm writes data frequently.
        watch: false,
        ignore_watch: ["swarm_memory.json", "node_modules", "logs"],
        env: {
            NODE_ENV: "production",
            // Load .env.local manually in code, but PM2 can also have env vars here
        }
    }]
};
