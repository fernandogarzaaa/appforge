import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, TrendingUp, TrendingDown, Percent, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function MarginTradingPanel({ selectedPair }) {
  const [side, setSide] = useState('long');
  const [leverage, setLeverage] = useState([10]);
  const [collateral, setCollateral] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [positions, setPositions] = useState([
    {
      id: 1,
      pair: 'BTC/USDT',
      side: 'long',
      leverage: 10,
      entryPrice: 43000,
      amount: 0.1,
      collateral: 430,
      unrealizedPnL: 52.5,
      liquidationPrice: 38700
    }
  ]);

  const calculatePositionSize = () => {
    if (!collateral) return 0;
    return (parseFloat(collateral) * leverage[0] / selectedPair.price).toFixed(6);
  };

  const calculateLiquidationPrice = () => {
    if (!entryPrice || !collateral) return 0;
    const price = parseFloat(entryPrice);
    const leverageValue = leverage[0];
    if (side === 'long') {
      return (price * (1 - 1 / leverageValue)).toFixed(2);
    } else {
      return (price * (1 + 1 / leverageValue)).toFixed(2);
    }
  };

  const openPosition = () => {
    if (!collateral || !entryPrice) {
      toast.error('Fill in all fields');
      return;
    }

    const newPosition = {
      id: Date.now(),
      pair: selectedPair.symbol,
      side,
      leverage: leverage[0],
      entryPrice: parseFloat(entryPrice),
      amount: parseFloat(calculatePositionSize()),
      collateral: parseFloat(collateral),
      unrealizedPnL: 0,
      liquidationPrice: parseFloat(calculateLiquidationPrice())
    };

    setPositions([...positions, newPosition]);
    toast.success(`${side.toUpperCase()} position opened with ${leverage[0]}x leverage`);
    setCollateral('');
    setEntryPrice('');
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="font-semibold text-orange-900 mb-1">High Risk Trading</div>
          <p className="text-orange-700">
            Margin trading involves high risk. You can lose more than your initial investment. 
            Only trade with funds you can afford to lose.
          </p>
        </div>
      </div>

      {/* Trading Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Open Margin Position</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={side} onValueChange={setSide} className="mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="long" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Long (Buy)
              </TabsTrigger>
              <TabsTrigger value="short" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                Short (Sell)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-4">
            {/* Leverage Selector */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-600">Leverage</label>
                <Badge variant="outline" className="font-mono text-lg">
                  {leverage[0]}x
                </Badge>
              </div>
              <Slider
                value={leverage}
                onValueChange={setLeverage}
                min={1}
                max={125}
                step={1}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1x</span>
                <span>25x</span>
                <span>50x</span>
                <span>75x</span>
                <span>125x</span>
              </div>
            </div>

            {/* Collateral */}
            <div>
              <label className="text-sm text-gray-600">Collateral (USDT)</label>
              <Input
                type="number"
                value={collateral}
                onChange={(e) => setCollateral(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            {/* Entry Price */}
            <div>
              <label className="text-sm text-gray-600">Entry Price (USDT)</label>
              <Input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder={selectedPair.price.toString()}
                className="mt-1"
              />
            </div>

            {/* Position Details */}
            {collateral && entryPrice && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Position Size</span>
                  <span className="font-semibold">{calculatePositionSize()} {selectedPair.symbol.split('/')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Position Value</span>
                  <span className="font-semibold">${(parseFloat(collateral) * leverage[0]).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Liquidation Price</span>
                  <span className="font-semibold text-red-600">${calculateLiquidationPrice()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Margin Used</span>
                  <span className="font-semibold">{collateral} USDT</span>
                </div>
              </div>
            )}

            <Button
              onClick={openPosition}
              className={`w-full ${side === 'long' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              Open {side === 'long' ? 'Long' : 'Short'} Position
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Positions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Open Positions</h3>
        {positions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No open positions
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {positions.map(pos => (
              <Card key={pos.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg">{pos.pair}</span>
                        <Badge variant={pos.side === 'long' ? 'default' : 'outline'} 
                          className={pos.side === 'long' ? 'bg-green-600' : 'bg-red-600 text-white'}>
                          {pos.side.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{pos.leverage}x</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {pos.amount} @ ${pos.entryPrice.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${pos.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pos.unrealizedPnL >= 0 ? '+' : ''}{pos.unrealizedPnL.toFixed(2)} USDT
                      </div>
                      <div className="text-sm text-gray-600">
                        {pos.unrealizedPnL >= 0 ? '+' : ''}{((pos.unrealizedPnL / pos.collateral) * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <div className="text-gray-600">Collateral</div>
                      <div className="font-semibold">{pos.collateral} USDT</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Liq. Price</div>
                      <div className="font-semibold text-red-600">${pos.liquidationPrice.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Position Value</div>
                      <div className="font-semibold">${(pos.collateral * pos.leverage).toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Add Margin
                    </Button>
                    <Button variant="destructive" size="sm" className="flex-1">
                      Close Position
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}