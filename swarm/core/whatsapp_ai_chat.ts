/**
 * 🤖 WhatsApp AI Chat Integration
 * Uses Hyper Intelligence for AI-powered responses
 */

import { whatsappBridge } from './whatsapp_bridge.js';
import { hyperIntelligence } from './hyper/index.js';
import { sovereignLLM } from './sovereign_llm.js';

/**
 * Handle AI chat requests from WhatsApp
 */
export async function handleAIChat(message: string, senderJid: string): Promise<string> {
    const requestId = `wa_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    console.log(`🤖 [WhatsApp AI] Processing request ${requestId} from ${senderJid}`);
    
    try {
        // Use Hyper Intelligence for intelligent responses
        console.log(`🚀 [WhatsApp AI] Delegating to Hyper Intelligence`);
        const result = await hyperIntelligence.process(message);
        
        if (result.safety.passed) {
            console.log(`✅ [WhatsApp AI] Response generated (model: ${result.routing.primaryModel})`);
            return result.response;
        } else {
            console.warn(`⚠️ [WhatsApp AI] Safety check failed, trying fallback`);
        }
    } catch (hyperError) {
        console.warn(`⚠️ [WhatsApp AI] Hyper Intelligence failed: ${hyperError}`);
    }
    
    // Fallback to Sovereign LLM
    try {
        console.log(`🌌 [WhatsApp AI] Falling back to Sovereign LLM`);
        const response = await sovereignLLM.chat({
            system: 'You are AppForge AI assistant. Respond helpfully to user queries.',
            user: message
        });
        
        if (response) {
            return response.choices[0].message.content;
        }
    } catch (sovError) {
        console.error(`❌ [WhatsApp AI] Sovereign LLM failed: ${sovError}`);
    }
    
    // Final fallback
    return `I'm having trouble processing your request right now. Please try again later.`;
}

/**
 * Register AI chat handler with WhatsApp bridge
 */
export function registerAIChatHandler() {
    whatsappBridge.onCommand(async (cmd: string) => {
        // Handle AI chat commands (messages without / prefix)
        const response = await handleAIChat(cmd, 'unknown');
        await whatsappBridge.pushUpdate(response);
    });
    
    console.log('✅ [WhatsApp AI] AI chat handler registered');
}

/**
 * Quick AI response for simple queries
 */
export async function quickAIResponse(message: string): Promise<string> {
    // Simple keyword-based responses for common queries
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('status')) {
        const hyperStatus = hyperIntelligence.getStatus();
        return `🧠 AppForge Hyper Intelligence Status:\n` +
               `- Router models: ${hyperStatus.router.availableModels}\n` +
               `- Accelerator fidelity: ${(hyperStatus.accelerator.fidelity * 100).toFixed(1)}%\n` +
               `- Safety principles: ${hyperStatus.safety.principlesLoaded}`;
    }
    
    if (lowerMessage.includes('help')) {
        return `🤖 AppForge AI Commands:\n` +
               `- /status - Check system status\n` +
               `- /help - Show this help\n` +
               `- Any other message - Get AI response`;
    }
    
    // Default to full AI processing
    return handleAIChat(message, 'quick_query');
}
