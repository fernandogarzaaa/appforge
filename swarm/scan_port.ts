import fs from 'fs';

const today = new Date().toISOString().split('T')[0];
const logPath = `C:/tmp/openclaw/openclaw-${today}.log`;

if (!fs.existsSync(logPath)) {
    console.error('Log not found');
    process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf-8');
const lines = content.split('\n');

console.log('--- SCANNING FOR GATEWAY PORT ---');
const ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

for (const line of lines) {
    const cleanLine = line.replace(ansiRegex, '');
    if (cleanLine.includes('Listening') || cleanLine.includes('port') || cleanLine.includes('bind')) {
        console.log(cleanLine);
    }
}
