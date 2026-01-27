import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, TrendingDown, Wallet, Zap, Coins
} from 'lucide-react';
import TradingChart from '@/components/web3/TradingChart';
import StakingPanel from '@/components/web3/StakingPanel';
import MarginTradingPanel from '@/components/web3/MarginTradingPanel';
import { toast } from 'sonner';

const tradingPairs = [
  { symbol: 'BTC/USDT', price: 43520.50, change: 2.34, volume: '1.2B', high: 44100, low: 42800 },
  { symbol: 'ETH/USDT', price: 2340.80, change: -1.23, volume: '890M', high: 2380, low: 2310 },
  { symbol: 'SOL/USDT', price: 98.45, change: 5.67, volume: '340M', high: 102, low: 94 },
  { symbol: 'BNB/USDT', price: 312.90, change: 1.89, volume: '520M', high: 318, low: 308 }
];

export default function CryptoExchange() {
  const [selectedPair, setSelectedPair] = useState(tradingPairs[0]);
  const [orderType, setOrderType] = useState('limit');
  const [side, setSide] = useState('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [orders, setOrders] = useState([
    { id: 1, pair: 'BTC/USDT', type: 'buy', price: 43000, amount: 0.1, status: 'open', date: new Date() },
    { id: 2, pair: 'ETH/USDT', type: 'sell', price: 2400, amount: 2, status: 'filled', date: new Date() }
  ]);

  const placeOrder = () => {
    if (!amount || (orderType === 'limit' && !price)) {
      toast.error('Fill in all fields');
      return;
    }

    const newOrder = {
      id: Date.now(),
      pair: selectedPair.symbol,
      type: side,
      price: orderType === 'market' ? selectedPair.price : parseFloat(price),
      amount: parseFloat(amount),
      status: orderType === 'market' ? 'filled' : 'open',
      date: new Date()
    };

    setOrders([newOrder, ...orders]);
    toast.success(`${side.toUpperCase()} order placed successfully`);
    setAmount('');
    setPrice('');
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Crypto Exchange</h1>
        <p className="text-gray-500">Trade cryptocurrencies with advanced tools</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Trading Pairs */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Markets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tradingPairs.map((pair, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedPair(pair)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedPair.symbol === pair.symbol ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm">{pair.symbol}</span>
                    <Badge
                      variant="outline"
                      className={pair.change > 0 ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'}
                    >
                      {pair.change > 0 ? '+' : ''}{pair.change}%
                    </Badge>
                  </div>
                  <div className="text-sm font-mono">${pair.price.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">Vol: {pair.volume}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Wallet Balance */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Wallet Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">USDT</span>
                <span className="font-semibold">10,000.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">BTC</span>
                <span className="font-semibold">0.2345</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">ETH</span>
                <span className="font-semibold">5.6789</span>
              </div>
              <Button className="w-full" size="sm">
                <Wallet className="w-3 h-3 mr-2" />
                Deposit
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Chart & Trading */}
        <div className="lg:col-span-3 space-y-6">
          {/* Price Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedPair.symbol}</h2>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-3xl font-bold">${selectedPair.price.toLocaleString()}</span>
                    <Badge
                      variant="outline"
                      className={selectedPair.change > 0 ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'}
                    >
                      {selectedPair.change > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {selectedPair.change > 0 ? '+' : ''}{selectedPair.change}%
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TradingChart selectedPair={selectedPair} />
            </CardContent>
          </Card>

          {/* Trading Interface */}
          <Tabs defaultValue="spot" className="mb-6">
            <TabsList>
              <TabsTrigger value="spot">Spot Trading</TabsTrigger>
              <TabsTrigger value="margin">
                <Zap className="w-4 h-4 mr-2" />
                Margin / Futures
              </TabsTrigger>
              <TabsTrigger value="staking">
                <Coins className="w-4 h-4 mr-2" />
                Staking & Earn
              </TabsTrigger>
            </TabsList>

            <TabsContent value="spot" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Buy/Sell */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Place Order</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={side} onValueChange={setSide} className="mb-4">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="buy" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                          Buy
                        </TabsTrigger>
                        <TabsTrigger value="sell" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                          Sell
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="space-y-4">
                      <Select value={orderType} onValueChange={setOrderType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="limit">Limit Order</SelectItem>
                          <SelectItem value="market">Market Order</SelectItem>
                        </SelectContent>
                      </Select>

                      {orderType === 'limit' && (
                        <div>
                          <label className="text-sm text-gray-600">Price (USDT)</label>
                          <Input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0.00"
                            className="mt-1"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-sm text-gray-600">Amount ({selectedPair.symbol.split('/')[0]})</label>
                        <Input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>

                      <div className="flex gap-2 text-xs">
                        {[25, 50, 75, 100].map(percent => (
                          <Button
                            key={percent}
                            variant="outline"
                            size="sm"
                            onClick={() => setAmount((10 / selectedPair.price * (percent / 100)).toFixed(6))}
                            className="flex-1"
                          >
                            {percent}%
                          </Button>
                        ))}
                      </div>

                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Total</span>
                          <span className="font-semibold">
                            {amount && price ? (parseFloat(amount) * parseFloat(price)).toFixed(2) : '0.00'} USDT
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={placeOrder}
                        className={`w-full ${side === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                      >
                        {side === 'buy' ? 'Buy' : 'Sell'} {selectedPair.symbol.split('/')[0]}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Book */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Order Book</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="grid grid-cols-3 text-xs text-gray-600 mb-2">
                        <div>Price (USDT)</div>
                        <div className="text-right">Amount</div>
                        <div className="text-right">Total</div>
                      </div>
                      {/* Sell orders */}
                      {[...Array(5)].map((_, i) => {
                        const sellPrice = selectedPair.price + (i + 1) * 50;
                        const amount = (Math.random() * 2).toFixed(4);
                        return (
                          <div key={i} className="grid grid-cols-3 text-xs text-red-600">
                            <div className="font-mono">{sellPrice.toFixed(2)}</div>
                            <div className="text-right font-mono">{amount}</div>
                            <div className="text-right font-mono">{(sellPrice * parseFloat(amount)).toFixed(2)}</div>
                          </div>
                        );
                      })}
                      <div className="py-2 text-center text-lg font-bold">{selectedPair.price.toFixed(2)}</div>
                      {/* Buy orders */}
                      {[...Array(5)].map((_, i) => {
                        const buyPrice = selectedPair.price - (i + 1) * 50;
                        const amount = (Math.random() * 2).toFixed(4);
                        return (
                          <div key={i} className="grid grid-cols-3 text-xs text-green-600">
                            <div className="font-mono">{buyPrice.toFixed(2)}</div>
                            <div className="text-right font-mono">{amount}</div>
                            <div className="text-right font-mono">{(buyPrice * parseFloat(amount)).toFixed(2)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="margin" className="mt-6">
              <MarginTradingPanel selectedPair={selectedPair} />
            </TabsContent>

            <TabsContent value="staking" className="mt-6">
              <StakingPanel />
            </TabsContent>
          </Tabs>

          {/* Open Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {orders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant={order.type === 'buy' ? 'default' : 'outline'} className={order.type === 'buy' ? 'bg-green-600' : 'bg-red-600 text-white'}>
                        {order.type.toUpperCase()}
                      </Badge>
                      <div>
                        <div className="font-semibold">{order.pair}</div>
                        <div className="text-xs text-gray-600">
                          {order.amount} @ ${order.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={order.status === 'filled' ? 'default' : 'outline'}>
                        {order.status}
                      </Badge>
                      {order.status === 'open' && (
                        <Button variant="ghost" size="sm" className="ml-2 text-red-600">
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}