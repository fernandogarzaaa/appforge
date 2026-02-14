module.exports = {
    apps: [
        {
            name: 'swarm-telemetry',
            script: 'scripts/swarm_telemetry_server.ts',
            interpreter: 'node',
            interpreter_args: '--loader tsx',
            env: {
                NODE_ENV: 'development',
                PORT: 3001
            },
            watch: ['scripts/swarm_telemetry_server.ts'],
            ignore_watch: ['node_modules', 'data/logs'],
            out_file: 'data/logs/telemetry.out.log',
            error_file: 'data/logs/telemetry.err.log',
            merge_logs: true
        },
        {
            name: 'swarm-executor',
            script: 'scripts/real_swarm_executor.ts',
            interpreter: 'node',
            interpreter_args: '--loader tsx',
            env: {
                NODE_ENV: 'development'
            },
            watch: ['swarm'],
            ignore_watch: ['node_modules', 'swarm/data'],
            out_file: 'data/logs/executor.out.log',
            error_file: 'data/logs/executor.err.log',
            merge_logs: true,
            max_memory_restart: '1G'
        },
        {
            name: 'sovereign-ui',
            script: 'npm',
            args: 'run dev',
            cwd: './sovereign-ui',
            env: {
                PORT: 5174
            },
            out_file: '../data/logs/ui.out.log',
            error_file: '../data/logs/ui.err.log',
            merge_logs: true
        }
    ]
};
