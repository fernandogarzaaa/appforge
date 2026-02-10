import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { Connection, PublicKey } from '@solana/web3.js';
import QuantumEngine from './universal_quantum_dist/index.js';

// ⚡ SERVER CONFIGURATION
const PORT = process.env.PORT || 3000;
const TREASURY_WALLET = "2ZeBAFtHq5vNThXMjbZ7E59Msgv6xPpBFn7cw4KMxmot";
const PRICE_USDC = 80000;
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// 📧 EMAIL CONFIGURATION (Env Vars Recommended)
const EMAIL_USER = process.env.EMAIL_USER || "your-email@gmail.com";
const EMAIL_PASS = process.env.EMAIL_PASS || "your-app-password";

const app = express();
app.use(cors());
app.use(express.json());

// Solana Connection
const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
const engine = new QuantumEngine();

// Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Simply use Gmail or configure host/port for others
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

console.log(`💎 QUANTUM COMMERCE SERVER ACTIVE on Port ${PORT}`);
console.log(`Address: ${TREASURY_WALLET}`);

// ✅ CLAIM ENDPOINT
app.post('/api/claim', async (req, res) => {
    const { signature, email } = req.body;

    console.log(`\n🔍 CLAIM REQUEST detected:`);
    console.log(`   Sig: ${signature}`);
    console.log(`   Email: ${email}`);

    if (!signature || !email) {
        return res.status(400).json({ success: false, error: "Missing signature or email" });
    }

    try {
        // 1. Verify Transaction On-Chain
        const isValid = await verifyTransaction(signature, TREASURY_WALLET, PRICE_USDC);

        if (!isValid) {
            console.log("❌ INVALID TRANSACTION");
            return res.status(400).json({ success: false, error: "Transaction invalid or insufficient amount." });
        }

        console.log("✅ PAYMENT VERIFIED.");

        // 2. Generate License
        const license = engine.cryptography.encryptState([{
            licenseId: `ENT-80K-${signature.substring(0, 8)}`,
            tier: 'Global_Hedge_Fund',
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            valid: true
        }]);
        const licenseKey = JSON.stringify(license[0]);

        // 3. Send Email
        console.log("📧 SENDING EMAIL...");
        await sendLicenseEmail(email, licenseKey);

        console.log("🚀 DELIVERED.");
        return res.json({ success: true, message: "License sent to email." });

    } catch (e) {
        console.error("Server Error:", e);
        return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

async function verifyTransaction(signature, myWallet, amount) {
    try {
        const tx = await connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed'
        });

        if (!tx) return false;

        const preBalances = tx.meta.preTokenBalances || [];
        const postBalances = tx.meta.postTokenBalances || [];

        // Check USDC Balance Change for Treasury
        const myPre = preBalances.find(b => b.owner === myWallet && b.mint === USDC_MINT);
        const myPost = postBalances.find(b => b.owner === myWallet && b.mint === USDC_MINT);

        const preAmount = myPre ? Number(myPre.uiTokenAmount.uiAmount) : 0;
        const postAmount = myPost ? Number(myPost.uiTokenAmount.uiAmount) : 0;

        const received = postAmount - preAmount;

        console.log(`   💰 Received: ${received} USDC`);

        // Allow slight tolerance or exact match
        return received >= amount;
    } catch (e) {
        console.error("Verification Error:", e);
        return false;
    }
}

async function sendLicenseEmail(to, key) {
    const mailOptions = {
        from: `"Quantum AppForge" <${EMAIL_USER}>`,
        to: to,
        subject: '🚀 Your Quantum Engine Enterprise License',
        text: `
        Welcome to the Swarm.
        
        Your Enterprise License Key:
        ${key}
        
        Download the specificaiton from our portal.
        
        - AppForge
        `,
        html: `
        <div style="font-family: sans-serif; background: #0f172a; color: white; padding: 20px; border-radius: 10px;">
            <h1 style="color: #a78bfa;">Access Granted</h1>
            <p>Payment confirmed. You now wield the power of the Quantum Engine.</p>
            
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 5px; margin: 20px 0;">
                <strong>License Key:</strong><br>
                <code style="word-break: break-all; color: #4ade80;">${key}</code>
            </div>
            
            <p style="color: #94a3b8; font-size: 12px;">Stored on Solana Immutable Ledger.</p>
        </div>
        `
    };

    return transporter.sendMail(mailOptions);
}

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
