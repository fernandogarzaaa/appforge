import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { useAdvancedSettings } from '../../phase4/settings/useAdvancedSettings';
// Placeholder - hook not available in animation version
const useAdvancedSettings = () => ({});
import { useAnimations } from './useAnimations';
import { useAccessibility } from '../accessibility/useAccessibility';
import { useResponsive } from '../responsive/useResponsive';
import { AnimatedCard, AnimatedToggle, AnimatedButton, AnimatedModal } from './AnimatedComponents';

/**
 * AnimatedSettingsPanel
 * 
 * Demonstrates Phase 4 Settings Panel enhanced with Phase 5 animations.
 * Features smooth settings transitions, animated toggles, and accessibility.
 * 
 * Props:
 *   - onSettingChange: Callback when setting changes
 *   - onSave: Callback when settings are saved
 *   - onReset: Callback when settings are reset
 * 
 * Features:
 *   - Smooth settings group transitions
 *   - Animated toggle switches
 *   - Import/export modal animations
 *   - Settings preview with animations
 *   - Accessibility announcements
 *   - Responsive layout support
 */
export function AnimatedSettingsPanel({ onSettingChange, onSave, onReset }) {
  const [activeGroup, setActiveGroup] = useState('appearance');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState(new Set());

  const { settings, updateSetting, exportSettings, importSettings, resetSettings } =
    useAdvancedSettings();

  const animations = useAnimations();
  const { announce, toggleHighContrast, toggleScreenReader, createAccessibleButton } =
    useAccessibility();
  const { isMobile, isDesktop } = useResponsive();

  // Handle setting change
  const handleSettingChange = useCallback(
    async (key, value) => {
      setHasChanges(true);
      announce(`Updated ${key} to ${value}`, 'polite');
      try {
        await updateSetting(key, value);
        if (onSettingChange) onSettingChange(key, value);
      } catch (error) {
        console.error('Error updating setting:', error);
        announce(`Failed to update ${key}`, 'assertive');
      }
    },
    [updateSetting, announce, onSettingChange]
  );

  // Handle save
  const handleSave = useCallback(async () => {
    announce('Settings saved successfully', 'polite');
    setHasChanges(false);
    if (onSave) onSave();
  }, [announce, onSave]);

  // Handle reset
  const handleReset = useCallback(async () => {
    announce('Settings reset to defaults', 'polite');
    setShowResetConfirm(false);
    try {
      await resetSettings();
      setHasChanges(false);
      if (onReset) onReset();
    } catch (error) {
      console.error('Error resetting settings:', error);
      announce('Failed to reset settings', 'assertive');
    }
  }, [resetSettings, announce, onReset]);

  // Handle export
  const handleExport = useCallback(async () => {
    announce('Exporting settings', 'polite');
    try {
      const exported = await exportSettings();
      const blob = new Blob([JSON.stringify(exported, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'appforge-settings.json';
      a.click();
      URL.revokeObjectURL(url);
      announce('Settings exported successfully', 'polite');
      setShowExportModal(false);
    } catch (error) {
      console.error('Error exporting settings:', error);
      announce('Failed to export settings', 'assertive');
    }
  }, [exportSettings, announce]);

  // Handle import
  const handleImport = useCallback(
    async (file) => {
      announce('Importing settings', 'polite');
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await importSettings(data);
        announce('Settings imported successfully', 'polite');
        setShowImportModal(false);
      } catch (error) {
        console.error('Error importing settings:', error);
        announce('Failed to import settings', 'assertive');
      }
    },
    [importSettings, announce]
  );

  // Toggle setting expansion
  const toggleExpanded = useCallback((settingKey) => {
    setExpandedSettings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(settingKey)) {
        newSet.delete(settingKey);
      } else {
        newSet.add(settingKey);
      }
      return newSet;
    });
  }, []);

  const settingGroups = [
    {
      id: 'appearance',
      label: '🎨 Appearance',
      icon: '🎨',
      settings: [
        {
          key: 'theme',
          label: 'Theme',
          type: 'select',
          options: ['Light', 'Dark', 'Auto'],
          description: 'Choose your preferred color scheme',
        },
        {
          key: 'fontSize',
          label: 'Font Size',
          type: 'slider',
          min: 12,
          max: 20,
          description: 'Adjust text size for better readability',
        },
        {
          key: 'highContrast',
          label: 'High Contrast',
          type: 'toggle',
          description: 'Increase contrast for better visibility',
        },
        {
          key: 'animations',
          label: 'Animations',
          type: 'toggle',
          description: 'Enable smooth transitions and animations',
        },
      ],
    },
    {
      id: 'accessibility',
      label: '♿ Accessibility',
      icon: '♿',
      settings: [
        {
          key: 'screenReader',
          label: 'Screen Reader',
          type: 'toggle',
          description: 'Enable screen reader support',
        },
        {
          key: 'reducedMotion',
          label: 'Reduce Motion',
          type: 'toggle',
          description: 'Minimize animations and transitions',
        },
        {
          key: 'keyboardNav',
          label: 'Enhanced Keyboard Navigation',
          type: 'toggle',
          description: 'Full keyboard navigation support',
        },
        {
          key: 'focusIndicator',
          label: 'Focus Indicators',
          type: 'select',
          options: ['Subtle', 'Normal', 'Bold'],
          description: 'Control keyboard focus visibility',
        },
      ],
    },
    {
      id: 'notifications',
      label: '🔔 Notifications',
      icon: '🔔',
      settings: [
        {
          key: 'emailNotifications',
          label: 'Email Notifications',
          type: 'toggle',
          description: 'Receive updates via email',
        },
        {
          key: 'pushNotifications',
          label: 'Push Notifications',
          type: 'toggle',
          description: 'Browser push notifications',
        },
        {
          key: 'activityDigest',
          label: 'Activity Digest',
          type: 'select',
          options: ['Daily', 'Weekly', 'Never'],
          description: 'How often to send activity summaries',
        },
        {
          key: 'soundEnabled',
          label: 'Sound Effects',
          type: 'toggle',
          description: 'Play sounds for notifications',
        },
      ],
    },
    {
      id: 'privacy',
      label: '🔒 Privacy',
      icon: '🔒',
      settings: [
        {
          key: 'analytics',
          label: 'Analytics',
          type: 'toggle',
          description: 'Allow usage analytics for improvements',
        },
        {
          key: 'crashReports',
          label: 'Crash Reports',
          type: 'toggle',
          description: 'Send crash reports to help fix issues',
        },
        {
          key: 'dataRetention',
          label: 'Data Retention',
          type: 'select',
          options: ['30 days', '90 days', '1 year', 'Forever'],
          description: 'How long to keep your data',
        },
        {
          key: 'twoFactor',
          label: 'Two-Factor Authentication',
          type: 'toggle',
          description: 'Require 2FA for account access',
        },
      ],
    },
  ];

  const currentGroup = settingGroups.find((g) => g.id === activeGroup);

  return (
    <motion.div
      className="space-y-6"
      variants={animations.containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        className="flex justify-between items-center"
        variants={animations.itemVariants}
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Customize your AppForge experience
          </p>
        </div>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-amber-600 dark:text-amber-400"
          >
            <span className="w-2 h-2 bg-amber-600 dark:bg-amber-400 rounded-full animate-pulse"></span>
            Unsaved changes
          </motion.div>
        )}
      </motion.div>

      <div className={`grid gap-6 ${isDesktop ? 'grid-cols-4' : 'grid-cols-1'}`}>
        {/* Sidebar - Group Navigation */}
        <motion.div
          className={`${isDesktop ? 'col-span-1' : 'col-span-1'}`}
          variants={animations.itemVariants}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-6">
            <div className="space-y-1 p-3">
              {settingGroups.map((group) => (
                <motion.button
                  key={group.id}
                  onClick={() => setActiveGroup(group.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeGroup === group.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                  }`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{group.icon}</span>
                    <span className="font-medium text-sm">{group.label}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main Settings */}
        <motion.div
          className={`${isDesktop ? 'col-span-3' : 'col-span-1'} space-y-6`}
          variants={animations.itemVariants}
        >
          <AnimatePresence mode="wait">
            {currentGroup && (
              <motion.div
                key={activeGroup}
                variants={animations.containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-4"
              >
                {currentGroup.settings.map((setting, index) => (
                  <AnimatedCard
                    key={setting.key}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                    whileHover={{ scale: 1.01 }}
                  >
                    <motion.button
                      onClick={() => toggleExpanded(setting.key)}
                      className="w-full text-left px-6 py-4 flex items-start justify-between"
                      variants={animations.itemVariants}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {setting.label}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {setting.description}
                        </p>
                      </div>
                      <motion.span
                        animate={{
                          rotate: expandedSettings.has(setting.key) ? 180 : 0,
                        }}
                        className="text-gray-400 dark:text-gray-600 ml-4 flex-shrink-0"
                      >
                        ▼
                      </motion.span>
                    </motion.button>

                    {/* Setting Control */}
                    <AnimatePresence>
                      {expandedSettings.has(setting.key) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-6 pb-4 border-t border-gray-100 dark:border-gray-700"
                        >
                          {setting.type === 'toggle' && (
                            <AnimatedToggle
                              isOpen={settings[setting.key] || false}
                              onClick={() =>
                                handleSettingChange(
                                  setting.key,
                                  !settings[setting.key]
                                )
                              }
                            >
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings[setting.key] || false}
                                  onChange={(e) =>
                                    handleSettingChange(setting.key, e.target.checked)
                                  }
                                  className="w-5 h-5 rounded accent-blue-600"
                                />
                                <span className="text-gray-700 dark:text-gray-300">
                                  {settings[setting.key] ? 'Enabled' : 'Disabled'}
                                </span>
                              </label>
                            </AnimatedToggle>
                          )}

                          {setting.type === 'select' && (
                            <select
                              value={settings[setting.key] || setting.options[0]}
                              onChange={(e) =>
                                handleSettingChange(setting.key, e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              {setting.options.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          )}

                          {setting.type === 'slider' && (
                            <div className="space-y-2">
                              <input
                                type="range"
                                min={setting.min}
                                max={setting.max}
                                value={settings[setting.key] || setting.min}
                                onChange={(e) =>
                                  handleSettingChange(
                                    setting.key,
                                    parseInt(e.target.value)
                                  )
                                }
                                className="w-full accent-blue-600"
                              />
                              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>{setting.min}px</span>
                                <span className="font-medium">
                                  {settings[setting.key] || setting.min}px
                                </span>
                                <span>{setting.max}px</span>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </AnimatedCard>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <motion.div
            className="flex gap-3 justify-between pt-6 border-t border-gray-200 dark:border-gray-700"
            variants={animations.itemVariants}
          >
            <div className="flex gap-3">
              <AnimatedButton
                onClick={() => setShowImportModal(true)}
                {...createAccessibleButton({
                  label: 'Import settings from file',
                })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                ↑ Import
              </AnimatedButton>

              <AnimatedButton
                onClick={() => setShowExportModal(true)}
                {...createAccessibleButton({
                  label: 'Export settings to file',
                })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                ↓ Export
              </AnimatedButton>

              <AnimatedButton
                onClick={() => setShowResetConfirm(true)}
                {...createAccessibleButton({
                  label: 'Reset settings to defaults',
                })}
                className="px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                ↻ Reset
              </AnimatedButton>
            </div>

            <AnimatedButton
              onClick={handleSave}
              disabled={!hasChanges}
              {...createAccessibleButton({
                label: 'Save settings',
                disabled: !hasChanges,
              })}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              ✓ Save Changes
            </AnimatedButton>
          </motion.div>
        </motion.div>
      </div>

      {/* Export Modal */}
      <AnimatedModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Settings"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Download your settings as a JSON file. You can import these settings
            on another device.
          </p>
          <div className="flex gap-3 justify-end">
            <AnimatedButton
              onClick={() => setShowExportModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              Cancel
            </AnimatedButton>
            <AnimatedButton
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Export Settings
            </AnimatedButton>
          </div>
        </div>
      </AnimatedModal>

      {/* Import Modal */}
      <AnimatedModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Settings"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Select a settings file to import. This will override your current
            settings.
          </p>
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleImport(e.target.files[0]);
              }
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white"
          />
          <div className="flex gap-3 justify-end">
            <AnimatedButton
              onClick={() => setShowImportModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              Cancel
            </AnimatedButton>
          </div>
        </div>
      </AnimatedModal>

      {/* Reset Confirmation Modal */}
      <AnimatedModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Reset Settings"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to reset all settings to their default values?
            This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <AnimatedButton
              onClick={() => setShowResetConfirm(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              Cancel
            </AnimatedButton>
            <AnimatedButton
              onClick={handleReset}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Reset Settings
            </AnimatedButton>
          </div>
        </div>
      </AnimatedModal>
    </motion.div>
  );
}

export default AnimatedSettingsPanel;
