import { enhancedOracle } from '../swarm/core/oracle_enhanced.js';
import * as fs from 'fs/promises';
import path from 'path';

async function consultDeployment() {
    console.log('🔮 Initiating Deployment Strategy Consultation...');

    const deploymentIssueQuestion = "The swarm deployment often faces 'file in use' errors during updates (e.g., git pull or build). How should we optimize the process life-cycle to ensure clean updates without manual intervention?";
    const deploymentOptions = [
        "Implement a 'warm-restart' signal that gracefully shuts down agents before updates",
        "Use PM2 or a similar process manager with 'reload' capabilities and automatic file-lock detection",
        "Create a dedicated 'Maintenance Mode' that terminates all background TSX/Node processes before sensitive operations",
        "Shadow-deploy updates to a parallel directory and swap the active symlink"
    ];
    const deploymentCriteria = ['reliability', 'automation', 'simplicity', 'uptime'];

    const batchImprovementQuestion = "launch_swarm.bat currently opens 4 separate manual terminals. How can we improve this for better monitoring and management?";
    const batchOptions = [
        "Switch to a single dashboard terminal using 'blessed' or 'ink' for multi-pane monitoring",
        "Converge all logs into a single real-time stream with source-tagging for easy filtering",
        "Implement a headless daemon mode with a web-based management UI (AppForge Dashboard)",
        "Enhance the batch file to use PowerShell jobs for background execution and health checks"
    ];
    const batchCriteria = ['visibility', 'manageability', 'scalability', 'user_experience'];

    const issuesResult = await enhancedOracle.consult(deploymentIssueQuestion, deploymentOptions, deploymentCriteria);
    const batchResult = await enhancedOracle.consult(batchImprovementQuestion, batchOptions, batchCriteria);

    const report = {
        timestamp: new Date().toISOString(),
        deployment_guidance: issuesResult,
        batch_guidance: batchResult,
        stats: enhancedOracle.getStats()
    };

    const reportPath = path.join(process.cwd(), 'swarm/data/oracle_deployment_guidance.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n✅ Oracle Consultation Complete. Report saved to: ${reportPath}`);
}

consultDeployment().catch(console.error);
