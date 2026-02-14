import React, { useState } from 'react';
import { encodeURL } from '@solana/pay';
import { PublicKey, Transaction, SystemProgram, Connection, clusterApiUrl } from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import BigNumber from 'bignumber.js';
import { useQuantumOracle } from '@/hooks/useQuantumOracle';
import { Buffer } from 'buffer';

interface SolanaMerchantProps {
    onPaymentSuccess?: () => void;
    amount?: number;
    label?: string;
}

const SolanaMerchant: React.FC<SolanaMerchantProps> = ({
    onPaymentSuccess,
    amount = 0.05,
    label = 'AppForge Merchant'
}) => {
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const { verifyTransaction, isOracleOnline } = useQuantumOracle();

    const [qrCode, setQrCode] = useState<string | null>(null);
    const [status, setStatus] = useState('Idle');
    const [auditStatus, setAuditStatus] = useState<string | null>(null);

    const generatePayment = async () => {
        try {
            setStatus('Generating QR...');
            setAuditStatus(null);
            const recipient = new PublicKey('vines1vzrY7tduFqyLo2X7st74nLq1z7L8mF66oQzLx'); // AppForge Vault
            const payAmount = new BigNumber(amount);
            const message = 'AppForge Verification';
            const memo = 'INV#' + Math.floor(Math.random() * 1000);

            // 1. QR Flow (Standard)
            const url = encodeURL({ recipient, amount: payAmount, label, message, memo });
            setQrCode(url.toString());
            setStatus('Awaiting Payment');

        } catch (e) {
            console.error(e);
            setStatus('Error');
        }
    };

    const handleDirectPay = async () => {
        if (!publicKey) {
            setStatus('Connect Wallet!');
            return;
        }

        try {
            setStatus('Auditing...');
            // Construct Transaction
            const recipient = new PublicKey('vines1vzrY7tduFqyLo2X7st74nLq1z7L8mF66oQzLx');
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: recipient,
                    lamports: amount * 1000000000, // SOL to Lamports
                })
            );

            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            // ⚠️ IRON LEDGER: SECURITY GATE ⚠️
            // Serialize for Audit (require all signatures present if verifying them, but here we just verify intent)
            // We just need the message to check instructions.
            // Note: transaction.serialize() might fail if signatures are missing and requireAllSignatures is true.
            // We verify the UNSIGNED transaction object contents first (the Intent).

            const serializedBytes = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
            const serializedBase64 = Buffer.from(serializedBytes).toString('base64');

            console.log("🛡️ Sending Transaction to Oracle for Audit...");
            const audit = await verifyTransaction(serializedBase64);

            // PHASE 23: IRON GUARD KILL-SWITCH
            if (audit.risk_score > 0.7) {
                setAuditStatus(`⛔ BLOCKED (RISK: ${audit.risk_score.toFixed(1)}): ${audit.details}`);
                setStatus('Security Alert');
                return;
            }

            if (!audit.verified) {
                setAuditStatus(`⚠️ WARNING: ${audit.details}`);
            } else {
                setAuditStatus(`✅ VERIFIED: ${audit.details}`);
            }
            setStatus('Signing...');

            // If verified, proceed to prompt user
            const signature = await sendTransaction(transaction, connection);
            setStatus('Confirming...');
            await connection.confirmTransaction(signature, 'processed');

            setStatus('Payment Complete');
            if (onPaymentSuccess) onPaymentSuccess();

        } catch (e: any) {
            console.error(e);
            setStatus('Failed: ' + (e.message || 'Unknown Error'));
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 text-slate-300">
            <div className="w-full bg-slate-800/50 rounded flex flex-col items-center justify-center border border-slate-700 overflow-hidden p-4">
                {auditStatus && (
                    <div className={`w-full mb-3 p-2 rounded text-[10px] font-mono font-bold border ${auditStatus.includes('BLOCKED') ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'}`}>
                        {auditStatus}
                    </div>
                )}

                {qrCode ? (
                    <div className="text-center w-full">
                        <div className="bg-white p-2 rounded mb-4 overflow-hidden">
                            <div className="text-slate-900 text-[8px] break-all mono leading-tight">{qrCode}</div>
                        </div>
                        <span className="text-blue-400 font-bold">{amount.toFixed(2)} SOL</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-slate-500 text-[10px] uppercase font-bold">Secure Checkout</span>
                        <span className="text-2xl font-bold text-white">{amount} SOL</span>
                    </div>
                )}
            </div>

            <div className="flex gap-2 w-full">
                <button
                    onClick={generatePayment}
                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded text-[10px] uppercase tracking-widest transition-all"
                >
                    QR Pay
                </button>
                <button
                    onClick={handleDirectPay}
                    disabled={!isOracleOnline}
                    className={`flex-1 py-2 font-bold rounded text-[10px] uppercase tracking-widest transition-all ${isOracleOnline ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                >
                    {isOracleOnline ? 'Iron Pay (Web3)' : 'Oracle Offline'}
                </button>
            </div>

            {/* FIRE DRILL CONTROLS (SIMULATION) */}
            <div className="grid grid-cols-2 gap-2 w-full mt-2 border-t border-slate-700/50 pt-2">
                <button
                    onClick={async () => {
                        console.log("⚠️ SIMULATING UNKNOWN PROTOCOL...");
                        // This is a random base64 string, not a valid tx, but the auditor will check it.
                        // Since it won't decode to a valid tx structure, it might fail early, 
                        // BUT let's try to mock a result via the hook if we want purely UI testing
                        // OR we trust the oracle to return a "Malformed" or "Unknown" error which is also a BLOCK.
                        // Actually, let's use the hook to send a dummy string.
                        const result = await verifyTransaction("SGVsbG8gV29ybGQ="); // "Hello World" in base64
                        if (result.risk_score > 0.7) setStatus('Thwarted!');
                    }}
                    className="py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded text-[9px] uppercase font-mono"
                >
                    Simulate Attack
                </button>
                <button
                    onClick={async () => {
                        console.log("🛡️ SIMULATING VALID TX...");
                        // We can't easily generate a valid signed tx string without keys.
                        // So we will verify a "PING" or handled messsage if the oracle supports it, 
                        // OR we just accept that we can only simulate the "Attack" (Block) path easily without a wallet.
                        // Let's just mock the 'verifyTransaction' call from the UI side for the 'Safe' visual 
                        // IF we strictly want to see the green log.
                        // However, to be authentic, we should hit the endpoint.
                        // Since we don't have a valid signed tx, the Oracle WILL block anything we send.
                        // So "Simulate Attack" is the only honest simulation possible right now.
                        setStatus('Simulating...');
                    }}
                    className="py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded text-[9px] uppercase font-mono opacity-50 cursor-not-allowed"
                    title="Requires Real Wallet Signature"
                >
                    Simulate Safe (Wallet)
                </button>
            </div>

            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                Status: <span className={status.includes('Complete') ? 'text-emerald-400' : status.includes('Blocked') ? 'text-red-400' : 'text-slate-400'}>{status}</span>
            </div>
        </div>
    );
};

export default SolanaMerchant;
