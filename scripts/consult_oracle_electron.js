import quantumCore from '../swarm/core/quantum_core.ts';

async function main() {
    try {
        const question = "We are removing 'electron' and 'electron-builder' from the root package.json so the Base44 Cloud Webapp Publisher can cleanly install dependencies and build the React site. What ADDITIONAL implementations should we consider?";
        const options = [
            "Use a separate package-desktop.json for electron dependencies.",
            "Create a yarn workspace / monorepo structure separating web and desktop.",
            "Use a postinstall script to selectively install electron only if not in CI.",
            "Use setup_desktop.js to install it via CLI flags when needed locally."
        ];
        const criteria = ['reliability', 'maintainability', 'cloud-compatibility'];

        console.log('🔮 Consulting Quantum Oracle...');
        const result = await quantumCore.consultOracle(question, options, criteria);

        console.log('\n✨ Oracle Verdict:');
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
