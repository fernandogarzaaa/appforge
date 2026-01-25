import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function CryptoTradingBotBuilder({ onSave }) {
  const [config, setConfig] = useState({
    strategy: 'grid',
    trading_pair: 'BTC/USDT',
    grid_levels: 10,
    initial_capital: 1000,
    stop_loss: 5,
    take_profit: 10,
    rebalance_interval: '1h',
    exchange: 'binance'
  });

  const strategies = [
    { value: 'grid', label: 'Grid Trading', description: 'Buy/sell at price intervals' },
    { value: 'dca', label: 'Dollar Cost Averaging', description: 'Regular fixed investments' },
    { value: 'arbitrage', label: 'Arbitrage', description: 'Exploit price differences' },
    { value: 'momentum', label: 'Momentum', description: 'Trade trending assets' }
  ];

  const handleSave = () => {
    if (!config.trading_pair || !config.initial_capital) {
      toast.error('Please fill in required fields');
      return;
    }
    onSave({
      name: `Crypto Trading Bot - ${config.strategy.toUpperCase()}`,
      description: `${config.strategy} trading bot for ${config.trading_pair}`,
      trigger: { type: 'schedule', config: { interval: config.rebalance_interval } },
      bot_config: config,
      nodes: [
        { id: '1', name: 'Fetch market data', type: 'action' },
        { id: '2', name: 'Calculate signals', type: 'action' },
        { id: '3', name: 'Execute trades', type: 'action' },
        { id: '4', name: 'Log performance', type: 'action' }
      ],
      status: 'draft'
    });
    toast.success('Crypto trading bot configured!');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Crypto Trading Bot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Strategy</Label>
            <Select value={config.strategy} onValueChange={(value) => setConfig({ ...config, strategy: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {strategies.map(s => (
                  <SelectItem key={s.value} value={s.value}>
                    <div>
                      <div className="font-semibold">{s.label}</div>
                      <div className="text-xs text-slate-500">{s.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Trading Pair</Label>
              <Input value={config.trading_pair} onChange={(e) => setConfig({ ...config, trading_pair: e.target.value })} placeholder="BTC/USDT" />
            </div>
            <div>
              <Label>Exchange</Label>
              <Select value={config.exchange} onValueChange={(value) => setConfig({ ...config, exchange: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="binance">Binance</SelectItem>
                  <SelectItem value="coinbase">Coinbase</SelectItem>
                  <SelectItem value="kraken">Kraken</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Initial Capital (USD)</Label>
              <Input type="number" value={config.initial_capital} onChange={(e) => setConfig({ ...config, initial_capital: parseFloat(e.target.value) })} />
            </div>
            <div>
              <Label>Rebalance Interval</Label>
              <Select value={config.rebalance_interval} onValueChange={(value) => setConfig({ ...config, rebalance_interval: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15m">15 minutes</SelectItem>
                  <SelectItem value="1h">1 hour</SelectItem>
                  <SelectItem value="4h">4 hours</SelectItem>
                  <SelectItem value="1d">1 day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {config.strategy === 'grid' && (
            <div>
              <Label>Grid Levels</Label>
              <Input type="number" value={config.grid_levels} onChange={(e) => setConfig({ ...config, grid_levels: parseInt(e.target.value) })} min="2" max="50" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Stop Loss (%)</Label>
              <Input type="number" value={config.stop_loss} onChange={(e) => setConfig({ ...config, stop_loss: parseFloat(e.target.value) })} />
            </div>
            <div>
              <Label>Take Profit (%)</Label>
              <Input type="number" value={config.take_profit} onChange={(e) => setConfig({ ...config, take_profit: parseFloat(e.target.value) })} />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-sm text-blue-900">Workflow</span>
            </div>
            <ul className="text-xs text-blue-800 space-y-1 ml-6 list-disc">
              <li>Monitor {config.trading_pair} on {config.exchange}</li>
              <li>Apply {config.strategy} strategy every {config.rebalance_interval}</li>
              <li>Execute trades with {config.stop_loss}% stop-loss</li>
              <li>Lock profits at {config.take_profit}%</li>
            </ul>
          </div>

          <Button onClick={handleSave} className="w-full">
            Create Trading Bot
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}