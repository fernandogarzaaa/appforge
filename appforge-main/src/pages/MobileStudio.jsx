import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Plus, Code, Download, Eye, Zap } from 'lucide-react';
import { toast } from 'sonner';
import MobileAppEditor from '@/components/mobile/MobileAppEditor';
import MobilePreview from '@/components/mobile/MobilePreview';
import CreateMobileAppModal from '@/components/mobile/CreateMobileAppModal';

export default function MobileStudio() {
  const [selectedApp, setSelectedApp] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: mobileApps = [] } = useQuery({
    queryKey: ['mobileApps'],
    queryFn: () => base44.entities.MobileApp.list('-created_date')
  });

  const buildAppMutation = useMutation({
    mutationFn: async (appId) => {
      const response = await base44.functions.invoke('buildMobileApp', { app_id: appId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mobileApps']);
      toast.success('App build started!');
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {!selectedApp ? (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Mobile App Studio</h1>
              <p className="text-gray-500">Build native mobile apps with visual tools</p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Mobile App
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{mobileApps.length}</div>
                <div className="text-sm text-gray-500">Total Apps</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {mobileApps.filter(a => a.status === 'published').length}
                </div>
                <div className="text-sm text-gray-500">Published</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {mobileApps.filter(a => a.platform === 'both').length}
                </div>
                <div className="text-sm text-gray-500">Cross-Platform</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {mobileApps.filter(a => a.status === 'building').length}
                </div>
                <div className="text-sm text-gray-500">Building</div>
              </CardContent>
            </Card>
          </div>

          {/* Apps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mobileApps.map(app => (
              <Card key={app.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Smartphone className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{app.name}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">{app.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Badge variant="outline" className="capitalize">{app.platform}</Badge>
                    <Badge variant="outline" className="capitalize">{app.app_type.replace('_', ' ')}</Badge>
                    <Badge variant={app.status === 'published' ? 'default' : 'secondary'}>
                      {app.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedApp(app)}
                    >
                      <Code className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => buildAppMutation.mutate(app.id)}
                      disabled={buildAppMutation.isPending}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Build
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {mobileApps.length === 0 && (
              <Card className="col-span-full text-center py-12">
                <Smartphone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">No Mobile Apps Yet</h3>
                <p className="text-gray-500 mb-4">Create your first mobile app to get started</p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Mobile App
                </Button>
              </Card>
            )}
          </div>

          <CreateMobileAppModal 
            open={showCreateModal} 
            onClose={() => setShowCreateModal(false)}
          />
        </div>
      ) : (
        <MobileAppEditor 
          app={selectedApp} 
          onBack={() => setSelectedApp(null)} 
        />
      )}
    </div>
  );
}