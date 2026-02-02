/**
 * Cross-Platform Export Manager
 * PWA, React Native, and Electron packaging
 */

export interface ExportConfig {
  platform: 'pwa' | 'react-native' | 'electron';
  projectName: string;
  description: string;
  version: string;
  icon: string;
  splashScreen?: string;
}

export interface PWAConfig extends ExportConfig {
  platform: 'pwa';
  themeColor: string;
  backgroundColor: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui';
  orientation: 'any' | 'portrait' | 'landscape';
  scope: string;
  startUrl: string;
}

export interface ReactNativeConfig extends ExportConfig {
  platform: 'react-native';
  bundleId: string;
  targetOS: 'ios' | 'android' | 'both';
  minSdkVersion?: number;
  targetSdkVersion?: number;
}

export interface ElectronConfig extends ExportConfig {
  platform: 'electron';
  mainFile: string;
  targetPlatforms: ('win' | 'mac' | 'linux')[];
  autoUpdater: boolean;
}

export class CrossPlatformExporter {
  /**
   * Export as Progressive Web App
   */
  async exportPWA(config: PWAConfig): Promise<Map<string, string>> {
    const files = new Map<string, string>();
    
    // Generate manifest.json
    const manifest = {
      name: config.projectName,
      short_name: config.projectName.substring(0, 12),
      description: config.description,
      version: config.version,
      start_url: config.startUrl || '/',
      scope: config.scope || '/',
      display: config.display,
      orientation: config.orientation,
      theme_color: config.themeColor,
      background_color: config.backgroundColor,
      icons: [
        {
          src: config.icon || '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: config.icon || '/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    };
    
    files.set('public/manifest.json', JSON.stringify(manifest, null, 2));
    
    // Generate service worker
    const serviceWorker = `// Service Worker for ${config.projectName}
const CACHE_NAME = '${config.projectName}-v${config.version}';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
`;
    
    files.set('public/service-worker.js', serviceWorker);
    
    // Generate PWA registration script
    const registerSW = `// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}

// Install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

function showInstallButton() {
  const installBtn = document.getElementById('install-button');
  if (installBtn) {
    installBtn.style.display = 'block';
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('Install outcome:', outcome);
        deferredPrompt = null;
      }
    });
  }
}
`;
    
    files.set('src/registerSW.js', registerSW);
    
    // Update index.html
    const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <link rel="icon" href="/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="${config.themeColor}" />
  <meta name="description" content="${config.description}" />
  <link rel="apple-touch-icon" href="/logo192.png" />
  <link rel="manifest" href="/manifest.json" />
  <title>${config.projectName}</title>
</head>
<body>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <div id="root"></div>
  <button id="install-button" style="display: none;">Install App</button>
  <script src="/src/registerSW.js"></script>
</body>
</html>`;
    
    files.set('public/index.html', indexHTML);
    
    return files;
  }

  /**
   * Export as React Native app
   */
  async exportReactNative(config: ReactNativeConfig): Promise<Map<string, string>> {
    const files = new Map<string, string>();
    
    // package.json
    const packageJSON = {
      name: config.projectName.toLowerCase().replace(/\s+/g, '-'),
      version: config.version,
      description: config.description,
      main: 'index.js',
      scripts: {
        'android': 'react-native run-android',
        'ios': 'react-native run-ios',
        'start': 'react-native start',
        'lint': 'eslint .',
        'test': 'jest'
      },
      dependencies: {
        'react': '^18.2.0',
        'react-native': '^0.72.0',
        '@react-navigation/native': '^6.1.0',
        '@react-navigation/native-stack': '^6.9.0'
      },
      devDependencies: {
        '@babel/core': '^7.22.0',
        '@babel/runtime': '^7.22.0',
        'metro-react-native-babel-preset': '^0.76.0'
      }
    };
    
    files.set('package.json', JSON.stringify(packageJSON, null, 2));
    
    // App.tsx
    const appTSX = `import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.section}>
          <Text style={styles.title}>${config.projectName}</Text>
          <Text style={styles.description}>${config.description}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  section: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  description: {
    marginTop: 8,
    fontSize: 16,
    color: '#6B7280',
  },
});
`;
    
    files.set('App.tsx', appTSX);
    
    // android/app/build.gradle
    const buildGradle = `apply plugin: "com.android.application"
apply plugin: "com.facebook.react"

android {
    namespace "${config.bundleId}"
    compileSdkVersion ${config.targetSdkVersion || 33}
    
    defaultConfig {
        applicationId "${config.bundleId}"
        minSdkVersion ${config.minSdkVersion || 21}
        targetSdkVersion ${config.targetSdkVersion || 33}
        versionCode 1
        versionName "${config.version}"
    }
}

dependencies {
    implementation "com.facebook.react:react-android"
}
`;
    
    files.set('android/app/build.gradle', buildGradle);
    
    // ios/Podfile
    const podfile = `platform :ios, '13.0'
require_relative '../node_modules/react-native/scripts/react_native_pods'

target '${config.projectName}' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true
  )
