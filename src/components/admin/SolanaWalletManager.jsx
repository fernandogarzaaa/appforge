import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, Wallet, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function SolanaWalletManager() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    wallet_address: '',
    network: 'mainnet-beta',
    payment_enabled: false
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await base44.functions.invoke('getSolanaConfig', {});
      const loaded = response?.data || null;

      if (loaded) {
        setConfig(loaded);
        setFormData({
          wallet_address: loaded.wallet_address || '',
          network: loaded.network || 'mainnet-beta',
          payment_enabled: loaded.payment_enabled || false
        });
      } else {
        setFormData({
          wallet_address: '',
          network: 'mainnet-beta',
          payment_enabled: false
        });
      }
    } catch (error) {
      console.error('Error loading Solana config:', error);
      toast.error('Failed to load wallet configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.wallet_address.trim()) {
      toast.error('Please enter a wallet address');
      return;
    }

    setSaving(true);
    try {
      const response = await base44.functions.invoke('upsertSolanaConfig', {
        wallet_address: formData.wallet_address,
        network: formData.network,
        payment_enabled: formData.payment_enabled
      });

      setConfig(response?.data || null);
      toast.success('Wallet configuration saved successfully');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save wallet configuration');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Loading wallet configuration...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-600" />
            Solana Wallet Configuration
          </CardTitle>
          <CardDescription>
            Manage your Solana wallet for receiving payments. This is the only payment method in use.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Network Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Network</label>
            <select
              value={formData.network}
              onChange={(e) => setFormData(prev => ({ ...prev, network: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="mainnet-beta">Mainnet (Production)</option>
              <option value="devnet">Devnet (Testing)</option>
              <option value="testnet">Testnet</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.network === 'mainnet-beta' && 'Production network - real payments'}
              {formData.network === 'devnet' && 'Development network - test payments'}
              {formData.network === 'testnet' && 'Test network - testing only'}
            </p>
          </div>

          {/* Wallet Address */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Wallet Address</label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter your Solana wallet public address (44 characters)"
                value={formData.wallet_address}
                onChange={(e) => setFormData(prev => ({ ...prev, wallet_address: e.target.value }))}
                className="font-mono text-sm"
              />
              {formData.wallet_address && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(formData.wallet_address)}
                  title="Copy wallet address"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
            {formData.wallet_address && formData.wallet_address.length !== 44 && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Solana addresses should be 44 characters long
              </p>
            )}
          </div>

          {/* Payment Enabled Toggle */}
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div>
              <p className="font-semibold text-gray-900">Enable Solana Payments</p>
              <p className="text-sm text-gray-600">Allow users to pay with Solana</p>
            </div>
            <button
              onClick={() => setFormData(prev => ({ ...prev, payment_enabled: !prev.payment_enabled }))}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                formData.payment_enabled ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  formData.payment_enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Status Info */}
          {formData.wallet_address && formData.payment_enabled && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-green-900">Payments Active</p>
                <p className="text-green-800 text-xs mt-1">Users can now pay with Solana</p>
              </div>
            </div>
          )}

          {!formData.payment_enabled && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-900">Payments Disabled</p>
                <p className="text-yellow-800 text-xs mt-1">Toggle above to enable Solana payments</p>
              </div>
            </div>
          )}

          {/* Payment Stats */}
          {config?.total_transactions > 0 && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-600">Total Received</p>
                <p className="text-lg font-bold text-purple-600">{(config.total_received_sol || 0).toFixed(2)} SOL</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Transactions</p>
                <p className="text-lg font-bold">{config.total_transactions || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Last Payment</p>
                <p className="text-sm text-gray-700">
                  {config.last_transaction_date 
                    ? new Date(config.last_transaction_date).toLocaleDateString()
                    : 'None'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            size="lg"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Getting Your Solana Wallet Address</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-gray-600">
          <p>1. Install Phantom or another Solana wallet</p>
          <p>2. Create or import your Solana wallet</p>
          <p>3. Copy your public address (usually shown in wallet settings)</p>
          <p>4. Paste it above and toggle payments to enable</p>
        </CardContent>
      </Card>
    </div>
  );
}
