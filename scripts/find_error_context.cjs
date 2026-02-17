const fs = require('fs');
const content = fs.readFileSync('node_modules/base44/dist/cli/index.js', 'utf8');
const index = content.indexOf('Invalid entity file');
if (index !== -1) {
    console.log('Found at index:', index);
    console.log('Context:', content.substring(index - 200, index + 300));
} else {
    console.log('Not found');
}
