import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Plus, Edit, Trash, ShoppingCart, FileText, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function TemplateManagement() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      if (userData?.role === 'admin') {
        const allProjects = await base44.asServiceRole.entities.Project.filter(
          { template_type: { $ne: null } },
          '-created_date'
        );
        setProjects(allProjects);
      }
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  const templateStats = {
    total: projects.length,
    ecommerce: projects.filter(p => p.template_type?.includes('Commerce')).length,
    blog: projects.filter(p => p.template_type?.includes('Blog')).length,
    social: projects.filter(p => p.template_type?.includes('Social')).length,
    saas: projects.filter(p => p.template_type?.includes('SaaS')).length
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  if (user?.role !== 'admin') {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-semibold">Admin Access Required</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{templateStats.total}</div>
            <div className="text-xs text-gray-600">Total Templates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <ShoppingCart className="w-6 h-6 text-green-600 mb-2" />
            <div className="text-xl font-bold">{templateStats.ecommerce}</div>
            <div className="text-xs text-gray-600">E-Commerce</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <FileText className="w-6 h-6 text-blue-600 mb-2" />
            <div className="text-xl font-bold">{templateStats.blog}</div>
            <div className="text-xs text-gray-600">Blog/CMS</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Users className="w-6 h-6 text-purple-600 mb-2" />
            <div className="text-xl font-bold">{templateStats.social}</div>
            <div className="text-xs text-gray-600">Social Media</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xl font-bold">{templateStats.saas}</div>
            <div className="text-xs text-gray-600">SaaS</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Template Projects</CardTitle>
            <Button size="sm" className="bg-purple-600">
              <Plus className="w-4 h-4 mr-1" />
              Add Custom Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {projects.map(project => (
              <div key={project.id} className="p-4 bg-gray-50 rounded-lg border flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{project.name}</span>
                    <Badge variant="outline">{project.template_type}</Badge>
                  </div>
                  <div className="text-xs text-gray-600">{project.description}</div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>Created: {new Date(project.created_date).toLocaleDateString()}</span>
                    <span>By: {project.created_by}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600">
                    <Trash className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Template Generation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Default Components</label>
              <Input placeholder="Component count" type="number" defaultValue="12" />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Default Pages</label>
              <Input placeholder="Page count" type="number" defaultValue="8" />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block">Template Generation Prompt</label>
            <Textarea
              placeholder="System prompt for template generation..."
              className="min-h-[100px]"
              defaultValue="Generate production-ready, fully-functional code with modern best practices..."
            />
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}