import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Coins, TrendingUp, Lock, Calendar, Percent } from 'lucide-react';
import { toast } from 'sonner';

const stakingOptions = [
  { 
    id: 1, 
    coin: 'BTC', 
    apy: 5.2, 
    minAmount: 0.001, 
    lockPeriod: 30, 
    totalStaked: 1234.56,
    icon: '₿'
  },
  { 
    id: 2, 
    coin: 'ETH', 
    apy: 7.5, 
    minAmount: 0.1, 
    lockPeriod: 60, 
    totalStaked: 5678.90,
    icon: 'Ξ'
  },
  { 
    id: 3, 
    coin: 'SOL', 
    apy: 12.8, 
    minAmount: 10, 
    lockPeriod: 90, 
    totalStaked: 89012.34,
    icon: '◎'
  },
  { 
    id: 4, 
    coin: 'BNB', 
    apy: 9.3, 
    minAmount: 1, 
    lockPeriod: 45, 
    totalStaked: 3456.78,
    icon: 'BNB'
  }
];

export default function StakingPanel() {
  const [selectedStake, setSelectedStake] = useState(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [activeStakes, setActiveStakes] = useState([
    { id: 1, coin: 'ETH', amount: 2.5, apy: 7.5, startDate: new Date(), endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), earned: 0.12 }
  ]);

  const handleStake = () => {
    if (!selectedStake || !stakeAmount) {
      toast.error('Select a coin and enter amount');
      return;
    }

    if (parseFloat(stakeAmount) < selectedStake.minAmount) {
      toast.error(`Minimum stake amount is ${selectedStake.minAmount} ${selectedStake.coin}`);
      return;
    }

    const newStake = {
      id: Date.now(),
      coin: selectedStake.coin,
      amount: parseFloat(stakeAmount),
      apy: selectedStake.apy,
      startDate: new Date(),
      endDate: new Date(Date.now() + selectedStake.lockPeriod * 24 * 60 * 60 * 1000),
      earned: 0
    };

    setActiveStakes([...activeStakes, newStake]);
    toast.success(`Successfully staked ${stakeAmount} ${selectedStake.coin}`);
    setStakeAmount('');
    setSelectedStake(null);
  };

  const calculateProgress = (startDate, endDate) => {
    const total = endDate.getTime() - startDate.getTime();
    const elapsed = Date.now() - startDate.getTime();
    return Math.min((elapsed / total) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Staking Options */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Available Staking Pools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stakingOptions.map(option => (
            <Card 
              key={option.id}
              className={`cursor-pointer transition-all ${
                selectedStake?.id === option.id ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedStake(option)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                      {option.icon}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{option.coin}</div>
                      <div className="text-xs text-gray-500">Staking</div>
                    </div>
                  </div>
                  <Badge className="bg-green-600">
                    {option.apy}% APY
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lock Period</span>
                    <span className="font-semibold">{option.lockPeriod} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min. Amount</span>
                    <span className="font-semibold">{option.minAmount} {option.coin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Staked</span>
                    <span className="font-semibold">{option.totalStaked.toLocaleString()} {option.coin}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stake Input */}
      {selectedStake && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">Stake {selectedStake.coin}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Amount to Stake</label>
              <Input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder={`Min. ${selectedStake.minAmount}`}
                className="mt-1"
              />
            </div>

            <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Est. Annual Earnings</span>
                <span className="font-semibold text-green-600">
                  {stakeAmount ? (parseFloat(stakeAmount) * selectedStake.apy / 100).toFixed(4) : '0.0000'} {selectedStake.coin}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lock Period</span>
                <span className="font-semibold">{selectedStake.lockPeriod} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unlock Date</span>
                <span className="font-semibold">
                  {new Date(Date.now() + selectedStake.lockPeriod * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>

            <Button onClick={handleStake} className="w-full bg-blue-600 hover:bg-blue-700">
              <Lock className="w-4 h-4 mr-2" />
              Stake {selectedStake.coin}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Stakes */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Your Active Stakes</h3>
        {activeStakes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Coins className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No active stakes yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeStakes.map(stake => {
              const progress = calculateProgress(stake.startDate, stake.endDate);
              const daysLeft = Math.ceil((stake.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

              return (
                <Card key={stake.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="font-bold text-lg">{stake.amount} {stake.coin}</div>
                        <div className="text-sm text-gray-600">Staked on {stake.startDate.toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-600 mb-2">{stake.apy}% APY</Badge>
                        <div className="text-sm">
                          <span className="text-green-600 font-semibold">+{stake.earned.toFixed(4)} {stake.coin}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold">
                          {progress >= 100 ? 'Unlocked' : `${daysLeft} days left`}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" disabled={progress < 100}>
                        <Coins className="w-3 h-3 mr-2" />
                        Claim Rewards
                      </Button>
                      {progress >= 100 && (
                        <Button size="sm" className="flex-1">
                          Unstake
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}