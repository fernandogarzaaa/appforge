import React, { useState } from 'react';
import { encodeURL, createQR } from '@solana/pay';
import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

interface SolanaMerchantProps {
    onPaymentSuccess?: () => void;
    amount?: number;
    label?: string;
}

const SolanaMerchant: React.FC<SolanaMerchantProps> = ({
    onPaymentSuccess,
    amount = 1,
    label = 'Sovereign Store'
}) => {
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [status, setStatus] = useState('Idle');

    const generatePayment = () => {
        try {
            setStatus('Generating QR...');
            const recipient = new PublicKey('vines1vzrY7tduFqyLo2X7st74nLq1z7L8mF66oQzLx');
            const payAmount = new BigNumber(amount);
            const message = 'Thank you for your business';
            const memo = 'INV#' + Math.floor(Math.random() * 1000);

            const url = encodeURL({ recipient, amount: payAmount, label, message, memo });
            setQrCode(url.toString());
            setStatus('Awaiting Payment');
        } catch (e) {
            console.error(e);
            setStatus('Error');
        }
    };

    const verifyPayment = () => {
        setStatus('Verifying...');
        setTimeout(() => {
            setStatus('Payment Verified');
            if (onPaymentSuccess) onPaymentSuccess();
        }, 2000);
    };

    return (
        <div className="flex flex-col items-center gap-4 text-slate-300">
            <div className="w-full aspect-square bg-slate-800/50 rounded flex items-center justify-center border border-slate-700 overflow-hidden p-4">
                {qrCode ? (
                    <div className="text-center w-full">
                        <div className="bg-white p-2 rounded mb-4 overflow-hidden">
                            <div className="text-slate-900 text-[8px] break-all mono leading-tight">{qrCode}</div>
                        </div>
                        <span className="text-blue-400 font-bold">{amount.toFixed(2)} USDC</span>
                    </div>
                ) : (
                    <span className="text-slate-600 italic">No Active Transaction</span>
                )}
            </div>

            {!qrCode ? (
                <button
                    onClick={generatePayment}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded uppercase tracking-widest transition-all"
                >
                    Generate Payment QR
                </button>
            ) : (
                <button
                    onClick={verifyPayment}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded uppercase tracking-widest transition-all"
                    disabled={status === 'Payment Verified'}
                >
                    {status === 'Payment Verified' ? 'Verified ✅' : 'Verify Transaction'}
                </button>
            )}

            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                Status: <span className={status.includes('Verified') ? 'text-emerald-400' : 'text-slate-400'}>{status}</span>
            </div>
        </div>
    );
};

export default SolanaMerchant;
