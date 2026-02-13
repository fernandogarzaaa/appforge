#!/usr/bin/env node
/**
 * Pull Ollama Models for True AI Independence
 * Uses the Ollama API directly (ES Module)
 */

import http from 'http';

const models = [
  { name: 'phi3:mini', description: 'Fast validation (4GB)' },
  { name: 'nomic-embed-text', description: 'Embeddings (500MB)' },
  { name: 'deepseek-coder:6.7b', description: 'Code generation (4GB)' },
];

const ollamaHost = 'localhost';
const ollamaPort = 11434;

function pullModel(modelName) {
  return new Promise((resolve, reject) => {
    console.log(`\n⬇️  Pulling ${modelName}...`);

    const postData = JSON.stringify({ name: modelName });

    const options = {
      hostname: ollamaHost,
      port: ollamaPort,
      path: '/api/pull',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
        process.stdout.write('.');
      });
      res.on('end', () => {
        console.log(`\n✅ ${modelName} pulled successfully!`);
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`\n❌ Error pulling ${modelName}: ${e.message}`);
      resolve(); // Continue with other models
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     🔮 PULLING OLLAMA MODELS FOR TRUE AI INDEPENDENCE       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  // Check existing models first
  const checkModels = () => {
    return new Promise((resolve, reject) => {
      http.get(`http://${ollamaHost}:${ollamaPort}/api/tags`, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const allModels = JSON.parse(data).models || [];
            console.log('\n📦 Already installed models:');
            allModels.forEach((m) => {
              console.log(`   • ${m.name} (${(m.size / 1e9).toFixed(1)}GB)`);
            });
            resolve(allModels.map(m => m.name));
          } catch (e) {
            resolve([]);
          }
        });
      }).on('error', () => resolve([]));
    });
  };

  const existingModels = await checkModels();

  // Pull missing models
  console.log('\n⬇️  Pulling missing models...\n');

  for (const model of models) {
    if (existingModels.some(m => m.includes(model.name.split(':')[0]))) {
      console.log(`⏭️  ${model.name} - already installed`);
      continue;
    }
    await pullModel(model.name);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ Model pull complete!');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
