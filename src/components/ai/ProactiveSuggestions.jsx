import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Component, Layers, Zap, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { templates } from '@/components/projects/ProjectTemplates';

export default function ProactiveSuggestions({ projectId, onApplySuggestion }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId
  });

  const { data: entities = [] } = useQuery({
    queryKey: ['entities', projectId],
    queryFn: () => base44.entities.Entity.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  const { data: pages = [] } = useQuery({
    queryKey: ['pages', projectId],
    queryFn: () => base44.entities.Page.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  useEffect(() => {
    if (project && entities && pages) {
      generateSuggestions();
    }
  }, [project, entities, pages]);

  const generateSuggestions = async () => {
    setIsLoading(true);
    try {
      const context = {
        project_name: project?.name,
        entities_count: entities.length,
        pages_count: pages.length,
        entity_names: entities.map(e => e.name),
        page_names: pages.map(p => p.name)
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on this project context, suggest 3-5 relevant features, components, or improvements:

Project: ${context.project_name}
Entities: ${context.entity_names.join(', ') || 'none'}
Pages: ${context.page_names.join(', ') || 'none'}

Provide practical suggestions that would add value. Consider:
- Missing common features for this type of app
- UI components that would improve UX
- Integrations that make sense
- Data relationships that could be useful

Be specific and actionable.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  priority: { type: "string" },
                  action: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSuggestions(result.suggestions || []);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categoryIcons = {
    feature: Zap,
    component: Component,
    integration: Layers,
    default: Sparkles
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700'
  };

  // Template suggestions based on project context
  const relevantTemplates = templates.filter(t => 
    t.id !== 'blank' && 
    (!project?.name || t.name.toLowerCase().includes(project.name.toLowerCase().split(' ')[0]))
  ).slice(0, 2);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[13px] font-medium text-gray-900">Smart Suggestions</h3>
          <p className="text-[11px] text-gray-500">AI-powered recommendations for your project</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={generateSuggestions}
          disabled={isLoading}
          className="h-7 text-[11px]"
        >
          <Sparkles className="w-3 h-3 mr-1.5" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-[11px] text-gray-400">Analyzing your project...</div>
        </div>
      ) : (
        <div className="space-y-2">
          {suggestions.map((suggestion, i) => {
            const Icon = categoryIcons[suggestion.category.toLowerCase()] || categoryIcons.default;
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-[12px] font-medium text-gray-900">{suggestion.title}</h4>
                        <Badge className={priorityColors[suggestion.priority.toLowerCase()] || priorityColors.low}>
                          {suggestion.priority}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-gray-600 mb-2">{suggestion.description}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] text-indigo-600 hover:text-indigo-700 px-0"
                        onClick={() => onApplySuggestion?.(suggestion)}
                      >
                        {suggestion.action}
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}

          {relevantTemplates.length > 0 && (
            <>
              <div className="pt-2 pb-1">
                <h4 className="text-[11px] font-medium text-gray-500">Recommended Templates</h4>
              </div>
              {relevantTemplates.map((template, i) => (
                <Card key={template.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${template.color}20` }}
                    >
                      <template.icon className="w-4 h-4" style={{ color: template.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[12px] font-medium text-gray-900">{template.name}</h4>
                      <p className="text-[10px] text-gray-500">{template.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}