import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Maximize2, Minimize2, RefreshCw, Eye, Smartphone, Monitor, Tablet, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export default function LivePreview({ projectId }) {
  const [device, setDevice] = useState('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const iframeRef = useRef(null);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => base44.entities.Project.get(projectId),
  });

  const { data: entities = [] } = useQuery({
    queryKey: ['entities', projectId],
    queryFn: () => base44.entities.Entity.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: pages = [] } = useQuery({
    queryKey: ['pages', projectId],
    queryFn: () => base44.entities.Page.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const deviceSizes = {
    mobile: { width: 375, height: 667, icon: Smartphone, label: 'Mobile' },
    tablet: { width: 768, height: 1024, icon: Tablet, label: 'Tablet' },
    desktop: { width: '100%', height: '100%', icon: Monitor, label: 'Desktop' }
  };

  const generatePreviewHTML = () => {
    const actualProject = project?.data || project;
    const entitiesArray = Array.isArray(entities) ? entities : (entities?.data || []);
    const pagesArray = Array.isArray(pages) ? pages : (pages?.data || []);

    // Extract business context
    const businessName = actualProject?.name || 'My App';
    const description = actualProject?.description || 'Welcome to our application';
    const primaryColor = actualProject?.color || '#6366f1';
    
    // Get homepage content
    const homepage = pagesArray.find(p => p.path === '/' || p.name === 'Home');
    const pageContent = homepage?.content || {};

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${businessName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      --primary-color: ${primaryColor};
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .gradient-bg {
      background: linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%);
    }
    .primary-btn {
      background: ${primaryColor};
      color: white;
      transition: all 0.3s ease;
    }
    .primary-btn:hover {
      opacity: 0.9;
      transform: translateY(-2px);
    }
  </style>
</head>
<body class="bg-gray-50">
  <!-- Header -->
  <header class="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center gap-2">
          <span class="text-2xl">${actualProject?.icon || '✨'}</span>
          <span class="text-xl font-bold text-gray-900">${businessName}</span>
        </div>
        <div class="hidden md:flex items-center gap-6">
          ${pagesArray.slice(0, 5).map(page => 
            `<a href="#${page.path}" class="text-gray-600 hover:text-gray-900 transition-colors">${page.name}</a>`
          ).join('')}
          <button class="primary-btn px-6 py-2 rounded-lg font-medium shadow-md">Get Started</button>
        </div>
      </div>
    </nav>
  </header>

  <!-- Hero Section -->
  <section class="gradient-bg py-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 class="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
        ${pageContent.heroHeadline || pageContent.hero_headline || businessName}
      </h1>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
        ${pageContent.heroSubheadline || pageContent.hero_subheadline || description}
      </p>
      <div class="flex gap-4 justify-center">
        <button class="primary-btn px-8 py-4 rounded-xl text-lg font-semibold shadow-lg">
          ${pageContent.callToAction || pageContent.call_to_action || 'Get Started'}
        </button>
        <button class="bg-white px-8 py-4 rounded-xl text-lg font-semibold border-2 border-gray-200 hover:border-gray-300 transition-all">
          Learn More
        </button>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  ${entitiesArray.length > 0 ? `
  <section class="py-16 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-3xl font-bold text-center mb-12 text-gray-900">
        ${entitiesArray.length > 1 ? 'Our Features' : 'What We Offer'}
      </h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        ${entitiesArray.slice(0, 6).map(entity => `
          <div class="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div class="w-12 h-12 rounded-xl mb-4 flex items-center justify-center text-2xl" style="background: ${primaryColor}20;">
              ${entity.icon || '📦'}
            </div>
            <h3 class="text-xl font-semibold mb-2 text-gray-900">${entity.name}</h3>
            <p class="text-gray-600 text-sm">
              ${entity.description || `Manage ${entity.name.toLowerCase()} with ease`}
            </p>
            <div class="mt-4 text-xs text-gray-500">
              ${Object.keys(entity.schema || {}).length} fields
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </section>
  ` : ''}

  <!-- CTA Section -->
  <section class="py-20 gradient-bg">
    <div class="max-w-4xl mx-auto text-center px-4">
      <h2 class="text-4xl font-bold mb-6 text-gray-900">Ready to get started?</h2>
      <p class="text-xl text-gray-600 mb-8">
        ${pageContent.aboutSection || pageContent.about_section || 'Join thousands of users who trust our platform'}
      </p>
      <button class="primary-btn px-10 py-4 rounded-xl text-lg font-semibold shadow-xl">
        Start Building Now
      </button>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-gray-900 text-white py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row justify-between items-center">
        <div class="flex items-center gap-2 mb-4 md:mb-0">
          <span class="text-2xl">${actualProject?.icon || '✨'}</span>
          <span class="text-lg font-semibold">${businessName}</span>
        </div>
        <div class="text-sm text-gray-400">
          Built with AppForge • ${new Date().getFullYear()}
        </div>
      </div>
    </div>
  </footer>

  <script>
    // Add smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  </script>
</body>
</html>
    `;
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (!document.fullscreenElement) {
        iframeRef.current.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    }
  };

  const handleOpenExternal = () => {
    const html = generatePreviewHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No project selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Preview Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Live Preview</h3>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
              Real-time
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Device Selector */}
            <Tabs value={device} onValueChange={setDevice} className="w-auto">
              <TabsList className="h-9 bg-white">
                {Object.entries(deviceSizes).map(([key, { icon: Icon, label }]) => (
                  <TabsTrigger 
                    key={key} 
                    value={key}
                    className="px-3 h-8"
                  >
                    <Icon className="w-4 h-4" />
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="h-6 w-px bg-gray-200" />

            {/* Actions */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-9 px-3"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenExternal}
              className="h-9 px-3"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFullscreen}
              className="h-9 px-3"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="bg-gray-100 p-8 min-h-[600px] flex items-center justify-center">
        <div 
          className={cn(
            "bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300",
            device === 'desktop' && "w-full h-full",
            device !== 'desktop' && "mx-auto"
          )}
          style={{
            width: device !== 'desktop' ? deviceSizes[device].width : '100%',
            height: device !== 'desktop' ? deviceSizes[device].height : '600px',
          }}
        >
          <iframe
            key={refreshKey}
            ref={iframeRef}
            srcDoc={generatePreviewHTML()}
            className="w-full h-full border-0"
            title="Live Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      {/* Preview Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-xs text-gray-500 flex items-center justify-between">
        <span>
          {device === 'desktop' ? 'Responsive' : `${deviceSizes[device].width}x${deviceSizes[device].height}`} • 
          {' '}{entities?.length || 0} entities • {pages?.length || 0} pages
        </span>
        <span className="text-gray-400">
          Updates automatically
        </span>
      </div>
    </div>
  );
}
