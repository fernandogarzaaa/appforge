import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, Download, Upload, Folder } from 'lucide-react';
import { useAdvancedSettings } from './useAdvancedSettings';

/**
 * SettingsPanel Component
 * Displays comprehensive user settings management including notifications, privacy, accessibility, and performance settings
 * Features: Nested settings management, Custom settings, Settings import/export, Settings groups/profiles
 */
export const SettingsPanel = () => {
  const {
    userSettings,
    updateUserSettings,
    customSettings,
    createCustomSetting,
    updateCustomSetting,
    getSetting,
    getAllSettingsFlat,
    resetToDefaults,
    exportSettings,
    importSettings,
    settingsGroups,
    createSettingsGroup,
    applySettingsGroup,
    validateSettings,
  } = useAdvancedSettings();

  const [activeTab, setActiveTab] = useState('notifications');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [newCustom, setNewCustom] = useState({ key: '', value: '', metadata: {} });
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [showImportForm, setShowImportForm] = useState(false);
  const [importData, setImportData] = useState('');
  const [saveStatus, setSaveStatus] = useState(null);

  const handleToggleSetting = (key, value) => {
    updateUserSettings(key, !value);
    setSaveStatus('Saving...');
    setTimeout(() => setSaveStatus('Saved ✓'), 1000);
  };

  const handleCustomSetting = () => {
    if (newCustom.key && newCustom.value !== '') {
      createCustomSetting(newCustom.key, newCustom.value, newCustom.metadata);
      setNewCustom({ key: '', value: '', metadata: {} });
      setShowCustomForm(false);
      setSaveStatus('Custom setting created ✓');
    }
  };

  const handleCreateGroup = () => {
    if (newGroup.name) {
      const currentSettings = getAllSettingsFlat();
      createSettingsGroup(newGroup.name, currentSettings);
      setNewGroup({ name: '', description: '' });
      setShowGroupForm(false);
      setSaveStatus('Settings group created ✓');
    }
  };

  const handleExport = () => {
    const data = exportSettings();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2)));
    element.setAttribute('download', 'settings.json');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setSaveStatus('Settings exported ✓');
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importData);
      importSettings(data);
      setImportData('');
      setShowImportForm(false);
      setSaveStatus('Settings imported ✓');
    } catch (error) {
      setSaveStatus('Invalid JSON format');
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      resetToDefaults();
      setSaveStatus('Settings reset to defaults ✓');
    }
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-orange-400" />
          <h2 className="text-2xl font-bold text-white">Settings & Preferences</h2>
        </div>
        <div className="flex gap-2">
          {saveStatus && (
            <div className="px-3 py-2 bg-green-500/10 border border-green-500/50 text-green-400 text-sm rounded-lg">
              {saveStatus}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 flex-wrap">
        {['notifications', 'privacy', 'accessibility', 'performance', 'custom', 'groups'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize transition ${
              activeTab === tab
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'groups' ? 'Profiles' : tab}
          </button>
        ))}
      </div>

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {[
              { key: 'notifications.email', label: 'Email Notifications' },
              { key: 'notifications.push', label: 'Push Notifications' },
              { key: 'notifications.inApp', label: 'In-App Notifications' },
              { key: 'notifications.digest', label: 'Weekly Digest' },
            ].map(setting => (
              <div key={setting.key} className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
                <label className="text-white font-medium">{setting.label}</label>
                <button
                  onClick={() => handleToggleSetting(setting.key, getSetting(setting.key, false))}
                  className={`w-12 h-6 rounded-full transition ${
                    getSetting(setting.key, false)
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-slate-600 hover:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition transform ${
                      getSetting(setting.key, false) ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy Tab */}
      {activeTab === 'privacy' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {[
              { key: 'privacy.shareActivity', label: 'Share Activity with Team' },
              { key: 'privacy.analyticsTracking', label: 'Allow Analytics Tracking' },
              { key: 'privacy.profileVisibility', label: 'Make Profile Public' },
            ].map(setting => (
              <div key={setting.key} className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
                <label className="text-white font-medium">{setting.label}</label>
                <button
                  onClick={() => handleToggleSetting(setting.key, getSetting(setting.key, true))}
                  className={`w-12 h-6 rounded-full transition ${
                    getSetting(setting.key, true)
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-slate-600 hover:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition transform ${
                      getSetting(setting.key, true) ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accessibility Tab */}
      {activeTab === 'accessibility' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {[
              { key: 'accessibility.highContrast', label: 'High Contrast Mode', type: 'toggle' },
              { key: 'accessibility.screenReader', label: 'Screen Reader Support', type: 'toggle' },
            ].map(setting => (
              <div key={setting.key} className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
                <label className="text-white font-medium">{setting.label}</label>
                <button
                  onClick={() => handleToggleSetting(setting.key, getSetting(setting.key, false))}
                  className={`w-12 h-6 rounded-full transition ${
                    getSetting(setting.key, false)
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-slate-600 hover:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition transform ${
                      getSetting(setting.key, false) ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}

            {/* Font Size and Reduced Motion */}
            <div className="bg-slate-800 rounded-lg p-4">
              <label className="text-white font-medium block mb-2">Font Size</label>
              <select
                value={getSetting('accessibility.fontSize', 'medium')}
                onChange={(e) => updateUserSettings('accessibility.fontSize', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
              <label className="text-white font-medium">Reduce Motion</label>
              <button
                onClick={() => handleToggleSetting('accessibility.reducedMotion', getSetting('accessibility.reducedMotion', false))}
                className={`w-12 h-6 rounded-full transition ${
                  getSetting('accessibility.reducedMotion', false)
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-slate-600 hover:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition transform ${
                    getSetting('accessibility.reducedMotion', false) ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {[
              { key: 'performance.caching', label: 'Enable Caching' },
              { key: 'performance.compression', label: 'Enable Compression' },
              { key: 'performance.imageOptimization', label: 'Optimize Images' },
              { key: 'performance.lazyLoading', label: 'Lazy Load Content' },
            ].map(setting => (
              <div key={setting.key} className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
                <label className="text-white font-medium">{setting.label}</label>
                <button
                  onClick={() => handleToggleSetting(setting.key, getSetting(setting.key, true))}
                  className={`w-12 h-6 rounded-full transition ${
                    getSetting(setting.key, true)
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-slate-600 hover:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition transform ${
                      getSetting(setting.key, true) ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Settings Tab */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          <button
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Add Custom Setting
          </button>

          {showCustomForm && (
            <div className="bg-slate-800 rounded-lg p-4 space-y-3">
              <input
                type="text"
                placeholder="Setting Key (e.g., theme.color)"
                value={newCustom.key}
                onChange={(e) => setNewCustom({ ...newCustom, key: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:border-orange-500 outline-none"
              />
              <input
                type="text"
                placeholder="Value"
                value={newCustom.value}
                onChange={(e) => setNewCustom({ ...newCustom, value: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:border-orange-500 outline-none"
              />
              <button
                onClick={handleCustomSetting}
                className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition"
              >
                Create Setting
              </button>
            </div>
          )}

          {Object.keys(customSettings).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-white font-semibold">Custom Settings</h3>
              {Object.entries(customSettings).map(([key, value]) => (
                <div key={key} className="bg-slate-800 rounded-lg p-4">
                  <p className="text-white font-medium">{key}</p>
                  <p className="text-slate-400 text-sm">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Groups/Profiles Tab */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          <button
            onClick={() => setShowGroupForm(!showGroupForm)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition"
          >
            <Folder className="w-4 h-4" />
            Save Profile
          </button>

          {showGroupForm && (
            <div className="bg-slate-800 rounded-lg p-4 space-y-3">
              <input
                type="text"
                placeholder="Profile Name"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:border-orange-500 outline-none"
              />
              <button
                onClick={handleCreateGroup}
                className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition"
              >
                Save Profile
              </button>
            </div>
          )}

          {Object.keys(settingsGroups).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-white font-semibold">Saved Profiles</h3>
              {Object.entries(settingsGroups).map(([groupId, group]) => (
                <div key={groupId} className="bg-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{group.name}</p>
                      <p className="text-slate-400 text-xs">Created: {new Date(group.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => {
                        applySettingsGroup(groupId);
                        setSaveStatus('Profile applied ✓');
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Import/Export Section */}
      <div className="border-t border-slate-700 pt-6">
        <h3 className="text-white font-semibold mb-4">Import/Export</h3>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Download className="w-4 h-4" />
            Export Settings
          </button>
          <button
            onClick={() => setShowImportForm(!showImportForm)}
            className="flex items-center gap-2 flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Upload className="w-4 h-4" />
            Import Settings
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            <RotateCcw className="w-4 h-4" />
            Reset All
          </button>
        </div>

        {showImportForm && (
          <div className="mt-4 bg-slate-800 rounded-lg p-4 space-y-3">
            <textarea
              placeholder="Paste your settings JSON here"
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:border-blue-500 outline-none h-32 font-mono text-xs"
            />
            <button
              onClick={handleImport}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Import Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Add the Plus icon import that was missing
const Plus = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export default SettingsPanel;
