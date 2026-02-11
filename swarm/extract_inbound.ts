import fs from 'fs';

const today = new Date().toISOString().split('T')[0];
const logPath = `C:/tmp/openclaw/openclaw-${today}.log`;

if (!fs.existsSync(logPath)) {
    console.error('Log not found');
    process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf-8');
const lines = content.split('\n');

console.log('--- ACTUAL INBOUND MESSAGES ---');
for (const line of lines) {
    if (line.includes('"2":"inbound message"')) {
        try {
            const data = JSON.parse(line);
            console.log(JSON.stringify(data, null, 2));
        } catch (e) {
            console.log('Malformed JSON line: ' + line.substring(0, 100));
        }
    }
}
