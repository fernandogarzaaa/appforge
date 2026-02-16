import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Shield, Activity } from 'lucide-react-native';

/**
 * 🔇 SILENT SENTRY HUD
 * Visualizes the 99% coherence background cycles.
 * Standardized for Phase 62 Deep Reality.
 */
export const SilentSentryHUD: React.FC = () => {
    const [coherence, setCoherence] = useState(99.0);
    const [pulseAnim] = useState(new Animated.Value(1));

    useEffect(() => {
        // Simple heartbeat animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
            ])
        ).start();

        // Simulate tiny coherence drifts
        const interval = setInterval(() => {
            setCoherence(99.0 + (Math.random() * 0.9));
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.iconBox, { transform: [{ scale: pulseAnim }] }]}>
                <Shield size={14} color="#0f0" />
            </Animated.View>
            <View style={styles.stats}>
                <Text style={styles.label}>SENTRY ACTIVE</Text>
                <Text style={styles.value}>{coherence.toFixed(2)}% COHERENCE</Text>
            </View>
            <Activity size={14} color="#0f0" style={styles.activity} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
        padding: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#111',
        position: 'absolute',
        top: 60,
        alignSelf: 'center',
        zIndex: 100
    },
    iconBox: { marginRight: 10 },
    stats: { marginRight: 15 },
    label: { color: '#444', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
    value: { color: '#0f0', fontSize: 10, fontWeight: 'bold' },
    activity: { marginLeft: 'auto' }
});
