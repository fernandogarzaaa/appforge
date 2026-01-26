import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Copy, Code } from 'lucide-react';
import { toast } from 'sonner';

export default function CodeExport({ app }) {
  const [activeTab, setActiveTab] = useState('react-native');

  const generateReactNativeCode = () => {
    return `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ${app.screens?.[0]?.name.replace(/\s/g, '')}Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>${app.screens?.[0]?.name}</Text>
      ${app.screens?.[0]?.components?.map(c => 
        `<Text>${c.props?.text || 'Component'}</Text>`
      ).join('\n      ') || ''}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '${app.theme?.background_color}',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '${app.theme?.primary_color}',
    marginBottom: 16,
  },
});`;
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  const downloadCode = (code, filename) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('File downloaded!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5" />
          Export Source Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="react-native">React Native</TabsTrigger>
            <TabsTrigger value="flutter">Flutter</TabsTrigger>
            <TabsTrigger value="config">App Config</TabsTrigger>
          </TabsList>

          <TabsContent value="react-native">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyCode(generateReactNativeCode())}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button 
                  size="sm"
                  onClick={() => downloadCode(generateReactNativeCode(), 'App.js')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {generateReactNativeCode()}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="flutter">
            <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
              Flutter export coming soon!
            </div>
          </TabsContent>

          <TabsContent value="config">
            <div className="space-y-4">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify({
                  name: app.name,
                  bundleId: app.build_config?.bundle_id || 'com.example.app',
                  version: app.build_config?.version || '1.0.0',
                  theme: app.theme
                }, null, 2)}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}