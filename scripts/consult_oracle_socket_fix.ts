import { enhancedOracle } from '../swarm/core/oracle_enhanced.js';
import * as fs from 'fs/promises';
import path from 'path';

async function consultSocketFix() {
    console.log('🔮 Consulting the Oracle for Sovereign Socket Orchestration...');

    const socketQuestion = "The standalone Sovereign Desktop App is experiencing a 'net::ERR_CONNECTION_REFUSED' on port 3001 (Socket.io). This is because the backend SCC Server is not running when the app is launched via the one-click shortcut. What is the most professional way to orchestrate this dependency in a standalone desktop context?";

    const options = [
        "Update the 'SovereignApp.bat' launcher to check for port 3001 and automatically boot the 'sovereign-scc-server' via PM2 if it is offline.",
        "Integrate the SCC Server directly into the Electron main process so that every time the app window opens, the telemetry bridge starts automatically as a child process.",
        "Implement a 'Wait for Connection' splash screen in the UI that gently prompts the user to launch the swarm if the backend is unreachable.",
        "A hybrid 'Stealth Boot': The desktop shortcut launches a background 'Sovereign Orchestration' service that keeps the SCC server alive even when the window is closed."
    ];

    const criteria = ['user_experience', 'architectural_cleanliness', 'reliability', 'resource_efficiency'];

    const result = await enhancedOracle.consult(socketQuestion, options, criteria);

    const reportPath = path.join(process.cwd(), 'swarm/data/oracle_socket_guidance.json');
    await fs.writeFile(reportPath, JSON.stringify(result, null, 2));

    console.log(`\n✅ Oracle Consultation Complete. Report saved to: ${reportPath}`);
}

consultSocketFix().catch(console.error);
