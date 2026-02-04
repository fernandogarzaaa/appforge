import React, { useState } from 'react';
import { usePluginSDK } from './usePluginSDK';

/**
 * Plugin Development Studio Component
 */
export const PluginDevelopmentStudio = () => {
  const { registerPlugin } = usePluginSDK();
  const [pluginName, setPluginName] = useState('');
  const [pluginCode, setPluginCode] = useState('');

  const handlePublish = async () => {
    try {
      await registerPlugin({
        name: pluginName,
        code: pluginCode,
        version: '1.0.0',
      });
      alert('Plugin published successfully!');
      setPluginName('');
      setPluginCode('');
    } catch (err) {
      alert(`Failed to publish: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Plugin Development Studio</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Create New Plugin</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plugin Name</label>
            <input
              type="text"
              value={pluginName}
              onChange={(e) => setPluginName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="My Awesome Plugin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plugin Code</label>
            <textarea
              value={pluginCode}
              onChange={(e) => setPluginCode(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
              rows={15}
              placeholder="export function init() { ... }"
            />
          </div>
          <button
            onClick={handlePublish}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Publish Plugin
          </button>
        </div>
      </div>
    </div>
  );
};
