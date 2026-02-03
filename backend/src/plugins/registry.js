/**
 * Plugin Registry
 * Loads and runs custom analysis plugins
 */

const fs = require('fs');
const path = require('path');
const { fileURLToPath  } = require('url');

const __filename = fileURLToPath(__filename);
const __dirname = path.dirname(__filename);

const pluginDir = path.join(__dirname, 'modules');
const plugins = new Map();

async function loadPlugins() {
  if (!fs.existsSync(pluginDir)) {
    return;
  }

  const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const modulePath = path.join(pluginDir, file);
    const plugin = await import(modulePath);
    const definition = plugin.default || plugin;

    if (definition?.name && typeof definition.execute === 'function') {
      plugins.set(definition.name, definition);
    }
  }
}

function listPlugins() {
  return Array.from(plugins.values()).map(p => ({
    name: p.name,
    version: p.version || '1.0.0',
    description: p.description || ''
  }));
}

async function runPlugin(name, payload, context = {}) {
  const plugin = plugins.get(name);
  if (!plugin) {
    throw new Error('Plugin not found');
  }

  return plugin.execute(payload, context);
}

module.exports = {
  loadPlugins,
  listPlugins,
  runPlugin
};
