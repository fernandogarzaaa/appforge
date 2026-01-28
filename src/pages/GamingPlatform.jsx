import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Gamepad2, Trophy, Coins, Star, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

const games = [
  { id: 1, name: 'Battle Royale', category: 'Action', players: 1240, reward: 500, image: '🎮' },
  { id: 2, name: 'Racing Challenge', category: 'Racing', players: 890, reward: 300, image: '🏎️' },
  { id: 3, name: 'Puzzle Master', category: 'Puzzle', players: 2340, reward: 200, image: '🧩' },
  { id: 4, name: 'Space Battle', category: 'Shooter', players: 560, reward: 400, image: '🚀' }
];

const leaderboard = [
  { rank: 1, username: 'ProGamer123', points: 15420, tokens: 5200 },
  { rank: 2, username: 'CryptoKing', points: 12890, tokens: 4100 },
  { rank: 3, username: 'TokenMaster', points: 10340, tokens: 3600 },
  { rank: 4, username: 'GameNinja', points: 8920, tokens: 2800 },
  { rank: 5, username: 'BlockchainPro', points: 7650, tokens: 2400 }
];

export default function GamingPlatform() {
  const [userBalance, setUserBalance] = useState(2450);
  const [selectedGame, setSelectedGame] = useState(null);

  const playGame = (game) => {
    setSelectedGame(game);
    toast.success(`Starting ${game.name}...`);
    // Simulate game play
    setTimeout(() => {
      const reward = Math.floor(Math.random() * game.reward);
      setUserBalance(userBalance + reward);
      toast.success(`You earned ${reward} tokens! 🎉`);
      setSelectedGame(null);
    }, 3000);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Gaming Platform</h1>
        <p className="text-gray-500">Play games, earn tokens, and compete on the leaderboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Coins className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold">{userBalance.toLocaleString()}</div>
            <p className="text-sm text-gray-600">Your Tokens</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold">42</div>
            <p className="text-sm text-gray-600">Games Won</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold">8,920</div>
            <p className="text-sm text-gray-600">Total Points</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold">#24</div>
            <p className="text-sm text-gray-600">Global Rank</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Games */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Games</TabsTrigger>
              <TabsTrigger value="action">Action</TabsTrigger>
              <TabsTrigger value="racing">Racing</TabsTrigger>
              <TabsTrigger value="puzzle">Puzzle</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {games.map(game => (
                  <Card key={game.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="text-6xl">{game.image}</div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{game.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">{game.category}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Active Players</span>
                          <span className="font-semibold">{game.players.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Max Reward</span>
                          <span className="font-semibold text-yellow-600">{game.reward} tokens</span>
                        </div>
                        <Button
                          onClick={() => playGame(game)}
                          disabled={selectedGame?.id === game.id}
                          className="w-full"
                        >
                          {selectedGame?.id === game.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Playing...
                            </>
                          ) : (
                            <>
                              <Gamepad2 className="w-4 h-4 mr-2" />
                              Play Now
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="action">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {games.filter(g => g.category === 'Action').map(game => (
                  <Card key={game.id}>
                    <CardHeader>
                      <CardTitle>{game.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => playGame(game)} className="w-full">
                        Play Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Token Store */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Token Store</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { amount: 1000, price: '$9.99', bonus: '+10%' },
                  { amount: 5000, price: '$39.99', bonus: '+20%' },
                  { amount: 10000, price: '$69.99', bonus: '+30%' }
                ].map((pack, i) => (
                  <Card key={i} className="text-center">
                    <CardContent className="pt-6">
                      <Coins className="w-12 h-12 mx-auto mb-3 text-yellow-600" />
                      <div className="text-2xl font-bold mb-1">{pack.amount.toLocaleString()}</div>
                      <div className="text-sm text-gray-600 mb-2">Tokens</div>
                      {pack.bonus && (
                        <Badge className="bg-green-100 text-green-700 mb-3">{pack.bonus} Bonus</Badge>
                      )}
                      <div className="text-xl font-bold mb-3">{pack.price}</div>
                      <Button size="sm" className="w-full">Purchase</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((player, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      i < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      i === 0 ? 'bg-yellow-500 text-white' :
                      i === 1 ? 'bg-gray-400 text-white' :
                      i === 2 ? 'bg-orange-600 text-white' :
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {player.rank}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{player.username}</div>
                      <div className="text-xs text-gray-600">{player.points.toLocaleString()} pts</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-yellow-600">{player.tokens}</div>
                      <div className="text-xs text-gray-600">tokens</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: '🏆', title: 'First Victory', reward: 100 },
                { icon: '⚔️', title: 'Battle Master', reward: 250 },
                { icon: '🎯', title: 'Perfect Score', reward: 500 }
              ].map((achievement, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{achievement.icon}</span>
                    <span className="text-sm font-medium">{achievement.title}</span>
                  </div>
                  <Badge variant="outline" className="text-yellow-600">+{achievement.reward}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}