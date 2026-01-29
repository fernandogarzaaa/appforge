import React from 'react';
import { useThemeManager, PRESET_THEMES } from './useThemeManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sun, Moon, Palette } from 'lucide-react';

/**
 * Theme Manager Component
 */
export function ThemeManager() {
  const {
    theme,
    switchTheme,
    toggleTheme,
    customTheme,
    updateCustomTheme,
    timeBasedTheme,
    enableTimeBasedTheme,
  } = useThemeManager();

  const [showColorPicker, setShowColorPicker] = React.useState(false);

  const applyPresetTheme = (presetTheme) => {
    updateCustomTheme(presetTheme);
  };

  return (
    <div className="space-y-6">
      {/* Theme Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-lg mb-4">Theme</h3>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={() => switchTheme('light')}
            variant={theme === 'light' ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            <Sun className="w-4 h-4" />
            Light
          </Button>
          
          <Button
            onClick={() => switchTheme('dark')}
            variant={theme === 'dark' ? 'default' : 'outline'}
            className="flex items-center gap-2"
          >
            <Moon className="w-4 h-4" />
            Dark
          </Button>
          
          <Button
            onClick={toggleTheme}
            variant="outline"
          >
            Toggle
          </Button>
        </div>
      </div>

      {/* Time-Based Theme */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={timeBasedTheme}
            onChange={(e) => enableTimeBasedTheme(e.target.checked)}
            className="w-5 h-5"
          />
          <span className="font-medium">
            Auto-switch theme based on time (8 PM - 6 AM)
          </span>
        </label>
      </div>

      {/* Preset Themes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Preset Themes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(PRESET_THEMES).map(([key, presetTheme]) => (
            <button
              key={key}
              onClick={() => applyPresetTheme(presetTheme)}
              className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors text-left group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: presetTheme.colors.primary }}
                />
                <span className="font-medium group-hover:text-blue-500 transition-colors">
                  {presetTheme.name}
                </span>
              </div>
              <div className="flex gap-1">
                {Object.values(presetTheme.colors).slice(0, 5).map((color, idx) => (
                  <div
                    key={idx}
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Theme Colors */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Custom Colors</h3>
          <Button
            onClick={() => setShowColorPicker(!showColorPicker)}
            variant="outline"
            size="sm"
          >
            {showColorPicker ? 'Done' : 'Edit'}
          </Button>
        </div>

        {showColorPicker && (
          <div className="space-y-3">
            {Object.entries(customTheme.colors).map(([colorKey, colorValue]) => (
              <div key={colorKey} className="flex items-center gap-3">
                <label className="text-sm font-medium min-w-32 capitalize">
                  {colorKey}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorValue}
                    onChange={(e) =>
                      updateCustomTheme({
                        colors: {
                          ...customTheme.colors,
                          [colorKey]: e.target.value,
                        },
                      })
                    }
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={colorValue}
                    onChange={(e) =>
                      updateCustomTheme({
                        colors: {
                          ...customTheme.colors,
                          [colorKey]: e.target.value,
                        },
                      })
                    }
                    className="font-mono"
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {!showColorPicker && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Object.entries(customTheme.colors).map(([colorKey, colorValue]) => (
              <div key={colorKey} className="text-center">
                <div
                  className="w-12 h-12 rounded mb-2 mx-auto border-2 border-gray-200 dark:border-gray-700"
                  style={{ backgroundColor: colorValue }}
                />
                <p className="text-xs font-medium capitalize">{colorKey}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