end
`;
    
    files.set('ios/Podfile', podfile);
    
    return files;
  }

  /**
   * Export as Electron app
   */
  async exportElectron(config: ElectronConfig): Promise<Map<string, string>> {
    const files = new Map<string, string>();
    
    // package.json
    const packageJSON = {
      name: config.projectName.toLowerCase().replace(/\s+/g, '-'),
      version: config.version,
      description: config.description,
      main: config.mainFile || 'main.js',
      scripts: {
        'start': 'electron .',
        'dev': 'electron . --dev',
        'build': 'electron-builder',
        'build:win': 'electron-builder --win',
        'build:mac': 'electron-builder --mac',
        'build:linux': 'electron-builder --linux'
      },
      build: {
        appId: `com.${config.projectName.toLowerCase()}.app`,
        productName: config.projectName,
        directories: {
          output: 'dist'
        },
        files: [
          'build/**/*',
          'node_modules/**/*',
          'package.json'
        ],
        win: {
          target: ['nsis', 'portable'],
          icon: config.icon || 'build/icon.ico'
        },
        mac: {
          target: ['dmg', 'zip'],
          icon: config.icon || 'build/icon.icns',
          category: 'public.app-category.productivity'
        },
        linux: {
          target: ['AppImage', 'deb'],
          icon: config.icon || 'build/icon.png',
          category: 'Utility'
        }
      },
      dependencies: {
        'electron-updater': config.autoUpdater ? '^6.1.0' : undefined
      },
      devDependencies: {
        'electron': '^25.0.0',
        'electron-builder': '^24.0.0'
      }
    };
    
    files.set('package.json', JSON.stringify(packageJSON, null, 2));
    
    // main.js
    const mainJS = `const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
${config.autoUpdater ? "const { autoUpdater } = require('electron-updater');" : ''}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '${config.icon || 'build/icon.png'}')
  });

  // Load app
  const startUrl = process.env.DEV_MODE
    ? 'http://localhost:3000'
    : \`file://\${path.join(__dirname, '../build/index.html')}\`;
  
  mainWindow.loadURL(startUrl);

  // Open DevTools in dev mode
  if (process.env.DEV_MODE) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();
  ${config.autoUpdater ? 'checkForUpdates();' : ''}
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

${config.autoUpdater ? `
function checkForUpdates() {
  autoUpdater.checkForUpdatesAndNotify();
  
  autoUpdater.on('update-available', () => {
    console.log('Update available');
  });
  
  autoUpdater.on('update-downloaded', () => {
    console.log('Update downloaded');
  });
}` : ''}
`;
    
    files.set('main.js', mainJS);
    
    // preload.js
    const preloadJS = `const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  }
});
`;
    
    files.set('preload.js', preloadJS);
    
    return files;
  }

  /**
   * Generate deployment scripts
   */
  async generateDeploymentScripts(config: ExportConfig): Promise<Map<string, string>> {
    const scripts = new Map<string, string>();
    
    if (config.platform === 'pwa') {
      scripts.set('deploy-pwa.sh', `#!/bin/bash
# Deploy PWA to static hosting
npm run build
# Upload to hosting (Netlify, Vercel, etc.)
echo "Deploy built PWA from ./build directory"
`);
    }
    
    if (config.platform === 'react-native') {
      scripts.set('deploy-rn.sh', `#!/bin/bash
# Build and deploy React Native app

# Android
cd android && ./gradlew assembleRelease
echo "Android APK: android/app/build/outputs/apk/release/app-release.apk"

# iOS
cd ../ios && xcodebuild -workspace ${config.projectName}.xcworkspace -scheme ${config.projectName} -configuration Release
echo "iOS app built"
`);
    }
    
    if (config.platform === 'electron') {
      scripts.set('deploy-electron.sh', `#!/bin/bash
# Build Electron app for all platforms
npm run build:win
npm run build:mac
npm run build:linux
echo "Electron builds in ./dist directory"
`);
    }
    
    return scripts;
  }
}

export default CrossPlatformExporter;
