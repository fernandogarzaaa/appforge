import React from 'react';
import { 
  Database, ShoppingCart, Users, FileText, Sparkles, Globe, Briefcase,
  Heart, Calendar, GraduationCap, Utensils, Dumbbell, Building2,
  Ticket, MessageSquare, TrendingUp, Zap, Gamepad2, Music, Camera,
  Coins, Wallet, Lock, GitBranch, BarChart3, Layers
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
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    description: 'Properties, listings, and client management',
    icon: Building2,
    color: '#7c3aed',
    entities: ['Property', 'Listing', 'Client', 'Viewing'],
    pages: ['Properties', 'Clients', 'Calendar']
  },
  {
    id: 'hr-management',
    name: 'HR Management',
    description: 'Employees, payroll, and performance tracking',
    icon: Users,
    color: '#0891b2',
    entities: ['Employee', 'Department', 'Payroll', 'Leave'],
    pages: ['Employees', 'Departments', 'Reports']
  },
  {
    id: 'inventory',
    name: 'Inventory System',
    description: 'Stock management and warehouse operations',
    icon: Database,
    color: '#059669',
    entities: ['Product', 'Stock', 'Warehouse', 'Supplier'],
    pages: ['Inventory', 'Warehouses', 'Reports']
  },
  {
    id: 'helpdesk',
    name: 'Help Desk',
    description: 'Support tickets and customer service',
    icon: MessageSquare,
    color: '#ea580c',
    entities: ['Ticket', 'Customer', 'Agent', 'KnowledgeBase'],
    pages: ['Tickets', 'Customers', 'Knowledge']
  },
  {
    id: 'recruitment',
    name: 'Recruitment ATS',
    description: 'Job postings, candidates, and hiring pipeline',
    icon: Briefcase,
    color: '#4f46e5',
    entities: ['Job', 'Candidate', 'Interview', 'Application'],
    pages: ['Jobs', 'Candidates', 'Pipeline']
  },
  {
    id: 'legal',
    name: 'Legal Case Manager',
    description: 'Cases, clients, and legal document tracking',
    icon: FileText,
    color: '#dc2626',
    entities: ['Case', 'Client', 'Document', 'Hearing'],
    pages: ['Cases', 'Clients', 'Documents']
  },
  {
    id: 'hotel',
    name: 'Hotel Management',
    description: 'Rooms, bookings, and guest services',
    icon: Building2,
    color: '#d946ef',
    entities: ['Room', 'Booking', 'Guest', 'Service'],
    pages: ['Rooms', 'Bookings', 'Guests']
  },
  {
    id: 'library',
    name: 'Library System',
    description: 'Books, members, and lending management',
    icon: FileText,
    color: '#0d9488',
    entities: ['Book', 'Member', 'Loan', 'Category'],
    pages: ['Catalog', 'Members', 'Loans']
  },
  {
    id: 'medical',
    name: 'Medical Clinic',
    description: 'Patients, appointments, and medical records',
    icon: Heart,
    color: '#be123c',
    entities: ['Patient', 'Appointment', 'Doctor', 'Record'],
    pages: ['Patients', 'Appointments', 'Records']
  },
  {
    id: 'delivery',
    name: 'Delivery Tracker',
    description: 'Orders, drivers, and route optimization',
    icon: ShoppingCart,
    color: '#7c3aed',
    entities: ['Delivery', 'Driver', 'Route', 'Customer'],
    pages: ['Deliveries', 'Drivers', 'Routes']
  },
  {
    id: 'wedding',
    name: 'Wedding Planner',
    description: 'Events, vendors, and guest management',
    icon: Heart,
    color: '#ec4899',
    entities: ['Event', 'Vendor', 'Guest', 'Budget'],
    pages: ['Events', 'Vendors', 'Guests']
  },
  {
    id: 'photography',
    name: 'Photography Studio',
    description: 'Sessions, galleries, and client bookings',
    icon: Globe,
    color: '#ea580c',
    entities: ['Session', 'Gallery', 'Client', 'Package'],
    pages: ['Sessions', 'Galleries', 'Clients']
  },
  {
    id: 'defi-protocol',
    name: 'DeFi Protocol',
    description: 'Lending, staking, and liquidity pools',
    icon: TrendingUp,
    color: '#10b981',
    entities: ['DeFiProtocol', 'Token', 'Transaction'],
    pages: ['DeFiHub', 'Dashboard']
  },
  {
    id: 'dao-platform',
    name: 'DAO Platform',
    description: 'Governance, proposals, and voting',
    icon: Users,
    color: '#6366f1',
    entities: ['DAO', 'Proposal', 'Vote', 'Token'],
    pages: ['DAOGovernance', 'Dashboard']
  },
  {
    id: 'nft-marketplace',
    name: 'NFT Marketplace',
    description: 'Collections, minting, and trading platform',
    icon: Camera,
    color: '#8b5cf6',
    entities: ['NFTCollection', 'Token', 'Transaction'],
    pages: ['NFTStudio', 'Web3Dashboard']
  },
  {
    id: 'token-launchpad',
    name: 'Token Launchpad',
    description: 'ICO/IDO platform with token creation',
    icon: Coins,
    color: '#f59e0b',
    entities: ['Token', 'SmartContract', 'Transaction'],
    pages: ['TokenCreator', 'Web3Dashboard']
  },
  {
    id: 'blockchain-explorer',
    name: 'Blockchain Explorer',
    description: 'Transactions, blocks, and address tracking',
    icon: BarChart3,
    color: '#06b6d4',
    entities: ['Transaction', 'Wallet', 'SmartContract'],
    pages: ['Web3Dashboard', 'Dashboard']
  },
  {
    id: 'web3-gaming',
    name: 'Web3 Gaming',
    description: 'NFT items, play-to-earn mechanics',
    icon: Gamepad2,
    color: '#ec4899',
    entities: ['NFTCollection', 'Token', 'Transaction'],
    pages: ['NFTStudio', 'Dashboard']
  },
  {
    id: 'crypto-wallet',
    name: 'Crypto Wallet',
    description: 'Multi-chain wallet and portfolio tracker',
    icon: Wallet,
    color: '#14b8a6',
    entities: ['Wallet', 'Token', 'Transaction'],
    pages: ['Web3Dashboard', 'Dashboard']
  },
  {
    id: 'staking-platform',
    name: 'Staking Platform',
    description: 'Token staking and rewards distribution',
    icon: Lock,
    color: '#a855f7',
    entities: ['Token', 'SmartContract', 'Transaction'],
    pages: ['TokenCreator', 'DeFiHub']
  },
  {
    id: 'dex-platform',
    name: 'DEX Platform',
    description: 'Decentralized token swaps and liquidity',
    icon: GitBranch,
    color: '#f43f5e',
    entities: ['Token', 'DeFiProtocol', 'Transaction'],
    pages: ['DeFiHub', 'Web3Dashboard']
  },
  {
    id: 'bridge-protocol',
    name: 'Bridge Protocol',
    description: 'Cross-chain asset transfers',
    icon: Layers,
    color: '#0891b2',
    entities: ['Token', 'Transaction', 'SmartContract'],
    pages: ['Web3Dashboard', 'TokenCreator']
  }
];

export default function ProjectTemplates({ onSelect, selected }) {
  console.log('Rendering templates:', templates.length);
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