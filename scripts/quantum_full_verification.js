/**
 * ⚛️ Quantum Full Frontend Verification
 * 
 * Uses QuantumEngine principles to analyze ALL frontend pages and identify:
 * - Missing imports and broken dependencies
 * - Unhandled API calls (fetch/axios without try-catch)
 * - Missing state handlers (useState without set function usage)
 * - Empty/placeholder content
 * - Missing route registrations
 * - Unused exports
 * - Unreferenced components
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Quantum metrics
let entropy = 0;
let coherence = 100;
let issues = [];
let pageScores = {};

console.log('═══════════════════════════════════════════════════════════════');
console.log('        ⚛️ QUANTUM FULL FRONTEND VERIFICATION');
console.log('═══════════════════════════════════════════════════════════════\n');

function analyzeFile(filePath, content) {
    const fileName = path.basename(filePath);
    const findings = [];
    let score = 100;

    // 1. Check for unhandled async operations
    const fetchCalls = content.match(/(?:fetch|axios)\s*\(/g) || [];
    const tryBlocks = content.match(/try\s*\{/g) || [];
    if (fetchCalls.length > tryBlocks.length) {
        findings.push({
            type: 'UNHANDLED_ASYNC',
            severity: 'high',
            message: `${fetchCalls.length - tryBlocks.length} fetch/axios calls may lack error handling`,
        });
        score -= 10;
        entropy += 5;
    }

    // 2. Check for useState without setState usage
    const useStates = content.matchAll(/const\s+\[(\w+),\s*set(\w+)\]\s*=\s*useState/g);
    for (const match of useStates) {
        const setter = `set${match[2]}`;
        if (!content.includes(setter + '(')) {
            findings.push({
                type: 'UNUSED_SETTER',
                severity: 'medium',
                message: `useState setter '${setter}' never called - state may be stale`,
            });
            score -= 5;
            entropy += 3;
        }
    }

    // 3. Check for missing return statements in async functions
    const asyncFuncs = content.match(/async\s+(?:function\s+\w+|\w+\s*=\s*async)\s*\([^)]*\)\s*=?>?\s*\{[^}]*\}/g) || [];
    for (const func of asyncFuncs) {
        if (!func.includes('return') && !func.includes('await')) {
            findings.push({
                type: 'EMPTY_ASYNC',
                severity: 'medium',
                message: 'Async function with no await or return',
            });
            score -= 5;
        }
    }

    // 4. Check for console.error without toast/notification
    const consoleErrors = content.match(/console\.(error|warn)\(/g) || [];
    const toasts = content.match(/toast\.(error|warning|success|info)\(/g) || [];
    if (consoleErrors.length > toasts.length + 2) {
        findings.push({
            type: 'SILENT_ERRORS',
            severity: 'medium',
            message: `${consoleErrors.length - toasts.length} errors logged but not shown to user`,
        });
        score -= 5;
        entropy += 3;
    }

    // 5. Check for imports that aren't used
    const imports = content.matchAll(/import\s+\{([^}]+)\}\s+from/g);
    for (const match of imports) {
        const importedItems = match[1].split(',').map(s => s.trim().split(' as ').pop().trim());
        for (const item of importedItems) {
            if (item && item.length > 2) {
                // Simple check: count occurrences after the import
                const afterImport = content.substring(content.indexOf(match[0]) + match[0].length);
                const regex = new RegExp(`\\b${item}\\b`, 'g');
                const usages = (afterImport.match(regex) || []).length;
                if (usages === 0) {
                    findings.push({
                        type: 'UNUSED_IMPORT',
                        severity: 'low',
                        message: `Imported '${item}' is never used`,
                    });
                    score -= 2;
                }
            }
        }
    }

    // 6. Check for hardcoded URLs
    const hardcodedUrls = content.matchAll(/(?:fetch|axios)\s*\(\s*['"`](https?:\/\/[^'"`]+)['"`]/g);
    for (const match of hardcodedUrls) {
        if (!match[1].includes('localhost')) {
            findings.push({
                type: 'HARDCODED_URL',
                severity: 'medium',
                message: `Hardcoded URL: ${match[1].substring(0, 40)}...`,
            });
            score -= 5;
        }
    }

    // 7. Check for missing loading states
    const hasQuery = content.includes('useQuery') || content.includes('useMutation');
    const hasLoading = content.includes('isLoading') || content.includes('loading') || content.includes('isPending');
    if (hasQuery && !hasLoading) {
        findings.push({
            type: 'MISSING_LOADING',
            severity: 'medium',
            message: 'Uses React Query but no loading state handling',
        });
        score -= 5;
    }

    // 8. Check for placeholder/stub content (excluding valid HTML placeholder attributes)
    const placeholderPatterns = [
        { pattern: /coming\s+soon/gi, label: 'coming soon' },
        { pattern: /not\s+implemented/gi, label: 'not implemented' },
        { pattern: /todo:\s*implement/gi, label: 'TODO: implement' },
        { pattern: /\bstub\b/gi, label: 'stub' },
        // Only match "placeholder" if NOT followed by = or : (which would be an attribute or property)
        { pattern: /\bplaceholder\b(?!\s*[=:])|TODO:|FIXME:/gi, label: 'placeholder/todo' },
    ];
    for (const { pattern, label } of placeholderPatterns) {
        const matches = content.match(pattern);
        if (matches) {
            for (const m of matches) {
                // Double check it's not a false positive
                if (m.toLowerCase().includes('placeholder') && (content.includes(`${m}="`) || content.includes(`${m}:`))) {
                    continue;
                }
                findings.push({
                    type: 'PLACEHOLDER',
                    severity: 'high',
                    message: `Placeholder found: "${label}"`,
                });
                score -= 8;
                entropy += 5;
            }
        }
    }

    // 9. Check for empty event handlers
    const emptyHandlers = content.match(/on\w+\s*=\s*\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/g);
    if (emptyHandlers) {
        findings.push({
            type: 'EMPTY_HANDLER',
            severity: 'high',
            message: `${emptyHandlers.length} empty event handlers (onClick={() => {}})`,
        });
        score -= emptyHandlers.length * 5;
        entropy += emptyHandlers.length * 3;
    }

    // 10. Check for missing key props in lists (improved heuristic)
    // Only count .map() that looks like it returns JSX (starts with ( or < after =>)
    const jsxMapCalls = content.match(/\.map\s*\(\s*(?:[^)]+)\s*=>\s*[\(<]/g) || [];
    const keyProps = content.match(/key\s*=/g) || [];

    // Only flag if we have JSX maps but significantly fewer keys
    // This is still a heuristic but less aggressive than counting all maps
    if (jsxMapCalls.length > keyProps.length + 1) {
        findings.push({
            type: 'MISSING_KEY',
            severity: 'medium',
            message: `Potential missing keys: ${jsxMapCalls.length} rendering maps vs ${keyProps.length} key props`,
        });
        score -= 5;
    }

    // 11. Check for direct DOM manipulation (anti-pattern in React)
    if (content.includes('document.getElementById') || content.includes('document.querySelector')) {
        findings.push({
            type: 'DIRECT_DOM',
            severity: 'medium',
            message: 'Direct DOM manipulation detected (use refs instead)',
        });
        score -= 5;
    }

    score = Math.max(0, score);
    return { findings, score };
}

function scanDirectory(dir, fileType = '.jsx') {
    const results = [];

    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                results.push(...scanDirectory(filePath, fileType));
            } else if (file.endsWith(fileType) || file.endsWith('.tsx')) {
                results.push(filePath);
            }
        }
    } catch (error) {
        console.error(`Error scanning ${dir}:`, error.message);
    }

    return results;
}

// Scan all pages
console.log('📁 Scanning Pages...');
console.log('─────────────────────────────────────────\n');

const pagesDir = path.join(projectRoot, 'src/pages');
const pageFiles = scanDirectory(pagesDir);
let criticalPages = [];

for (const filePath of pageFiles) {
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { findings, score } = analyzeFile(filePath, content);

    pageScores[fileName] = score;

    if (findings.length > 0) {
        console.log(`\n📄 ${fileName} (Score: ${score}/100)`);

        const criticalIssues = findings.filter(f => f.severity === 'high');
        const mediumIssues = findings.filter(f => f.severity === 'medium');

        for (const f of findings) {
            const icon = f.severity === 'high' ? '🔴' :
                f.severity === 'medium' ? '🟡' : '🔵';
            console.log(`   ${icon} [${f.type}] ${f.message}`);
            issues.push({ file: fileName, ...f });
        }

        if (score < 70) {
            criticalPages.push({ name: fileName, score, issues: criticalIssues.length });
        }
    }
}

// Scan components
console.log('\n\n📁 Scanning Components...');
console.log('─────────────────────────────────────────\n');

const componentsDir = path.join(projectRoot, 'src/components');
const componentFiles = scanDirectory(componentsDir);
let criticalComponents = [];

for (const filePath of componentFiles) {
    const fileName = path.basename(filePath);
    const relPath = path.relative(componentsDir, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { findings, score } = analyzeFile(filePath, content);

    pageScores[relPath] = score;

    const criticalIssues = findings.filter(f => f.severity === 'high');

    if (criticalIssues.length > 0) {
        console.log(`\n📄 ${relPath} (Score: ${score}/100)`);

        for (const f of findings.filter(f => f.severity === 'high' || f.severity === 'medium')) {
            const icon = f.severity === 'high' ? '🔴' : '🟡';
            console.log(`   ${icon} [${f.type}] ${f.message}`);
            issues.push({ file: relPath, ...f });
        }

        if (score < 70) {
            criticalComponents.push({ name: relPath, score, issues: criticalIssues.length });
        }
    }
}

// Check routes
console.log('\n\n📡 Checking Route Registrations...');
console.log('─────────────────────────────────────────\n');

const appPath = path.join(projectRoot, 'src/App.jsx');
if (fs.existsSync(appPath)) {
    const appContent = fs.readFileSync(appPath, 'utf-8');

    // Extract all page components
    const pageComponents = pageFiles.map(f => path.basename(f, '.jsx'));
    const missingRoutes = [];

    for (const comp of pageComponents) {
        if (!appContent.includes(comp)) {
            missingRoutes.push(comp);
        }
    }

    if (missingRoutes.length > 0) {
        console.log('⚠️  Pages without routes:');
        for (const r of missingRoutes.slice(0, 10)) {
            console.log(`   - ${r}`);
        }
        if (missingRoutes.length > 10) {
            console.log(`   ... and ${missingRoutes.length - 10} more`);
        }
    } else {
        console.log('✅ All pages have route registrations');
    }
}

// Check for orphaned imports
console.log('\n\n🔗 Checking for Broken Imports...');
console.log('─────────────────────────────────────────\n');

const allFiles = [...pageFiles, ...componentFiles];
let brokenImports = [];

for (const filePath of allFiles.slice(0, 50)) { // Limit for performance
    const content = fs.readFileSync(filePath, 'utf-8');
    const localImports = content.matchAll(/from\s+['"](@\/[^'"]+|\.\.?\/[^'"]+)['"]/g);

    for (const match of localImports) {
        const importPath = match[1];
        if (importPath.startsWith('@/')) {
            const resolvedPath = path.join(projectRoot, 'src', importPath.slice(2));
            const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx', '/index.ts', '/index.tsx'];
            let found = false;
            for (const ext of extensions) {
                if (fs.existsSync(resolvedPath + ext)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                brokenImports.push({ file: path.basename(filePath), import: importPath });
            }
        }
    }
}

if (brokenImports.length > 0) {
    console.log('⚠️  Potentially broken imports:');
    for (const bi of brokenImports.slice(0, 10)) {
        console.log(`   - ${bi.file}: ${bi.import}`);
    }
} else {
    console.log('✅ No broken imports detected');
}

// Summary
console.log('\n\n═══════════════════════════════════════════════════════════════');
console.log('        ⚛️ QUANTUM VERIFICATION SUMMARY');
console.log('═══════════════════════════════════════════════════════════════\n');

coherence = Math.max(0, Math.min(100, 100 - entropy));
const stability = (coherence + (100 - Math.min(100, entropy))) / 2;

const highIssues = issues.filter(i => i.severity === 'high');
const mediumIssues = issues.filter(i => i.severity === 'medium');
const lowIssues = issues.filter(i => i.severity === 'low');

console.log(`📊 Total Issues: ${issues.length}`);
console.log(`🌡️  Entropy: ${Math.min(100, entropy)}% ${entropy > 50 ? '(High - needs attention)' : '(Acceptable)'}`);
console.log(`🔗 Coherence: ${coherence}%`);
console.log(`⚡ Stability: ${stability.toFixed(1)}%`);

console.log('\n📋 Issue Breakdown:');
console.log(`   🔴 High: ${highIssues.length}`);
console.log(`   🟡 Medium: ${mediumIssues.length}`);
console.log(`   🔵 Low: ${lowIssues.length}`);

// Critical pages needing attention
if (criticalPages.length > 0) {
    console.log('\n🚨 Critical Pages (Score < 70):');
    for (const p of criticalPages.sort((a, b) => a.score - b.score)) {
        console.log(`   - ${p.name}: ${p.score}/100 (${p.issues} high-severity issues)`);
    }
}

// Issue categories
const categories = {};
for (const issue of issues) {
    categories[issue.type] = (categories[issue.type] || 0) + 1;
}

console.log('\n📈 Issue Categories:');
const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);
for (const [type, count] of sortedCategories.slice(0, 8)) {
    console.log(`   ${type}: ${count}`);
}

// Recommendations
console.log('\n🔮 Quantum Recommendations:');
if (highIssues.length > 0) {
    console.log(`   ⚛️ Fix ${highIssues.length} high-severity issues first`);
}
if (categories['PLACEHOLDER']) {
    console.log(`   ⚛️ Replace ${categories['PLACEHOLDER']} placeholder implementations`);
}
if (categories['UNHANDLED_ASYNC']) {
    console.log(`   ⚛️ Add error handling to async operations`);
}
if (categories['EMPTY_HANDLER']) {
    console.log(`   ⚛️ Implement empty event handlers or remove them`);
}
if (categories['SILENT_ERRORS']) {
    console.log(`   ⚛️ Show error feedback to users (toasts/alerts)`);
}

console.log('\n');

// Export results as JSON for further processing
const results = {
    entropy: Math.min(100, entropy),
    coherence,
    stability,
    totalIssues: issues.length,
    criticalPages,
    categories,
    issues: issues.slice(0, 50), // Limit for readability
};

fs.writeFileSync(
    path.join(projectRoot, 'quantum_verification_report.json'),
    JSON.stringify(results, null, 2)
);

console.log('📄 Full report saved to: quantum_verification_report.json\n');

process.exit(highIssues.length > 0 ? 1 : 0);
