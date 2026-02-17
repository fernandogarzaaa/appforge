const fs = require('fs');
const readline = require('readline');
const path = require('path');

const filePath = path.join('node_modules', 'base44', 'dist', 'cli', 'index.js');
console.log(`Scanning ${filePath}...`);

const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity
});

let lineNum = 0;
rl.on('line', (line) => {
    lineNum++;
    if (line.includes('Invalid entity file')) {
        console.log(`Found match at line ${lineNum}:`);
        console.log(line.substring(Math.max(0, line.indexOf('Invalid entity file') - 100), line.indexOf('Invalid entity file') + 200));
        console.log('---');
    }
});
