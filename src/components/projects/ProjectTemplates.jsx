import React from 'react';
import { Database, ShoppingCart, Users, FileText, Sparkles, Globe, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

const templates = [
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start from scratch with an empty project',
    icon: Sparkles,
    color: '#6366f1',
    entities: [],
    pages: []
  },
  {
    id: 'saas',
    name: 'SaaS App',
    description: 'User management, subscriptions, and billing',
    icon: Briefcase,
    color: '#8b5cf6',
    entities: ['User', 'Subscription', 'Invoice'],
    pages: ['Dashboard', 'Settings', 'Billing']
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Products, orders, and customer management',
    icon: ShoppingCart,
    color: '#ec4899',
    entities: ['Product', 'Order', 'Customer', 'Category'],
    pages: ['Products', 'Orders', 'Customers']
  },
  {
    id: 'crm',
    name: 'CRM',
    description: 'Contacts, deals, and pipeline management',
    icon: Users,
    color: '#14b8a6',
    entities: ['Contact', 'Deal', 'Company', 'Activity'],
    pages: ['Contacts', 'Deals', 'Pipeline']
  },
  {
    id: 'blog',
    name: 'Blog/CMS',
    description: 'Content management and publishing',
    icon: FileText,
    color: '#f59e0b',
    entities: ['Post', 'Category', 'Tag', 'Comment'],
    pages: ['Posts', 'Categories', 'Editor']
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Showcase projects and skills',
    icon: Globe,
    color: '#06b6d4',
    entities: ['Project', 'Skill', 'Experience'],
    pages: ['Home', 'Projects', 'About']
  }
];

export default function ProjectTemplates({ onSelect, selected }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template)}
          className={cn(
            "text-left p-3 rounded-lg border-2 transition-all",
            selected?.id === template.id
              ? "border-gray-900 bg-gray-50"
              : "border-gray-200 hover:border-gray-300 bg-white"
          )}
        >
          <div className="flex items-start gap-2.5 mb-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${template.color}20` }}
            >
              <template.icon className="w-4 h-4" style={{ color: template.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-[13px] text-gray-900">{template.name}</h3>
              <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                {template.description}
              </p>
            </div>
          </div>
          {template.entities.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <Database className="w-3 h-3" />
              <span>{template.entities.length} entities</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

export { templates };