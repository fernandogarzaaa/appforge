import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

/**
 * Design System Showcase
 * Demonstrates consistent theming and component patterns
 */

export default function DesignSystemShowcase() {
  const [activeTab, setActiveTab] = useState('colors');

  // Color palette
  const colorScales = {
    blue: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
    purple: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
    green: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
    red: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  };

  const colorMap = {
    blue: {
      50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
      500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a'
    },
    purple: {
      50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc',
      500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87'
    },
    green: {
      50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80',
      500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#145231'
    },
    red: {
      50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171',
      500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d'
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Design System</h1>
        <p className="text-gray-600">Consistent components, colors, and patterns</p>
      </div>

      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="spacing">Spacing</TabsTrigger>
        </TabsList>

        {/* Colors */}
        <TabsContent value="colors" className="space-y-6">
          {Object.entries(colorMap).map(([name, colors]) => (
            <div key={name}>
              <h3 className="text-lg font-semibold mb-3 capitalize">{name}</h3>
              <div className="flex gap-1">
                {Object.entries(colors).map(([shade, hex]) => (
                  <motion.div
                    key={shade}
                    whileHover={{ scale: 1.1 }}
                    className="flex-1 h-12 rounded-lg shadow-sm cursor-pointer transition-all"
                    style={{ backgroundColor: hex }}
                    title={`${name}-${shade}: ${hex}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Components */}
        <TabsContent value="components" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Buttons</h3>
            <div className="flex flex-wrap gap-3">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Badges</h3>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Error</Badge>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Cards</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Card Title</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Card content goes here</p>
                </CardContent>
              </Card>
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-sm">Featured Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Highlighted variant</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Typography */}
        <TabsContent value="typography" className="space-y-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">XSmall</p>
              <p className="text-xs">The quick brown fox jumps over the lazy dog</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Small</p>
              <p className="text-sm">The quick brown fox jumps over the lazy dog</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Base</p>
              <p className="text-base">The quick brown fox jumps over the lazy dog</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Large</p>
              <p className="text-lg">The quick brown fox jumps over the lazy dog</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Extra Large</p>
              <p className="text-xl">The quick brown fox jumps over the lazy dog</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Heading</p>
              <h3 className="text-2xl font-bold">The quick brown fox</h3>
            </div>
          </div>
        </TabsContent>

        {/* Spacing */}
        <TabsContent value="spacing" className="space-y-6">
          <div className="space-y-4">
            {[4, 8, 12, 16, 20, 24, 32].map(size => (
              <div key={size} className="flex items-center gap-4">
                <div className="w-20 text-sm font-mono text-gray-600">{size}px</div>
                <motion.div
                  className="h-8 bg-blue-500 rounded"
                  style={{ width: `${size * 4}px` }}
                  whileHover={{ scale: 1.05 }}
                />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}