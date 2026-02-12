// Run WhatsApp bridge
import('./swarm/core/whatsapp_bridge.ts').then(m => {
    console.log('Starting WhatsApp bridge...');
    m.whatsappBridge.start();
}).catch(e => {
    console.error('Failed to start bridge:', e);
    process.exit(1);
});
