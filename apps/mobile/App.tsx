import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { Mic, ShieldCheck, Zap, Globe, Cpu } from 'lucide-react-native';
import { voiceBridge } from './src/voice/VoiceIntentBridge';
import { synthesisEngine } from './src/engine/SynthesisEngine';
import { RecursiveCompiler } from './src/core/compiler/RecursiveCompiler';
import { BiometricDeploy } from './src/core/security/BiometricDeploy';
import { SilentSentryHUD } from './src/components/SilentSentryHUD';

/**
 * 🌌 META-BUILDER: GENESIS [BUILD #700]
 * The Primary "Flex" App for AppForge Architects.
 */
export default function App() {
    const [transcript, setTranscript] = useState<string>('');
    const [generatedCode, setGeneratedCode] = useState<string>('');
    const [isListening, setIsListening] = useState(false);
    const [isSynthesizing, setIsSynthesizing] = useState(false);

    const handleStartVibe = async () => {
        setIsListening(true);
        const vibe = await voiceBridge.startListening();
        setTranscript(vibe);
        setIsListening(false);

        setIsSynthesizing(true);
        const code = await synthesisEngine.synthesize(vibe);
        setGeneratedCode(code);
        setIsSynthesizing(false);
    };

    const handleDeploy = async () => {
        await BiometricDeploy.deployToProduction({ code: generatedCode });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <SilentSentryHUD />

            {/* Header */}
            <View style={styles.header}>
                <Cpu size={24} color="#0f0" />
                <Text style={styles.title}>META-BUILDER</Text>
                <Zap size={20} color="#0f0" />
            </View>

            {/* Main Pulse / Sandbox */}
            <View style={styles.content}>
                {generatedCode ? (
                    <RecursiveCompiler code={generatedCode} />
                ) : (
                    <View style={styles.pulseContainer}>
                        <View style={styles.pulseRing} />
                        <Text style={styles.pulseText}>
                            {isListening ? 'LISTENING TO VIBE...' :
                                isSynthesizing ? 'SYNTHESIZING REALITY...' :
                                    'WAITING FOR THE ARCHITECT...'}
                        </Text>
                    </View>
                )}
            </View>

            {/* Control Bar */}
            <View style={styles.controls}>
                {transcript ? (
                    <View style={styles.transcriptBox}>
                        <Text style={styles.transcriptText}>"{transcript}"</Text>
                    </View>
                ) : null}

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, isListening && styles.activeBtn]}
                        onPress={handleStartVibe}
                    >
                        <Mic size={32} color={isListening ? "#000" : "#0f0"} />
                    </TouchableOpacity>

                    {generatedCode && (
                        <TouchableOpacity style={styles.deployBtn} onPress={handleDeploy}>
                            <ShieldCheck size={24} color="#000" />
                            <Text style={styles.deployText}>DEPLOY MANIFEST</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.footer}>
                <Globe size={12} color="#444" />
                <Text style={styles.footerText}>SOVEREIGN NODE: 0x700_GENESIS</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#111'
    },
    title: {
        color: '#0f0',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 4,
        marginHorizontal: 15
    },
    content: { flex: 1 },
    pulseContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    pulseRing: {
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 2,
        borderColor: '#0f0',
        opacity: 0.5,
        // Animation would go here in actual native
    },
    pulseText: {
        color: '#0f0',
        marginTop: 30,
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2
    },
    controls: { padding: 20, backgroundColor: '#050505' },
    transcriptBox: {
        backgroundColor: '#111',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        borderLeftWidth: 3,
        borderLeftColor: '#0f0'
    },
    transcriptText: { color: '#888', fontStyle: 'italic' },
    actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    actionBtn: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#0f0'
    },
    activeBtn: { backgroundColor: '#0f0' },
    deployBtn: {
        flex: 1,
        height: 60,
        backgroundColor: '#0f0',
        borderRadius: 10,
        marginLeft: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    deployText: { color: '#000', fontWeight: '900', letterSpacing: 1, marginLeft: 10 },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        opacity: 0.5
    },
    footerText: { color: '#444', fontSize: 10, marginLeft: 5, fontWeight: 'bold' }
});
