import { enhancedOracle } from '../swarm/core/oracle_enhanced.js';
import * as fs from 'fs/promises';
import path from 'path';

async function consultCSSFix() {
    console.log('🔮 Consulting the Oracle for Sovereign UI CSS Isolation...');

    const cssQuestion = "The standalone 'sovereign-ui' project (Vite + Tailwind v4) is experiencing a PostCSS conflict. Even with '@tailwindcss/postcss' installed, it triggers an error: 'tailwindcss' plugin has moved to a separate package. How can we definitively isolate the CSS pipeline from the root project configuration?";

    const options = [
        "Force local resolution in sovereign-ui by moving all CSS/PostCSS dependencies to the local folder and using a dedicated vite.config.ts that disables root searching.",
        "Remove the '@tailwindcss/vite' plugin and rely purely on `@tailwindcss/postcss` with a hardcoded path to the local node_modules in postcss.config.js.",
        "Rename the root postcss.config.js temporarily or use a different config file name for the standalone project using the --config flag in Vite/PostCSS.",
        "Consolidate Tailwind versions: Upgrade the entire AppForge project to Tailwind v4 to eliminate the dual-version conflict entirely."
    ];

    const criteria = ['robustness', 'maintainability', 'implementation_speed', 'minimal_side_effects'];

    const result = await enhancedOracle.consult(cssQuestion, options, criteria);

    const reportPath = path.join(process.cwd(), 'swarm/data/oracle_css_guidance.json');
    await fs.writeFile(reportPath, JSON.stringify(result, null, 2));

    console.log(`\n✅ Oracle Consultation Complete. Report saved to: ${reportPath}`);
}

consultCSSFix().catch(console.error);
