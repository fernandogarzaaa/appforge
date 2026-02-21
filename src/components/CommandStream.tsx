import { Terminal, Zap, Cpu } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

export default function CommandStream() {
    const [input, setInput] = useState('');
    const [prediction, setPrediction] = useState('');
    const [load, setLoad] = useState(12);
    const [history, setHistory] = useState<string[]>([
        'AppForge Sovereign Kernel [v1.0.2-PROD]',
        '> Kernel initialized via Truth Anchor.',
        '> Pulse synchronization complete.'
    ]);

    const commands = [
        'SOVEREIGN_AUDIT',
        'HEAL_BACKLOG',
        'KERNEL_BLESS',
        'ORACLE_SYNC',
        'AXIOM_RELOAD',
        'FACTORY_IGNITE',
        'STATUS',
        'PING'
    ];

    useEffect(() => {
        socket.on('reply', (data: { text: string }) => {
            const lines = data.text.split('\n');
            setHistory(prev => [...prev, ...lines.map(l => `> ${l}`)]);
        });

        return () => {
            socket.off('reply');
        };
    }, []);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInput(val);

        if (val.length > 0) {
            const found = commands.find(c => c.startsWith(val.toUpperCase()));
            setPrediction(found ? found.slice(val.length) : '');
        } else {
            setPrediction('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && input.trim()) {
            const cmd = input.trim();
            setHistory(prev => [...prev, `§ ${cmd}`]);
            socket.emit('prompt', { text: cmd, id: Date.now().toString() });
            setInput('');
            setPrediction('');
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setLoad(prev => Math.max(5, Math.min(85, prev + (Math.random() - 0.5) * 10)));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    return (
        <div className="flex flex-col h-full bg-[#020617]/80 backdrop-blur-xl border border-slate-800 rounded-lg overflow-hidden font-mono">
            <div className="h-8 border-b border-slate-800 flex items-center justify-between px-3 bg-[#1e293b]/30">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <Terminal className="w-3 h-3" />
                    Command Stream
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <Cpu className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] text-emerald-500/70">{load.toFixed(0)}%</span>
                    </div>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-1 text-[10px] leading-relaxed">
                {history.map((line, i) => (
                    <div key={i} className={
                        line.startsWith('§') ? 'text-blue-400 font-bold' :
                            line.startsWith('>') ? 'text-emerald-400/80' : 'text-slate-500'
                    }>
                        {line}
                    </div>
                ))}
                <div className="text-slate-300 flex gap-2 pt-1">
                    <span className="text-blue-500 font-bold">§</span>
                    <div className="relative flex-1">
                        <input
                            type="text"
                            className="bg-transparent border-none outline-none w-full text-slate-200 caret-blue-500"
                            value={input}
                            onChange={handleInput}
                            onKeyDown={handleKeyDown}
                            spellCheck={false}
                            autoFocus
                        />
                        <span className="absolute left-0 pointer-events-none text-slate-600">
                            <span className="invisible">{input}</span>
                            {prediction}
                        </span>
                    </div>
                </div>
            </div>

            <div className="h-1 bg-slate-900 overflow-hidden">
                <div
                    className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6] transition-all duration-300"
                    style={{ width: `${load}%` }}
                />
            </div>
        </div>
    );
}
