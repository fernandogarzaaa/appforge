import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';

export default function QuantumAIBadge() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000
  });

  const { data: prefs = [], isLoading } = useQuery({
    queryKey: ['quantumPref', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.UserPreference.filter({ user_id: user.email });
    },
    enabled: !!user,
    staleTime: 30 * 1000
  });

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['quantumConfig'],
    queryFn: () => base44.entities.QuantumLLMConfig.list(),
    staleTime: 5 * 60 * 1000
  });

  const config = configs[0];
  const pref = prefs[0];
  const isQuantumEnabled = pref?.use_quantum_ai ?? config?.enabled ?? true;

  if (!isQuantumEnabled) return null;

  return (
    <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 text-xs">
      <Brain className="w-3 h-3 mr-1" />
      QuantumAI
    </Badge>
  );
}