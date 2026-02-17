
import fetch from 'node-fetch';

/**
 * 🧪 Chimera Loopback Test
 * Verifies that the public Cloudflare Tunnel can reach the local Neural Bridge.
 */
async function verifyUplink() {
    const publicUrl = "https://first-veterans-processes-personality.trycloudflare.com";
    console.log('='.repeat(70));
    console.log(`🧪 [CHIMERA VERIFY] Initiating Loopback Test...`);
    console.log(`🔗 Target: ${publicUrl}`);
    console.log('='.repeat(70));

    try {
        const response = await fetch(`${publicUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "chimera-prime-v1",
                messages: [{ role: "user", content: "Sovereign Handshake: Are you fully wired?" }],
                max_tokens: 50
            })
        });

        if (response.status === 200) {
            const data: any = await response.json();
            console.log(`\n✅ [SUCCESS] Response received via Tunnel!`);
            console.log(`🧠 Chimera Response: "${data.choices[0].message.content}"`);
            console.log(`🌐 Routing: Public -> Cloudflare -> Tunnel -> Local Bridge -> Chimera Engine`);
        } else {
            console.error(`\n❌ [FAILURE] Tunnel reachable but returned status: ${response.status}`);
        }
    } catch (e) {
        console.error(`\n❌ [ERROR] Could not reach the public tunnel: ${(e as any).message}`);
        console.log(`💡 Tip: Ensure your 'setup_sovereign_tunnel.ps1' is still running in another terminal.`);
    }
}

verifyUplink();
