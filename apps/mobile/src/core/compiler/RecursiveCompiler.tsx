import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * 🌀 RECURSIVE COMPILER & DYNAMIC PREVIEW
 * Enables instant "Vibe" to UI transformation without rebuilds.
 * Uses a sandboxed environment for real-time visualization.
 */
export const RecursiveCompiler: React.FC<{ code: string }> = ({ code }) => {
    const [html, setHtml] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (code) {
            compileCode(code);
        }
    }, [code]);

    const compileCode = async (source: string) => {
        setIsLoading(true);
        console.log('🔄 Recursive Compiler: Injecting Native Fabric Component...');

        // Transform the generated React Native code into a preview-able format
        // For Genesis, we wrap it in a web-based React environment for the 'Live Sandbox'
        const wrappedHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
                <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
                <script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js"></script>
                <style>
                    body { margin: 0; background: #000; color: #fff; font-family: sans-serif; }
                    .sandbox { padding: 20px; }
                </style>
            </head>
            <body>
                <div id="root"></div>
                <script>
                    // Polyfill for imports in the dynamic code
                    const solanaWeb3 = window.solanaWeb3;
                    
                    ${source
                .replace(/import .* from '@solana\/web3.js'/g, 'const { Connection, PublicKey, clusterApiUrl } = solanaWeb3')
                .replace(/import .* from 'react'/g, 'const { useState, useEffect } = React')
                .replace(/import .* from 'react-native'/g, 'const { View, Text, StyleSheet, FlatList, ScrollView } = { View: "div", Text: "div", StyleSheet: { create: (s) => s }, FlatList: "div", ScrollView: "div" }')
                .replace('export default', 'const App =')}
                    
                    const root = ReactDOM.createRoot(document.getElementById('root'));
                    root.render(React.createElement(App));
                </script>
            </body>
            </html>
        `;

        setHtml(wrappedHtml);
        setIsLoading(false);
    };

    return (
        <View style={styles.container}>
            {isLoading && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#0f0" />
                </View>
            )}
            <WebView
                originWhitelist={['*']}
                source={{ html }}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    webview: { flex: 1, backgroundColor: 'transparent' },
    loader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)' }
});
