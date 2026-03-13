import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import axios from 'axios';
import { Shield, Zap, Lock, Unlock, Rocket, Loader2 } from 'lucide-react';
import SolanaMerchant from '@/plugins/solana/ui/SolanaMerchant';
import { useWallet } from '../stubs/solana-adapters';
const CodeVendingMachine = () => {
    const { connected } = useWallet();
    const [task, setTask] = useState('');
    const [isPaid, setIsPaid] = useState(false);
    const [isBuilding, setIsBuilding] = useState(false);
    const [price, setPrice] = useState(null);
    const handleGeneratePrice = () => {
        if (!task)
            return;
        setPrice(0.05);
    };
    const handlePaymentSuccess = () => {
        setIsPaid(true);
        triggerSwarmBuild();
    };
    const triggerSwarmBuild = async () => {
        setIsBuilding(true);
        try {
            await axios.post('/api/command', { task });
        }
        catch (error) {
            console.error("Vending Machine Error:", error);
        }
        finally {
            setTimeout(() => setIsBuilding(false), 5000);
        }
    };
    return (_jsxs("div", { className: "flex flex-col gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx("textarea", { value: task, onChange: (e) => setTask(e.target.value), placeholder: "Describe the App you want the Swarm to build...", className: "w-full bg-slate-900/50 border border-slate-700 rounded p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 min-h-[100px] resize-none", disabled: isPaid || isBuilding }), !price && (_jsx("button", { onClick: handleGeneratePrice, disabled: !task || !connected, className: "absolute bottom-3 right-3 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-[10px] font-black rounded uppercase transition-all", children: !connected ? 'Wallet Required' : 'Estimate Labor' }))] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "p-4 border border-blue-500/30 bg-blue-900/10 backdrop-blur-md rounded shadow-xl flex flex-col justify-between", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-2", children: [_jsx(Shield, { className: "w-3 h-3" }), " Status"] }), _jsxs("div", { className: "flex items-center gap-2 mt-4", children: [isPaid ? (_jsx(Unlock, { className: "w-5 h-5 text-emerald-400" })) : (_jsx(Lock, { className: "w-5 h-5 text-slate-500" })), _jsx("span", { className: `text-xs font-bold uppercase tracking-widest ${isPaid ? 'text-emerald-400' : 'text-slate-500'}`, children: isPaid ? 'Payment Verified' : 'Locked (Awaiting SOL)' })] })] }), isBuilding ? (_jsxs("div", { className: "mt-4 flex items-center gap-2 text-indigo-400 animate-pulse", children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), _jsx("span", { className: "text-[10px] font-black uppercase tracking-widest", children: "Swarm at Work..." })] })) : isPaid ? (_jsxs("div", { className: "mt-4 text-emerald-400 flex items-center gap-2", children: [_jsx(Rocket, { className: "w-4 h-4" }), _jsx("span", { className: "text-[10px] font-black uppercase tracking-widest", children: "Build Initialized" })] })) : null] }), _jsxs("div", { className: "p-4 border border-indigo-500/30 bg-indigo-900/10 backdrop-blur-md rounded shadow-xl", children: [_jsxs("h3", { className: "text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2", children: [_jsx(Zap, { className: "w-3 h-3" }), " Merchant POS"] }), price ? (_jsx(SolanaMerchant, { amount: price, onPaymentSuccess: handlePaymentSuccess, label: "Swarm Labor" })) : (_jsx("div", { className: "h-40 flex items-center justify-center text-slate-600 italic text-[10px] text-center px-4", children: "Input task to generate payment options" }))] })] })] }));
};
export default CodeVendingMachine;
