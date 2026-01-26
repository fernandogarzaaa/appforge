import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone } from 'lucide-react';

export default function MobilePreview({ app }) {
  const [device, setDevice] = useState('iphone');
  const [orientation, setOrientation] = useState('portrait');
  const currentScreen = app.screens?.[0] || { name: 'Home', components: [] };

  const devices = {
    iphone: { name: 'iPhone 15 Pro', width: 393, height: 852, os: 'iOS 17', frame: 'bg-gray-900' },
    android: { name: 'Pixel 8', width: 412, height: 915, os: 'Android 14', frame: 'bg-gray-800' },
    ipad: { name: 'iPad Pro', width: 1024, height: 1366, os: 'iPadOS 17', frame: 'bg-gray-900' }
  };

  const currentDevice = devices[device];
  const isLandscape = orientation === 'landscape';

  return (
    <div className="sticky top-6">
      <div className="mb-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Live Preview
        </h3>
        
        <Tabs value={device} onValueChange={setDevice} className="mb-2">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="iphone" className="text-xs">iPhone</TabsTrigger>
            <TabsTrigger value="android" className="text-xs">Android</TabsTrigger>
            <TabsTrigger value="ipad" className="text-xs">iPad</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={orientation === 'portrait' ? 'default' : 'outline'}
            onClick={() => setOrientation('portrait')}
            className="flex-1"
          >
            Portrait
          </Button>
          <Button
            size="sm"
            variant={orientation === 'landscape' ? 'default' : 'outline'}
            onClick={() => setOrientation('landscape')}
            className="flex-1"
          >
            Landscape
          </Button>
        </div>
      </div>
      
      {/* Phone Frame */}
      <div className={`${currentDevice.frame} rounded-[2.5rem] p-3 shadow-2xl ${isLandscape ? 'transform rotate-90 origin-center my-32' : ''}`}>
        <div 
          className="bg-white rounded-[2rem] overflow-hidden"
          style={{ 
            width: isLandscape ? `${currentDevice.height * 0.3}px` : `${currentDevice.width * 0.3}px`,
            height: isLandscape ? `${currentDevice.width * 0.3}px` : `${currentDevice.height * 0.3}px`
          }}
        >
          {/* Status Bar */}
          <div className="bg-white px-4 py-2 flex justify-between items-center text-[10px] border-b">
            <span>9:41</span>
            <div className="flex gap-1 items-center">
              <div className="w-3 h-2 border border-black rounded-sm"></div>
              <Smartphone className="w-3 h-3" />
            </div>
          </div>

          {/* App Content */}
          <div 
            className="p-3 overflow-auto"
            style={{ 
              backgroundColor: app.theme?.background_color || '#ffffff',
              height: 'calc(100% - 32px)'
            }}
          >
            <h1 className="text-lg font-bold mb-3" style={{ color: app.theme?.primary_color || '#000000' }}>
              {currentScreen.name}
            </h1>

            {/* Components Preview */}
            <div className="space-y-2">
              {currentScreen.components?.map((comp, idx) => (
                <Card key={idx} className="p-2">
                  <div className="text-xs font-medium">{comp.type || 'Component'}</div>
                </Card>
              ))}
              
              {(!currentScreen.components || currentScreen.components.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-[10px]">Add components to see preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Device Info */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        {currentDevice.name} • {currentDevice.os}
      </div>
    </div>
  );
}