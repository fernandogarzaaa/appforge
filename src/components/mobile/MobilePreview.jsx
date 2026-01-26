import React from 'react';
import { Card } from '@/components/ui/card';

export default function MobilePreview({ app }) {
  const currentScreen = app.screens?.[0] || { name: 'Home', components: [] };

  return (
    <div className="sticky top-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        Live Preview
      </h3>
      
      {/* Phone Frame */}
      <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
        <div className="bg-white rounded-[2rem] overflow-hidden" style={{ aspectRatio: '9/19.5' }}>
          {/* Status Bar */}
          <div className="bg-white px-6 py-2 flex justify-between items-center text-xs">
            <span>9:41</span>
            <div className="flex gap-1">
              <div className="w-4 h-3 border border-black rounded-sm"></div>
              <div className="w-4 h-3 border border-black rounded-sm"></div>
            </div>
          </div>

          {/* App Content */}
          <div className="p-4" style={{ backgroundColor: app.theme?.background_color || '#ffffff' }}>
            <h1 className="text-2xl font-bold mb-4" style={{ color: app.theme?.primary_color || '#000000' }}>
              {currentScreen.name}
            </h1>

            {/* Components Preview */}
            <div className="space-y-3">
              {currentScreen.components?.map((comp, idx) => (
                <Card key={idx} className="p-3">
                  <div className="text-sm font-medium">{comp.type || 'Component'}</div>
                </Card>
              ))}
              
              {(!currentScreen.components || currentScreen.components.length === 0) && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">Add components to see preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Device Info */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        iPhone 15 Pro • iOS 17
      </div>
    </div>
  );
}