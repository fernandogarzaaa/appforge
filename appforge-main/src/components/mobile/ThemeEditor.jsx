import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ThemeEditor({ app, onChange }) {
  const updateTheme = (key, value) => {
    onChange({
      ...app,
      theme: { ...app.theme, [key]: value }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>App Theme</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label>Primary Color</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="color"
                value={app.theme?.primary_color || '#3b82f6'}
                onChange={(e) => updateTheme('primary_color', e.target.value)}
                className="w-20 h-10"
              />
              <Input
                value={app.theme?.primary_color || '#3b82f6'}
                onChange={(e) => updateTheme('primary_color', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Secondary Color</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="color"
                value={app.theme?.secondary_color || '#10b981'}
                onChange={(e) => updateTheme('secondary_color', e.target.value)}
                className="w-20 h-10"
              />
              <Input
                value={app.theme?.secondary_color || '#10b981'}
                onChange={(e) => updateTheme('secondary_color', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Background Color</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="color"
                value={app.theme?.background_color || '#ffffff'}
                onChange={(e) => updateTheme('background_color', e.target.value)}
                className="w-20 h-10"
              />
              <Input
                value={app.theme?.background_color || '#ffffff'}
                onChange={(e) => updateTheme('background_color', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Theme Preview */}
        <div className="border-t pt-6">
          <Label className="mb-4 block">Preview</Label>
          <div className="space-y-3">
            <div 
              className="p-4 rounded-lg text-white font-semibold"
              style={{ backgroundColor: app.theme?.primary_color }}
            >
              Primary Button
            </div>
            <div 
              className="p-4 rounded-lg text-white font-semibold"
              style={{ backgroundColor: app.theme?.secondary_color }}
            >
              Secondary Button
            </div>
            <div 
              className="p-4 rounded-lg border-2"
              style={{ 
                backgroundColor: app.theme?.background_color,
                borderColor: app.theme?.primary_color
              }}
            >
              Background with Primary Border
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}