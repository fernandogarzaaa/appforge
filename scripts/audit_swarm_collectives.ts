/**
 * Audit that every *Swarm class has a multi-agent collective definition.
 */

import * as fs from 'fs/promises';
import path from 'path';
import {
    SWARM_COLLECTIVE_MEMBERS,
    getAllDefinedCollectives
} from '../swarm/core/swarm_collectives.js';

async function main(): Promise<void> {
    const agentsDir = path.join(process.cwd(), 'swarm', 'agents');
    const files = await fs.readdir(agentsDir);
    const swarmFiles = files
        .filter((name) => name.endsWith('Swarm.ts'))
        .sort();

    const swarmNames = swarmFiles.map((name) => name.replace(/\.ts$/, ''));
    const defined = new Set(getAllDefinedCollectives());

    const missingDefinitions = swarmNames.filter((name) => !defined.has(name));
    const undersizedDefinitions = swarmNames
        .filter((name) => defined.has(name))
        .filter((name) => (SWARM_COLLECTIVE_MEMBERS[name] || []).length < 2);
    const extraDefinitions = getAllDefinedCollectives().filter((name) => !swarmNames.includes(name));

    console.log('SWARM COLLECTIVE AUDIT');
    console.log('='.repeat(72));
    for (const swarmName of swarmNames) {
        const members = SWARM_COLLECTIVE_MEMBERS[swarmName] || [];
        const status = members.length >= 2 ? 'OK' : 'FAIL';
        console.log(`${status.padEnd(4)} ${swarmName.padEnd(28)} members=${members.length}`);
    }

    if (extraDefinitions.length > 0) {
        console.log('\nExtra definitions (not fatal):');
        extraDefinitions.forEach((name) => console.log(`  - ${name}`));
    }

    if (missingDefinitions.length > 0) {
        console.error('\nMissing collective definitions:');
        missingDefinitions.forEach((name) => console.error(`  - ${name}`));
    }

    if (undersizedDefinitions.length > 0) {
        console.error('\nInvalid collective definitions (<2 members):');
        undersizedDefinitions.forEach((name) => {
            const members = SWARM_COLLECTIVE_MEMBERS[name] || [];
            console.error(`  - ${name}: ${JSON.stringify(members)}`);
        });
    }

    if (missingDefinitions.length > 0 || undersizedDefinitions.length > 0) {
        process.exit(1);
    }

    console.log('\nPASS: all swarm classes have multi-agent collective definitions.');
}

main().catch((error) => {
    console.error('collective audit failed:', error);
    process.exit(1);
});
