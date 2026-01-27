import React, { useState } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, TrendingDown, Maximize2, Activity, CandlestickChart, LineChartIcon 
} from 'lucide-react';

const generateChartData = (basePrice, days = 30) => {
  const data = [];
  let price = basePrice;
  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.48) * 1000;
    price += change;
    data.push({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      price: parseFloat(price.toFixed(2)),
      volume: Math.random() * 1000000000,
      high: price + Math.random() * 500,
      low: price - Math.random() * 500
    });
  }
  return data;
};

export default function TradingChart({ selectedPair }) {
  const [timeframe, setTimeframe] = useState('1D');
  const [chartType, setChartType] = useState('line');
  const [indicators, setIndicators] = useState({
    sma: false,
    ema: false,
    rsi: false,
    macd: false,
    bollinger: false
  });

  const chartData = generateChartData(selectedPair.price, 
    timeframe === '1H' ? 24 : timeframe === '1D' ? 30 : timeframe === '1W' ? 90 : 365
  );

  const toggleIndicator = (indicator) => {
    setIndicators(prev => ({ ...prev, [indicator]: !prev[indicator] }));
  };

  const timeframes = ['1H', '4H', '1D', '1W', '1M', '1Y'];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {timeframes.map(tf => (
            <Button
              key={tf}
              variant={timeframe === tf ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={chartType === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('line')}
          >
            <LineChartIcon className="w-4 h-4" />
          </Button>
          <Button
            variant={chartType === 'area' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('area')}
          >
            <Activity className="w-4 h-4" />
          </Button>
          <Button
            variant={chartType === 'candle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('candle')}
          >
            <CandlestickChart className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Technical Indicators */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-600 self-center">Indicators:</span>
        {Object.keys(indicators).map(indicator => (
          <Badge
            key={indicator}
            variant={indicators[indicator] ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-gray-100"
            onClick={() => toggleIndicator(indicator)}
          >
            {indicator.toUpperCase()}
          </Badge>
        ))}
      </div>

      {/* Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} domain={['dataMin - 1000', 'dataMax + 1000']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={false} 
              />
              {indicators.sma && (
                <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={1} dot={false} />
              )}
              {indicators.ema && (
                <Line type="monotone" dataKey="price" stroke="#f59e0b" strokeWidth={1} dot={false} />
              )}
            </LineChart>
          ) : chartType === 'area' ? (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} domain={['dataMin - 1000', 'dataMax + 1000']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="#3b82f6" 
                fill="url(#colorPrice)" 
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Bar dataKey="volume" fill="#3b82f6" opacity={0.7} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
        <div>
          <div className="text-xs text-gray-600">Current</div>
          <div className="text-lg font-bold">${selectedPair.price.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600">24h Change</div>
          <div className={`text-lg font-bold flex items-center gap-1 ${selectedPair.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {selectedPair.change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {selectedPair.change > 0 ? '+' : ''}{selectedPair.change}%
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600">24h High</div>
          <div className="text-lg font-bold text-green-600">${selectedPair.high.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600">24h Low</div>
          <div className="text-lg font-bold text-red-600">${selectedPair.low.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}