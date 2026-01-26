import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, GripVertical, Trash2 } from 'lucide-react';

export default function ScreenEditor({ app, onChange }) {
  const [selectedScreen, setSelectedScreen] = useState(app.screens?.[0]?.id || null);

  const addScreen = () => {
    const newScreen = {
      id: `screen_${Date.now()}`,
      name: 'New Screen',
      type: 'list',
      components: [],
      navigation: {}
    };
    onChange({ ...app, screens: [...(app.screens || []), newScreen] });
  };

  const updateScreen = (screenId, updates) => {
    const updatedScreens = app.screens.map(s => 
      s.id === screenId ? { ...s, ...updates } : s
    );
    onChange({ ...app, screens: updatedScreens });
  };

  const addComponent = (screenId) => {
    const screen = app.screens.find(s => s.id === screenId);
    const newComponent = {
      id: `comp_${Date.now()}`,
      type: 'text',
      props: { text: 'New Component' }
    };
    updateScreen(screenId, { components: [...(screen?.components || []), newComponent] });
  };

  const currentScreen = app.screens?.find(s => s.id === selectedScreen);

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Screens List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Screens</CardTitle>
            <Button size="sm" onClick={addScreen}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {app.screens?.map(screen => (
              <div
                key={screen.id}
                onClick={() => setSelectedScreen(screen.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedScreen === screen.id ? 'bg-blue-100 border-blue-500 border' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">{screen.name}</div>
                <div className="text-xs text-gray-500 capitalize">{screen.type}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Screen Editor */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>
            {currentScreen ? (
              <Input
                value={currentScreen.name}
                onChange={(e) => updateScreen(currentScreen.id, { name: e.target.value })}
                className="text-lg font-semibold"
              />
            ) : (
              'Select a screen'
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentScreen ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Components</h4>
                <Button size="sm" onClick={() => addComponent(currentScreen.id)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Component
                </Button>
              </div>

              <div className="space-y-2">
                {currentScreen.components?.map((component, idx) => (
                  <div key={component.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                    <div className="flex-1">
                      <div className="font-medium capitalize">{component.type}</div>
                      <div className="text-sm text-gray-500">{component.props?.text || 'Component'}</div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}

                {(!currentScreen.components || currentScreen.components.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    <p>No components yet. Add your first component!</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              Select a screen to edit
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}