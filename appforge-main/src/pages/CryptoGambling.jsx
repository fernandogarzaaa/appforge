import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Dice1, Dice3, Dice5, Sparkles, TrendingUp, 
  Coins, Award, Clock, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

export default function CryptoGambling() {
  const [balance, setBalance] = useState(1000);
  const [betAmount, setBetAmount] = useState(10);
  const [multiplier, setMultiplier] = useState(2);
  const [winChance, setWinChance] = useState(49.5);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState([]);
  const [lotteryTickets, setLotteryTickets] = useState(0);

  const rollDice = () => {
    if (betAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setRolling(true);
    setBalance(balance - betAmount);

    setTimeout(() => {
      const roll = Math.random() * 100;
      const won = roll < winChance;
      const payout = won ? betAmount * multiplier : 0;

      if (won) {
        setBalance(balance - betAmount + payout);
        toast.success(`You won ${payout.toFixed(2)} tokens! 🎉`);
      } else {
        toast.error('Better luck next time!');
      }

      setHistory([{
        id: Date.now(),
        bet: betAmount,
        won,
        payout,
        roll: roll.toFixed(2),
        time: new Date()
      }, ...history.slice(0, 9)]);

      setRolling(false);
    }, 1000);
  };

  const playCoinFlip = () => {
    if (betAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setBalance(balance - betAmount);
    const won = Math.random() > 0.5;

    setTimeout(() => {
      if (won) {
        const payout = betAmount * 1.98;
        setBalance(balance - betAmount + payout);
        toast.success(`You won ${payout.toFixed(2)} tokens! 🪙`);
      } else {
        toast.error('Try again!');
      }
    }, 500);
  };

  const buyLotteryTicket = () => {
    const ticketPrice = 5;
    if (balance < ticketPrice) {
      toast.error('Insufficient balance');
      return;
    }

    setBalance(balance - ticketPrice);
    setLotteryTickets(lotteryTickets + 1);
    toast.success('Lottery ticket purchased!');
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Crypto Casino</h1>
        <p className="text-gray-500">Provably fair blockchain gambling</p>
      </div>

      {/* Balance */}
      <Card className="mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Your Balance</p>
              <div className="text-4xl font-bold flex items-center gap-2 mt-1">
                <Coins className="w-8 h-8" />
                {balance.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <Button variant="secondary" size="sm">
                <DollarSign className="w-4 h-4 mr-2" />
                Deposit
              </Button>
              <p className="text-xs opacity-75 mt-2">Withdraw Anytime</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dice Game */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Dice5 className="w-5 h-5" />
                Dice Roll
              </CardTitle>
              <Badge>Provably Fair</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Bet Amount</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                  className="flex-1"
                />
                <Button variant="outline" onClick={() => setBetAmount(betAmount / 2)}>½</Button>
                <Button variant="outline" onClick={() => setBetAmount(betAmount * 2)}>2×</Button>
                <Button variant="outline" onClick={() => setBetAmount(balance)}>Max</Button>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-600">Win Chance</label>
                <span className="font-semibold">{winChance.toFixed(1)}%</span>
              </div>
              <Slider
                value={[winChance]}
                onValueChange={(val) => {
                  setWinChance(val[0]);
                  setMultiplier(((98 / val[0]) * 1).toFixed(2));
                }}
                min={1}
                max={95}
                step={0.1}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Roll Under {winChance.toFixed(1)}</span>
                <span>Multiplier: {multiplier}×</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Bet Amount</div>
                  <div className="font-semibold text-lg">{betAmount.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-600">Potential Win</div>
                  <div className="font-semibold text-lg text-green-600">
                    {(betAmount * multiplier).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={rollDice}
              disabled={rolling || betAmount === 0}
              className="w-full h-14 text-lg"
            >
              {rolling ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Rolling...
                </>
              ) : (
                <>
                  <Dice5 className="w-5 h-5 mr-2" />
                  Roll Dice
                </>
              )}
            </Button>

            {/* Quick Games */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-3xl mb-2">🪙</div>
                  <div className="font-semibold mb-1">Coin Flip</div>
                  <div className="text-xs text-gray-600 mb-3">50/50 chance</div>
                  <Button onClick={playCoinFlip} size="sm" className="w-full">
                    Play (1.98×)
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-3xl mb-2">🎰</div>
                  <div className="font-semibold mb-1">Slots</div>
                  <div className="text-xs text-gray-600 mb-3">Coming soon</div>
                  <Button size="sm" className="w-full" disabled>
                    Play
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Lottery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Lottery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  5,000
                </div>
                <div className="text-sm text-gray-600">Prize Pool</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="text-xs text-gray-600">Your Tickets</div>
                <div className="text-2xl font-bold">{lotteryTickets}</div>
              </div>
              <Button onClick={buyLotteryTicket} className="w-full" size="sm">
                <Coins className="w-3 h-3 mr-2" />
                Buy Ticket (5 tokens)
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Draw in 23h 45m
              </p>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Rolls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className={`p-2 rounded text-xs ${h.won ? 'bg-green-50' : 'bg-red-50'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={h.won ? 'text-green-700' : 'text-red-700'}>
                        Roll: {h.roll}
                      </span>
                      <Badge variant={h.won ? 'default' : 'outline'} className="text-xs">
                        {h.won ? `+${h.payout.toFixed(2)}` : `-${h.bet.toFixed(2)}`}
                      </Badge>
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No bets yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Wagered</span>
                <span className="font-semibold">1.2M tokens</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Bets</span>
                <span className="font-semibold">45,320</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Biggest Win</span>
                <span className="font-semibold text-green-600">12,450 tokens</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}