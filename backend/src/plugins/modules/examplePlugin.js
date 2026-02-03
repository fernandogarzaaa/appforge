/**
 * Example Custom Plugin
 */

const examplePlugin = {
  name: 'example-optimizer',
  version: '1.0.0',
  description: 'Sample plugin that scores payload complexity',
  execute(payload) {
    const text = JSON.stringify(payload || {});
    const score = Math.min(100, text.length);
    return {
      score,
      recommendation: score > 50 ? 'Consider simplifying input' : 'Input complexity acceptable'
    };
  }
};

module.exports = examplePlugin;
