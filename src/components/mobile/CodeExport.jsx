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
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';

export default function ${app.screens?.[0]?.name.replace(/\s/g, '')}Screen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>${app.screens?.[0]?.name}</Text>
        ${app.screens?.[0]?.components?.map(c => 
          `<View style={styles.component}>
          <Text style={styles.componentText}>${c.props?.text || 'Component'}</Text>
        </View>`
        ).join('\n        ') || ''}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '${app.theme?.background_color || '#ffffff'}',
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '${app.theme?.primary_color || '#000000'}',
    marginBottom: 20,
  },
  component: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  componentText: {
    fontSize: 16,
    color: '#333',
  },
});`;
  };

  const generateFlutterCode = () => {
    return `import 'package:flutter/material.dart';

class ${app.screens?.[0]?.name.replace(/\s/g, '')}Screen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF${app.theme?.background_color?.replace('#', '') || 'FFFFFF'}),
      appBar: AppBar(
        title: Text('${app.screens?.[0]?.name}'),
        backgroundColor: Color(0xFF${app.theme?.primary_color?.replace('#', '') || '000000'}),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${app.screens?.[0]?.name}',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF${app.theme?.primary_color?.replace('#', '') || '000000'}),
                ),
              ),
              SizedBox(height: 20),
              ${app.screens?.[0]?.components?.map(c => 
                `Container(
                padding: EdgeInsets.all(16.0),
                margin: EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${c.props?.text || 'Component'}',
                  style: TextStyle(fontSize: 16),
                ),
              ),`
              ).join('\n              ') || ''}
            ],
          ),
        ),
      ),
    );
  }
}`;
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
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyCode(generateFlutterCode())}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button 
                  size="sm"
                  onClick={() => downloadCode(generateFlutterCode(), `${app.screens?.[0]?.name.replace(/\s/g, '')}_screen.dart`)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {generateFlutterCode()}
              </pre>
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