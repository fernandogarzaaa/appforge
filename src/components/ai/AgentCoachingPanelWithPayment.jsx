import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import AgentCoachingPanel from './AgentCoachingPanel';
import SolanaPaymentModal from '@/components/payments/SolanaPaymentModal';
import { Card, CardContent } from '@/components/ui/card';
import { Zap } from 'lucide-react';

export default function AgentCoachingPanelWithPayment({ agentId, userId }) {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [solanaConfig, setSolanaConfig] = useState(null);
  const [pendingAnalysis, setPendingAnalysis] = useState(null);

  React.useEffect(() => {
    loadSolanaConfig();
  }, []);

  const loadSolanaConfig = async () => {
    try {
      const response = await base44.functions.invoke('getSolanaConfig', {});
      const config = response?.data || null;
      if (config && config.payment_enabled) {
        setSolanaConfig(config);
      }
    } catch (error) {
      console.error('Error loading Solana config:', error);
    }
  };

  const handleAnalysisRequest = async (analysisData) => {
    if (!solanaConfig?.payment_enabled) {
      // If payments disabled, create analysis directly
      await base44.functions.invoke('generateCoachingRecommendations', {
        agent_id: agentId,
        analysis_type: 'performance'
      });
      return;
    }

    // Store pending analysis and show payment modal
    setPendingAnalysis(analysisData);
    setPaymentAmount(solanaConfig.price_per_analysis);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (txSignature) => {
    try {
      // Generate the coaching analysis after payment
      const result = await base44.functions.invoke('generateCoachingRecommendations', {
        agent_id: agentId,
        analysis_type: 'performance',
        payment_tx: txSignature
      });

      // Create workflow if requested
      if (pendingAnalysis?.createWorkflow) {
        await base44.functions.invoke('createGuidedWorkflow', {
          agent_id: agentId,
          source_type: 'user_guided',
          payment_tx: txSignature
        });
      }

      setPendingAnalysis(null);
    } catch (error) {
      console.error('Error creating analysis:', error);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {solanaConfig?.payment_enabled && (
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-semibold text-purple-900">Powered by Solana</p>
                    <p className="text-xs text-purple-700">Pay only {solanaConfig.price_per_analysis} SOL per analysis</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <AgentCoachingPanel
          agentId={agentId}
          userId={userId}
          onAnalysisRequest={handleAnalysisRequest}
        />
      </div>

      <SolanaPaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        paymentType="coaching_analysis"
        amount={paymentAmount}
        referenceId={agentId}
        onPaymentSuccess={handlePaymentSuccess}
        itemName="Coaching Analysis"
      />
    </>
  );
}
