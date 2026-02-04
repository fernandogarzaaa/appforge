import React from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useNavigation } from '@/contexts/NavigationContext';

export default function Breadcrumbs({ items } = {}) {
  const { breadcrumbs } = useNavigation();
  const trail = items ?? breadcrumbs;

  if (!trail || trail.length === 0) return null;

  // On mobile, show only the last 2 breadcrumbs
  const displayTrail = trail.length > 2 ? [{ label: '...', path: '#' }, ...trail.slice(-2)] : trail;

  return (
    <Breadcrumb className="text-xs sm:text-sm">
      <BreadcrumbList className="gap-1 sm:gap-2">
        {displayTrail.map((crumb, index) => {
          const isLast = index === displayTrail.length - 1;
          const isDots = crumb.label === '...';
          
          return (
            <React.Fragment key={crumb.path || crumb.label}>
              <BreadcrumbItem className="flex items-center">
                {isLast || isDots ? (
                  <BreadcrumbPage className="text-gray-600 dark:text-gray-400">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    asChild
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  >
                    <Link to={crumb.path} className="truncate max-w-[100px] sm:max-w-none">
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="dark:text-gray-700" />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
