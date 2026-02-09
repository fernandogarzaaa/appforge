import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, X, Lightbulb, ArrowRight, 
  Zap, BookOpen, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProactiveAIAssistant({ projectId, currentPage }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [timeOnPage, setTimeOnPage] = useState(0);
  const [lastActions, setLastActions] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['proactiveAIConfig'],
    queryFn: async () => {
      const configs = await base44.entities.ProactiveAIConfig.list();
      return configs[0] || { enabled: true, frequency: 'medium' };
    },
    staleTime: 5 * 60 * 1000
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000
  });

  // Track time on page
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOnPage(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Determine when to show assistance based on frequency
  const shouldShowAssistance = () => {
    if (!config?.enabled) return false;
    if (dismissed) return false;
    
    const pageName = currentPage || location.pathname.split('/').pop();
    if (!config?.show_on_pages?.includes(pageName)) return false;

    const thresholds = {
      low: 45,      // Show after 45 seconds
      medium: 20,   // Show after 20 seconds
      high: 10      // Show after 10 seconds
    };

    return timeOnPage >= (thresholds[config.frequency] || 20);
  };

  const { data: assistance, refetch } = useQuery({
    queryKey: ['contextualAssistance', currentPage, projectId],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateContextualAssistance', {
        context_page: currentPage || location.pathname.split('/').pop(),
        project_id: projectId,
        user_activity: lastActions.join(', '),
        time_on_page: timeOnPage,
        last_actions: lastActions.slice(-3).join(', ')
      });
      return response.data.assistance;
    },
    enabled: shouldShowAssistance() && !!user,
    staleTime: Infinity, // Don't refetch automatically
  });

  useEffect(() => {
    if (assistance && !dismissed) {
      setVisible(true);
    }
  }, [assistance, dismissed]);

  // Reset when page changes
  useEffect(() => {
    setTimeOnPage(0);
    setLastActions([]);
    setDismissed(false);
    setVisible(false);
  }, [location.pathname]);

  const updateAssistance = useMutation({
    mutationFn: async ({ action }) => {
      const recent = await base44.entities.ProactiveAssistance.filter({
        user_id: user.email,
        context_page: currentPage || location.pathname.split('/').pop()
      });
      
      if (recent.length > 0) {
        const latest = recent.sort((a, b) => 
          new Date(b.triggered_at) - new Date(a.triggered_at)
        )[0];
        
        await base44.entities.ProactiveAssistance.update(latest.id, {
          user_action: action
        });
      }
    }
  });

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    updateAssistance.mutate({ action: 'dismissed' });
  };

  const handleAccept = () => {
    updateAssistance.mutate({ action: 'accepted' });
    if (assistance?.action_url) {
      navigate(assistance.action_url);
    }
    setVisible(false);
  };

  if (!visible || !assistance) return null;

  const icons = {
    tip: Lightbulb,
    feature_suggestion: Zap,
    roadblock_help: AlertCircle,
    best_practice: BookOpen
  };

  const Icon = icons[assistance.assistance_type] || Sparkles;

  const gradients = {
    tip: 'from-yellow-500 to-orange-500',
    feature_suggestion: 'from-purple-500 to-indigo-500',
    roadblock_help: 'from-red-500 to-pink-500',
    best_practice: 'from-blue-500 to-cyan-500'
  };

  const gradient = gradients[assistance.assistance_type] || 'from-purple-500 to-indigo-500';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50 max-w-md"
        >
          <Card className="border-2 shadow-2xl">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{assistance.title}</h4>
                    <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 text-xs">
                      AI Tip
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{assistance.message}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="flex-shrink-0 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDismiss}
                  className="flex-1"
                >
                  Maybe later
                </Button>
                {assistance.action_url && (
                  <Button
                    size="sm"
                    onClick={handleAccept}
                    className={`flex-1 bg-gradient-to-r ${gradient} text-white`}
                  >
                    {assistance.action_label || 'Learn more'}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>

              <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
                <span>Powered by QuantumAI</span>
                <Sparkles className="w-3 h-3" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}