import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Mail, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ReferralLinkGenerator({ userEmail }) {
  const [referralCode, setReferralCode] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 11).toUpperCase();
  };

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const code = generateCode();
      setReferralCode(code);

      // Create referral record
      await base44.entities.Referral.create({
        referrer_email: userEmail,
        referral_code: code,
        status: 'pending',
        reward_type: 'credits',
        reward_amount: 100,
        invited_at: new Date().toISOString()
      });

      toast.success('Referral link generated!');
    } catch (error) {
      console.error('Error generating referral:', error);
      toast.error('Failed to generate referral link');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const code = generateCode();

      // Create referral record
      await base44.entities.Referral.create({
        referrer_email: userEmail,
        referee_email: inviteEmail,
        referral_code: code,
        status: 'pending',
        reward_type: 'credits',
        reward_amount: 100,
        invited_at: new Date().toISOString()
      });

      // Send invitation email
      await base44.integrations.Core.SendEmail({
        to: inviteEmail,
        subject: `${userEmail} invited you to join!`,
        body: `You've been invited to join our platform! Use referral code: ${code}\n\nJoin now and both of you will earn 100 credits!`
      });

      toast.success('Invitation sent!');
      setInviteEmail('');
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const link = `${window.location.origin}?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Share & Earn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-semibold">Your Referral Code</label>
          <div className="flex gap-2 mt-2">
            <Input value={referralCode || 'Click generate to create'} readOnly />
            {referralCode && (
              <Button size="icon" onClick={copyToClipboard}>
                <Copy className="w-4 h-4" />
              </Button>
            )}
          </div>
          {!referralCode && (
            <Button onClick={handleGenerateLink} disabled={loading} className="mt-2 w-full">
              Generate Link
            </Button>
          )}
        </div>

        <div className="border-t pt-4">
          <label className="text-sm font-semibold">Invite by Email</label>
          <div className="flex gap-2 mt-2">
            <Input
              type="email"
              placeholder="friend@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <Button onClick={handleInvite} disabled={loading} size="icon">
              <Mail className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded text-sm text-blue-900">
          💰 Earn 100 credits when someone accepts your invite!
        </div>
      </CardContent>
    </Card>
  );
}