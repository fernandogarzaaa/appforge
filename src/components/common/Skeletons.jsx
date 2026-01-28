/**
 * Enhanced Skeleton Components
 * Reusable loading skeletons for different UI patterns
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Card Skeleton
export function CardSkeleton({ className }) {
  return (
    <div className={cn("rounded-xl border bg-white dark:bg-gray-900 p-6 space-y-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

// List Item Skeleton
export function ListItemSkeleton({ className }) {
  return (
    <div className={cn("flex items-center gap-3 p-4 border-b last:border-b-0", className)}>
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 4, className }) {
  return (
    <tr className={cn("border-b", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// Form Field Skeleton
export function FormFieldSkeleton({ className }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

// Stats Card Skeleton
export function StatsCardSkeleton({ className }) {
  return (
    <div className={cn("rounded-xl border bg-white dark:bg-gray-900 p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

// Project Card Skeleton
export function ProjectCardSkeleton({ className }) {
  return (
    <div className={cn("rounded-xl border bg-white dark:bg-gray-900 p-6 space-y-4", className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

// Page Header Skeleton
export function PageHeaderSkeleton({ className }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}

// Chat Message Skeleton
export function ChatMessageSkeleton({ isUser = false, className }) {
  return (
    <div className={cn("flex gap-4", isUser ? "justify-end" : "justify-start", className)}>
      {!isUser && <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />}
      <div className={cn("max-w-[70%] space-y-2", isUser && "items-end")}>
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
      {isUser && <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />}
    </div>
  );
}

// Settings Section Skeleton
export function SettingsSectionSkeleton({ className }) {
  return (
    <div className={cn("rounded-xl border bg-white dark:bg-gray-900 p-6 space-y-6", className)}>
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Dashboard Grid Skeleton
export function DashboardSkeleton({ className }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <PageHeaderSkeleton />
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Projects Grid */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Generic Loading Skeleton with count
export function LoadingSkeleton({ 
  count = 3, 
  type = 'card',
  className 
}) {
  const components = {
    card: CardSkeleton,
    list: ListItemSkeleton,
    form: FormFieldSkeleton,
    stats: StatsCardSkeleton,
    project: ProjectCardSkeleton,
  };
  
  const Component = components[type] || CardSkeleton;
  
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}

export default {
  Card: CardSkeleton,
  ListItem: ListItemSkeleton,
  TableRow: TableRowSkeleton,
  FormField: FormFieldSkeleton,
  StatsCard: StatsCardSkeleton,
  ProjectCard: ProjectCardSkeleton,
  PageHeader: PageHeaderSkeleton,
  ChatMessage: ChatMessageSkeleton,
  SettingsSection: SettingsSectionSkeleton,
  Dashboard: DashboardSkeleton,
  Loading: LoadingSkeleton,
};
