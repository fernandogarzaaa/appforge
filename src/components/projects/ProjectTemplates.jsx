import React from 'react';
import { 
  Database, ShoppingCart, Users, FileText, Sparkles, Globe, Briefcase,
  Heart, Calendar, GraduationCap, Utensils, Dumbbell, Building2,
  Ticket, MessageSquare, TrendingUp, Zap, Gamepad2, Music
} from 'lucide-react';
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
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Multi-vendor platform with listings',
    icon: Building2,
    color: '#f43f5e',
    entities: ['Listing', 'Vendor', 'Transaction', 'Review'],
    pages: ['Listings', 'Vendors', 'Dashboard']
  },
  {
    id: 'booking',
    name: 'Booking System',
    description: 'Appointments, schedules, and reservations',
    icon: Calendar,
    color: '#10b981',
    entities: ['Booking', 'Service', 'TimeSlot', 'Customer'],
    pages: ['Calendar', 'Services', 'Bookings']
  },
  {
    id: 'lms',
    name: 'Learning Platform',
    description: 'Courses, students, and progress tracking',
    icon: GraduationCap,
    color: '#3b82f6',
    entities: ['Course', 'Lesson', 'Student', 'Progress'],
    pages: ['Courses', 'Students', 'Analytics']
  },
  {
    id: 'social',
    name: 'Social Network',
    description: 'Posts, profiles, and social interactions',
    icon: MessageSquare,
    color: '#6366f1',
    entities: ['Post', 'User', 'Comment', 'Like'],
    pages: ['Feed', 'Profile', 'Messages']
  },
  {
    id: 'fitness',
    name: 'Fitness Tracker',
    description: 'Workouts, nutrition, and health metrics',
    icon: Dumbbell,
    color: '#f97316',
    entities: ['Workout', 'Exercise', 'Meal', 'Progress'],
    pages: ['Workouts', 'Nutrition', 'Stats']
  },
  {
    id: 'restaurant',
    name: 'Restaurant Menu',
    description: 'Menu items, orders, and reservations',
    icon: Utensils,
    color: '#ef4444',
    entities: ['MenuItem', 'Order', 'Reservation', 'Table'],
    pages: ['Menu', 'Orders', 'Reservations']
  },
  {
    id: 'events',
    name: 'Event Manager',
    description: 'Events, tickets, and attendee management',
    icon: Ticket,
    color: '#8b5cf6',
    entities: ['Event', 'Ticket', 'Attendee', 'Venue'],
    pages: ['Events', 'Tickets', 'Attendees']
  },
  {
    id: 'analytics',
    name: 'Analytics Dashboard',
    description: 'Data visualization and business metrics',
    icon: TrendingUp,
    color: '#06b6d4',
    entities: ['Metric', 'Report', 'Dataset', 'Dashboard'],
    pages: ['Overview', 'Reports', 'Insights']
  },
  {
    id: 'charity',
    name: 'Fundraising',
    description: 'Campaigns, donations, and donor management',
    icon: Heart,
    color: '#ec4899',
    entities: ['Campaign', 'Donation', 'Donor', 'Goal'],
    pages: ['Campaigns', 'Donors', 'Impact']
  },
  {
    id: 'automation',
    name: 'Automation Hub',
    description: 'Workflows, triggers, and integrations',
    icon: Zap,
    color: '#eab308',
    entities: ['Workflow', 'Trigger', 'Action', 'Integration'],
    pages: ['Workflows', 'Integrations', 'Logs']
  },
  {
    id: 'gaming',
    name: 'Gaming Platform',
    description: 'Games, players, leaderboards, and achievements',
    icon: Gamepad2,
    color: '#a855f7',
    entities: ['Game', 'Player', 'Score', 'Achievement'],
    pages: ['Games', 'Leaderboard', 'Achievements']
  },
  {
    id: 'music',
    name: 'Music Streaming',
    description: 'Songs, playlists, and artist profiles',
    icon: Music,
    color: '#14b8a6',
    entities: ['Song', 'Playlist', 'Artist', 'Album'],
    pages: ['Library', 'Playlists', 'Artists']
  }
];

export default function ProjectTemplates({ onSelect, selected }) {
  return (
    <div className="max-h-[400px] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-2.5">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className={cn(
              "text-left p-2.5 rounded-lg border-2 transition-all",
              selected?.id === template.id
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 hover:border-gray-300 bg-white"
            )}
          >
            <div className="flex items-start gap-2 mb-1.5">
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${template.color}20` }}
              >
                <template.icon className="w-3.5 h-3.5" style={{ color: template.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[12px] text-gray-900 leading-tight">{template.name}</h3>
                <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5 leading-tight">
                  {template.description}
                </p>
              </div>
            </div>
            {template.entities.length > 0 && (
              <div className="flex items-center gap-1 text-[9px] text-gray-400 pl-9">
                <Database className="w-2.5 h-2.5" />
                <span>{template.entities.length} entities</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export { templates };